import { createLogger } from './logger';
import prisma from './prisma';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('fileUpload');

/**
 * File upload configuration
 */
interface FileUploadConfig {
  maxSizeMB: number;
  allowedTypes: string[];
}

/**
 * Default configuration for file uploads
 */
const defaultConfig: FileUploadConfig = {
  maxSizeMB: 50, // Increased from 5MB to 50MB to remove size limitations
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
};

/**
 * Result of a file validation
 */
interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file against configuration
 */
export function validateFile(
  file: File, 
  config: Partial<FileUploadConfig> = {}
): FileValidationResult {
  const fullConfig = { ...defaultConfig, ...config };
  
  // Check file type
  if (!fullConfig.allowedTypes.includes(file.type)) {
    const error = `Invalid file type: ${file.type}. Allowed types: ${fullConfig.allowedTypes.join(', ')}`;
    logger.warn(error);
    return { valid: false, error };
  }
  
  // Check file size
  const maxSizeBytes = fullConfig.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const error = `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${fullConfig.maxSizeMB}MB`;
    logger.warn(error);
    return { valid: false, error };
  }
  
  return { valid: true };
}

/**
 * Create a local object URL for a file
 * Note: Remember to revoke the URL when no longer needed
 */
export function createLocalFileUrl(file: File): string {
  if (!file) {
    throw new Error('Cannot create URL for null or undefined file');
  }
  
  try {
    const url = URL.createObjectURL(file);
    logger.debug(`Created blob URL: ${url.substring(0, 30)}...`);
    return url;
  } catch (error) {
    logger.error('Error creating object URL', error);
    throw new Error('Failed to create local file URL');
  }
}

/**
 * Revoke a previously created object URL
 */
export function revokeLocalFileUrl(url: string): void {
  if (!url) {
    logger.warn('Attempted to revoke empty URL');
    return;
  }
  
  if (!url.startsWith('blob:')) {
    logger.warn(`Attempted to revoke non-blob URL: ${url.substring(0, 30)}...`);
    return;
  }
  
  try {
    URL.revokeObjectURL(url);
    logger.debug(`Revoked blob URL: ${url.substring(0, 30)}...`);
  } catch (error) {
    logger.error(`Error revoking URL: ${url.substring(0, 30)}...`, error);
    throw error;
  }
}

/**
 * Upload a file to database storage
 * Returns the URL path to access the file
 */
export async function uploadFile(file: File, companyId?: string): Promise<string> {
  try {
    logger.info(`Uploading file to database: ${file.name} (${file.size} bytes)`);
    
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Buffer for Prisma
    const buffer = Buffer.from(arrayBuffer);
    
    // Store file in database
    const storedFile = await prisma.fileStorage.create({
      data: {
        fileName: fileName,
        fileType: file.type,
        fileData: buffer,
        fileSize: file.size,
        companyId: companyId,
      },
    });
    
    // Generate a URL path to access the file
    const fileUrl = `/api/files/${storedFile.id}`;
    
    logger.info(`File uploaded successfully to database: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    logger.error('Error uploading file to database', error);
    throw error;
  }
}

/**
 * Resize an image file before upload to reduce size
 * Returns a new File object with the resized image
 */
export async function resizeImageFile(
  file: File, 
  maxWidth = 800, 
  maxHeight = 800, 
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      
      // Create a safe URL for the image
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          // Create a canvas element
          const canvas = document.createElement('canvas');
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * maxHeight / height);
              height = maxHeight;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            // Always revoke the object URL when done
            URL.revokeObjectURL(objectUrl);
            
            if (!blob) {
              reject(new Error('Could not create blob from canvas'));
              return;
            }
            
            // Create a new file from the blob
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            logger.debug(`Resized image from ${file.size} to ${resizedFile.size} bytes`);
            resolve(resizedFile);
          }, file.type, quality);
        } catch (canvasError) {
          URL.revokeObjectURL(objectUrl);
          logger.error('Error processing canvas', canvasError);
          reject(canvasError);
        }
      };
      
      img.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        logger.error('Failed to load image', error);
        reject(new Error('Failed to load image'));
      };
      
      // Load the image from the file
      img.src = objectUrl;
    } catch (error) {
      logger.error('Error in image resizing', error);
      reject(error);
    }
  });
} 