import { chatCompletion, generateEmbedding } from '../../lib/openai.js';

/**
 * POST /api/ai/chat
 * Body: { messages: [{ role, content }], model?, temperature? }
 */
export async function chat(req, res) {
  try {
    const { messages, model, temperature } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array required' });
    }
    const content = await chatCompletion(messages, model, temperature);
    return res.status(200).json({ success: true, data: { content } });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get completion' });
  }
}

/**
 * POST /api/ai/embedding
 * Body: { input: string }
 */
export async function embedding(req, res) {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ success: false, error: 'input required' });
    }
    const vector = await generateEmbedding(input);
    return res.status(200).json({ success: true, data: { vector } });
  } catch (error) {
    console.error('AI embedding error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate embedding' });
  }
} 