import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import OpenAI from 'openai';
import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

const CHUNK_CHAR_SIZE = 1000;
const CHUNK_CHAR_OVERLAP = 200;

let pdfParse; // lazy
let mammoth; // lazy

export async function processUpload(buffer, fileName, mimeType, positionId, params = {}) {
  // 1. Persist file to storage (S3, local, etc.) – omitted here.

  // 2. Extract raw text first (needed for DB record)
  const rawText = await extractText(buffer, mimeType, fileName);

  // 3. Create Document record with content preview (first 10k chars to avoid overflow)
  const document = await prisma.document.create({
    data: {
      positionId,
      fileUrl: fileName, // placeholder, replace with real URL if using S3
      fileType: mimeType,
      content: rawText.slice(0, 10000), // store preview for AI context,
    }
  });

  // 4. Chunk text
  const chunks = chunkText(rawText, CHUNK_CHAR_SIZE, CHUNK_CHAR_OVERLAP);

  // 5. Generate embeddings & store
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embed = await createEmbedding(chunk);

    // Insert using raw SQL to cast array to vector type
    await prisma.$executeRaw`INSERT INTO document_chunks (id, document_id, content, embedding, created_at) VALUES (gen_random_uuid(), ${document.id}::uuid, ${chunk}, ${embed}::vector, now())`;
  }

  // update chunk_count field
  await prisma.document.update({ where: { id: document.id }, data: { chunk_count: chunks.length } });

  /* -------------------------------------------------
      🔎  Post-processing: generate summary & update
  --------------------------------------------------*/
  try {
    // Condense content (first 8k chars) for summarisation
    const summaryPrompt = `You are an HR assistant. Summarise the following position-related document for display on a careers page. Keep it concise (max 120 words) and engaging.\n\nContent:\n"""${rawText.slice(0, 8000)}"""`;
    const chatResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: summaryPrompt }
      ],
      temperature: 0.5,
      max_tokens: 160
    });
    const summary = chatResp.choices?.[0]?.message?.content?.trim();
    
    /* -------------------------------------------------
      🔎  Generate position-specific interview questions
    --------------------------------------------------*/
    console.log('[OpenAI][Questions] Generating position-specific interview questions');
    const questionsPrompt = `You are an expert technical recruiter. Based on the following position document, extract core responsibilities, requirements, and competencies. Then generate 10 structured interview questions that will help assess if a candidate is a good fit for this role.

Content:
"""${rawText.slice(0, 8000)}"""

Return your response as a JSON array with exactly 10 questions. Each question should have the following structure:
{
  "id": "q1", // q1 through q10
  "question": "The full text of the interview question",
  "type": "technical" | "behavioral" | "scenario" | "motivation",
  "skill": "The primary skill or competency being assessed"
}`;

    const questionsResp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert technical recruiter. Reply ONLY with valid JSON.' },
        { role: 'user', content: questionsPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const questionsText = questionsResp.choices?.[0]?.message?.content?.trim();
    let questions;
    
    try {
      // Parse and validate the questions
      const parsed = JSON.parse(questionsText);
      questions = Array.isArray(parsed.questions) ? parsed.questions : 
                 (Array.isArray(parsed) ? parsed : null);
      
      if (!questions || questions.length !== 10) {
        throw new Error('Invalid questions format or count');
      }
      
      // Ensure each question has the required fields
      questions = questions.map((q, idx) => ({
        id: q.id || `q${idx + 1}`,
        question: q.question || 'No question text provided',
        type: q.type || 'behavioral',
        skill: q.skill || 'general'
      }));
      
      console.log('[OpenAI][Questions] Successfully generated 10 questions');
    } catch (parseErr) {
      console.error('[OpenAI][Questions] Failed to parse questions:', parseErr.message);
      console.log('[OpenAI][Questions] Raw response:', questionsText);
      
      // Create fallback questions if parsing fails
      questions = Array(10).fill(0).map((_, idx) => ({
        id: `q${idx + 1}`,
        question: `Question ${idx + 1}: Please describe your experience related to this position.`,
        type: 'behavioral',
        skill: 'general'
      }));
    }
    
    // Update position with summary and questions
    await prisma.position.update({ 
      where: { id: positionId }, 
      data: { 
        description: summary || undefined,
        phase2Questions: questions
      } 
    });
    
    console.log('[OpenAI] Updated position with description and phase2Questions');
  } catch (e) {
    console.warn('[OpenAI][Processing] Failed to generate content:', e.message);
  }

  // 6. Save training params if provided
  if (Object.keys(params).length) {
    await prisma.document.update({
      where: { id: document.id },
      data: { trainingParams: params }
    });
  }

  return { success: true, documentId: document.id, chunks: chunks.length };
}

export async function getChunksForPosition(positionId, limit = 50) {
  return prisma.$queryRaw`SELECT dc.id, dc.content, dc.embedding FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE d.position_id = ${positionId}::uuid LIMIT ${limit}`;
}

export async function similaritySearch(positionId, query, topK = 10) {
  const queryEmbedding = await createEmbedding(query);
  // pgvector cosine distance (<->) smaller is closer
  return prisma.$queryRaw`SELECT dc.content, (dc.embedding <-> ${queryEmbedding}::vector) AS score FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE d.position_id = ${positionId}::uuid ORDER BY dc.embedding <-> ${queryEmbedding}::vector LIMIT ${topK}`;
}

/* Helpers */
async function extractText(buffer, mimeType, fileName = '') {
  if (mimeType === 'application/pdf') {
    if (!pdfParse) {
      pdfParse = require('pdf-parse');
    }
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (!mammoth) {
      mammoth = require('mammoth');
    }
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (mimeType === 'text/markdown' || fileName.endsWith('.md')) {
    const md = buffer.toString('utf-8');
    return marked.parse(md).replace(/<[^>]+>/g, '');
  }
  // Default plain text
  return buffer.toString('utf-8');
}

function chunkText(text, size, overlap) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + size);
    chunks.push(text.substring(start, end));
    start += size - overlap;
  }
  return chunks;
}

async function createEmbedding(text) {
  console.log('[OpenAI][Embeddings] Text snippet:', text.substring(0,200).replace(/\n/g,' '));
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8191) // token safety
  });
  console.log('[OpenAI][Embeddings] Vector length:', response.data[0].embedding.length);
  return `[${response.data[0].embedding.join(',')}]`;
} 