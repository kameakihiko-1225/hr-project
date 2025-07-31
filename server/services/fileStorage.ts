import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'telegram-files');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`📁 [FILE-STORAGE] Created directory: ${UPLOADS_DIR}`);
}

export interface FileDownloadResult {
  success: boolean;
  permanentUrl?: string;
  originalFileId?: string;
  error?: string;
}

export class TelegramFileStorage {
  private static botToken: string | null = null;

  static setBotToken(token: string) {
    this.botToken = token;
  }

  static getBotToken(): string | null {
    if (!this.botToken) {
      // Try to get from environment
      this.botToken = process.env.TELEGRAM_BOT_TOKEN || '7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY';
    }
    return this.botToken;
  }

  /**
   * Download file from Telegram and store it permanently
   */
  static async downloadAndStorePermanently(
    fileId: string, 
    fieldName: string = 'file',
    contactId?: string
  ): Promise<FileDownloadResult> {
    try {
      const botToken = this.getBotToken();
      if (!botToken) {
        console.log('❌ [FILE-STORAGE] No bot token available');
        return { success: false, error: 'No bot token available', originalFileId: fileId };
      }

      // Step 1: Get file info from Telegram
      console.log(`📥 [FILE-STORAGE] Getting file info for ${fieldName}: ${fileId}`);
      const fileInfo = await this.getTelegramFileInfo(fileId);
      
      if (!fileInfo) {
        console.log(`❌ [FILE-STORAGE] Could not get file info for ${fieldName}: ${fileId}`);
        return { success: false, error: 'Could not get file info', originalFileId: fileId };
      }

      // Step 2: Download file content
      console.log(`📥 [FILE-STORAGE] Downloading file from: ${fileInfo.file_path}`);
      const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${botToken}/${fileInfo.file_path}`;
      
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout for file download
      });

      // Step 3: Generate unique filename and save locally
      const originalExtension = path.extname(fileInfo.file_path) || '.pdf';
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const uniqueId = uuidv4().substring(0, 8);
      const contactPrefix = contactId ? `contact-${contactId}_` : '';
      const filename = `${contactPrefix}${fieldName}_${timestamp}_${uniqueId}${originalExtension}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      // Step 4: Write file to disk
      fs.writeFileSync(filePath, response.data);
      
      // Step 5: Create permanent URL
      const permanentUrl = `https://career.millatumidi.uz/uploads/telegram-files/${filename}`;
      
      console.log(`✅ [FILE-STORAGE] File saved successfully: ${filename}`);
      console.log(`🔗 [FILE-STORAGE] Permanent URL: ${permanentUrl}`);
      
      return {
        success: true,
        permanentUrl,
        originalFileId: fileId
      };

    } catch (error: any) {
      console.error(`❌ [FILE-STORAGE] Error downloading ${fieldName}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        originalFileId: fileId 
      };
    }
  }

  /**
   * Get file information from Telegram API
   */
  private static async getTelegramFileInfo(fileId: string): Promise<{ file_path: string; file_size: number } | null> {
    const botToken = this.getBotToken();
    if (!botToken) {
      return null;
    }

    try {
      const response = await axios.get(
        `${TELEGRAM_API_BASE}/bot${botToken}/getFile?file_id=${fileId}`,
        { timeout: 10000 }
      );
      
      if (response.data.ok && response.data.result) {
        const fileInfo = response.data.result;
        return {
          file_path: fileInfo.file_path,
          file_size: fileInfo.file_size || 0
        };
      } else {
        console.log(`❌ [FILE-STORAGE] Telegram API error:`, response.data);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ [FILE-STORAGE] Error getting file info:`, error.message);
      return null;
    }
  }

  /**
   * Check if a string is a valid Telegram file ID
   */
  static isTelegramFileId(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    
    // Telegram file IDs are typically alphanumeric with underscores/hyphens
    // They don't contain spaces and are usually quite long
    const telegramFilePattern = /^[A-Za-z0-9_-]{10,}$/;
    return telegramFilePattern.test(str.trim());
  }

  /**
   * Process file field - download if it's a Telegram file ID, otherwise return as-is
   */
  static async processFileField(
    value: string,
    fieldName: string,
    contactId?: string
  ): Promise<string> {
    if (!this.isTelegramFileId(value)) {
      return value; // Return as-is if not a Telegram file ID
    }

    const result = await this.downloadAndStorePermanently(value, fieldName, contactId);
    
    if (result.success && result.permanentUrl) {
      return result.permanentUrl;
    } else {
      // Fallback to original value if download fails
      console.log(`⚠️ [FILE-STORAGE] Using fallback for ${fieldName}: ${value}`);
      return value;
    }
  }

  /**
   * Cleanup old files (optional - for maintenance)
   */
  static async cleanupOldFiles(daysOld: number = 30): Promise<void> {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      for (const filename of files) {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ [FILE-STORAGE] Cleaned up old file: ${filename}`);
        }
      }
    } catch (error: any) {
      console.error('❌ [FILE-STORAGE] Error during cleanup:', error.message);
    }
  }
}