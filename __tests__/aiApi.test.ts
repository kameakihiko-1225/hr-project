import request from 'supertest';
import { app } from '../server.js';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: { create: jest.fn().mockResolvedValue({ data: [{ embedding: [0.5] }] }) },
      chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'Hi!' } }] }) } },
    })),
  };
});

describe('/api/ai endpoints', () => {
  it('POST /api/ai/embedding returns vector', async () => {
    const res = await request(app)
      .post('/api/ai/embedding')
      .send({ input: 'test' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vector).toEqual([0.5]);
  });

  it('POST /api/ai/chat returns content', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ messages: [{ role: 'user', content: 'Hello' }] })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Hi!');
  });
}); 