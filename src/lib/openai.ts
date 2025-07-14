import { env } from './env';
import { createLogger } from './logger';
import OpenAI from 'openai';

const logger = createLogger('openai');

if (!env.openaiApiKey) {
  logger.warn('OpenAI key is missing – API calls will fail');
}

const openai = new OpenAI({
  apiKey: env.openaiApiKey,
});

export async function generateEmbedding(input: string): Promise<number[]> {
  try {
    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input,
    });
    return resp.data[0].embedding;
  } catch (error) {
    logger.error('Embedding error', error);
    throw error;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[], model = 'gpt-3.5-turbo-0125', temperature = 0.7): Promise<string> {
  try {
    const resp = await openai.chat.completions.create({
      model,
      messages,
      temperature,
    });
    const content = resp.choices[0].message?.content || '';
    return content;
  } catch (error) {
    logger.error('Chat completion error', error);
    throw error;
  }
}

export default {
  generateEmbedding,
  chatCompletion,
}; 