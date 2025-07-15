import { Controller, Get, Param, Res, HttpStatus, Inject, Logger } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';

// If you have a bot instance, inject it here. Otherwise, fallback to HTTP API.
// import { Telegraf } from 'telegraf';
// @Inject('TELEGRAM_BOT') private readonly bot: Telegraf

@Controller('file')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Res() res: Response) {
    try {
      // If you have a bot instance, use bot.telegram.getFileLink
      // Otherwise, fallback to HTTP API
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      let fileUrl: string;
      try {
        // Try to use HTTP API to get file link
        const fileInfoResp = await axios.get(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
        );
        const filePath = fileInfoResp.data.result.file_path;
        fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
      } catch (e) {
        this.logger.error(`Failed to get file info for file_id ${fileId}: ${e.message}`);
        return res.status(HttpStatus.NOT_FOUND).send('File info not found');
      }

      // Use fetch to get the file buffer (as in your example)
      try {
        const fetch = (await import('node-fetch')).default;
        const fileResp = await fetch(fileUrl);
        if (!fileResp.ok) {
          this.logger.error(`Failed to fetch file from Telegram: ${fileResp.statusText}`);
          return res.status(HttpStatus.NOT_FOUND).send('File not found');
        }
        const buffer = await fileResp.arrayBuffer();
        res.status(HttpStatus.OK).end(Buffer.from(buffer));
      } catch (e) {
        this.logger.error(`Failed to download file for file_id ${fileId}: ${e.message}`);
        res.status(HttpStatus.NOT_FOUND).send(e.message);
      }
    } catch (e) {
      res.status(HttpStatus.NOT_FOUND).send(e.message);
    }
  }
} 