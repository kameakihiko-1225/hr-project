import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'telegram-bot-service',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Millat Umidi Telegram Bot Service - Ready!');
});

// Main webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    
    // Log incoming data
    console.log('[TELEGRAM-BOT] Incoming webhook data:', JSON.stringify(data, null, 2));
    
    // For now, just acknowledge receipt
    console.log('[TELEGRAM-BOT] Webhook received successfully');
    
    return res.status(200).json({
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TELEGRAM-BOT] Error processing webhook:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const port = process.env.TELEGRAM_BOT_PORT || 3001;
app.listen(port, () => {
  console.log(`[TELEGRAM-BOT] Service running on port ${port}`);
  console.log(`[TELEGRAM-BOT] Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`[TELEGRAM-BOT] Health check: http://localhost:${port}/health`);
});