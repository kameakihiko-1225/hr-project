import { createLogger } from '@/lib/logger';
import prisma from '@/lib/prisma';

// Create a logger for the files handler
const logger = createLogger('filesHandler');

/**
 * Files Handler
 * Provides API endpoints for file operations
 */
export const filesHandler = {
  /**
   * Get a file by ID
   * GET /api/files/:id
   */
  async getFile(req: Request, id: string): Promise<Response> {
    try {
      logger.debug(`Getting file with ID: ${id}`);
      
      // Find the file in the database
      const file = await prisma.fileStorage.findUnique({
        where: { id }
      });
      
      if (!file) {
        logger.warn(`File not found: ${id}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'File not found',
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return the file data with appropriate content type
      logger.debug(`Found file: ${file.fileName} (${file.fileType})`);
      
      return new Response(
        file.fileData,
        { 
          status: 200,
          headers: { 
            'Content-Type': file.fileType,
            'Content-Disposition': `inline; filename="${file.fileName}"`,
            'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
          }
        }
      );
    } catch (error) {
      logger.error(`Error getting file with ID: ${id}`, error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get file',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Upload a file
   * POST /api/files
   */
  async uploadFile(req: Request): Promise<Response> {
    try {
      logger.debug('Uploading file');
      
      // Get form data from request
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const companyId = formData.get('companyId') as string;
      
      if (!file) {
        logger.warn('No file provided');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No file provided',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // Convert ArrayBuffer to Buffer for Prisma
      const buffer = Buffer.from(arrayBuffer);
      
      // Store file in database
      const storedFile = await prisma.fileStorage.create({
        data: {
          fileName: file.name,
          fileType: file.type,
          fileData: buffer,
          fileSize: file.size,
          companyId: companyId || undefined,
        },
      });
      
      // Generate a URL path to access the file
      const fileUrl = `/api/files/${storedFile.id}`;
      
      logger.info(`File uploaded successfully: ${fileUrl}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: storedFile.id,
            fileName: storedFile.fileName,
            fileType: storedFile.fileType,
            fileSize: storedFile.fileSize,
            fileUrl: fileUrl,
          },
        }),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Error uploading file', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to upload file',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

export default filesHandler; 