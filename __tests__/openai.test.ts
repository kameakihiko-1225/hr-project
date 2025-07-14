// Mock env to avoid import.meta usage during tests
jest.mock('../src/lib/env', () => ({ env: { openaiApiKey: '' } }));

// Mock OpenAI SDK before importing wrapper
const embeddingsCreateMock = jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
const chatCompletionsCreateMock = jest.fn().mockResolvedValue({ choices: [{ message: { content: 'Hello!' } }] });

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: { create: embeddingsCreateMock },
      chat: { completions: { create: chatCompletionsCreateMock } },
    })),
  };
});

import { generateEmbedding, chatCompletion } from '../src/lib/openai';

describe('openai wrapper', () => {
  it('generateEmbedding returns vector', async () => {
    const vec = await generateEmbedding('test');
    expect(vec).toEqual([0.1, 0.2]);
    expect(embeddingsCreateMock).toHaveBeenCalled();
  });

  it('chatCompletion returns content', async () => {
    const content = await chatCompletion([{ role: 'user', content: 'Hi' }], 'gpt-3.5-turbo-0125');
    expect(content).toBe('Hello!');
    expect(chatCompletionsCreateMock).toHaveBeenCalled();
  });
}); 