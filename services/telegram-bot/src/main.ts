import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for webhook access
  app.enableCors();
  
  const port = process.env.TELEGRAM_BOT_PORT || 3001;
  await app.listen(port);
  
  console.log(`[TELEGRAM-BOT] Service running on port ${port}`);
  console.log(`[TELEGRAM-BOT] Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`[TELEGRAM-BOT] Health check: http://localhost:${port}/health`);
}

bootstrap().catch(err => {
  console.error('[TELEGRAM-BOT] Failed to start service:', err);
  process.exit(1);
});