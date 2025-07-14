import { env } from './env.js';
import { createLogger } from './logger.js';
import OpenAI from 'openai';

const logger = createLogger('openai');
if (!env.openaiApiKey) logger.warn('OpenAI key is missing – API calls will fail');

const openai = new OpenAI({ apiKey: env.openaiApiKey });

export async function generateEmbedding(input) {
  const resp = await openai.embeddings.create({ model: 'text-embedding-3-small', input });
  return resp.data[0].embedding;
}

export async function chatCompletion(messages, model = 'gpt-3.5-turbo-0125', temperature = 0.7) {
  const resp = await openai.chat.completions.create({ model, messages, temperature });
  return resp.choices[0].message?.content || '';
}

export default { generateEmbedding, chatCompletion }; 