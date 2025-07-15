import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Millat Umidi Telegram Bot Service - Ready!';
  }
}