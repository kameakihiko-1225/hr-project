import { API_BASE_URL } from './api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Call backend /api/ai/chat
export async function aiChat(messages: ChatMessage[], model?: string, temperature?: number) {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, model, temperature }),
  });
  if (!res.ok) throw new Error('AI chat failed');
  const data = await res.json();
  return data.data.content as string;
}

// Call backend /api/ai/embedding
export async function aiEmbedding(input: string) {
  const res = await fetch(`${API_BASE_URL}/ai/embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error('Embedding failed');
  const data = await res.json();
  return data.data.vector as number[];
}