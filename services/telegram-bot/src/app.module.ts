import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookController } from './webhook.controller';
import { FileController } from './file.controller';

@Module({
  imports: [],
  controllers: [AppController, WebhookController, FileController],
  providers: [AppService],
})
export class AppModule {}