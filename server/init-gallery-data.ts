import { storage } from './storage';
import { createLogger } from '../client/src/lib/logger';

const logger = createLogger('init-gallery-data');

export async function initializeGalleryData() {
  try {
    logger.info('Starting gallery data initialization');
    
    // Check if gallery items already exist
    const existingItems = await storage.getAllGalleryItems();
    if (existingItems.length > 0) {
      logger.info('Gallery items already exist, skipping initialization');
      return;
    }

    const galleryItems = [
      {
        title: 'Team Collaboration Session',
        description: 'Our development team working together on innovative educational solutions, showcasing our collaborative approach to building the future of education.',
        category: 'teamwork',
        imageUrl: '/attached_assets/khan academy_1752572141948.png',
        tags: ['collaboration', 'development', 'innovation'],
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Leadership Excellence',
        description: 'Meet our founder and CEO, driving the vision of transforming education across Uzbekistan with cutting-edge technology and passionate leadership.',
        category: 'culture',
        imageUrl: '/attached_assets/Umidjon_aka-removebg-preview_1752578772239.png',
        tags: ['leadership', 'vision', 'education'],
        isActive: true,
        sortOrder: 2
      },
      {
        title: 'Educational Innovation Hub',
        description: 'Our modern workspace where creativity meets technology, fostering an environment of continuous learning and educational excellence.',
        category: 'workspace',
        imageUrl: '/attached_assets/Umidjon aka_1752577894019.jpg',
        tags: ['innovation', 'workspace', 'technology'],
        isActive: true,
        sortOrder: 3
      },
      {
        title: 'Team Building Excellence',
        description: 'Celebrating our diverse team of educators, developers, and innovators who work together to create exceptional learning experiences.',
        category: 'culture',
        imageUrl: '/attached_assets/khan academy_1752572141948.png',
        tags: ['team', 'diversity', 'culture'],
        isActive: true,
        sortOrder: 4
      },
      {
        title: 'Product Development Workshop',
        description: 'Behind-the-scenes look at our product development process, where we design and build educational tools that make learning engaging and effective.',
        category: 'teamwork',
        imageUrl: '/attached_assets/Umidjon aka_1752577894019.jpg',
        tags: ['product', 'development', 'education'],
        isActive: true,
        sortOrder: 5
      },
      {
        title: 'Innovation Awards Ceremony',
        description: 'Celebrating our achievements in educational technology and recognizing the outstanding contributions of our team members.',
        category: 'events',
        imageUrl: '/attached_assets/Umidjon_aka-removebg-preview_1752578772239.png',
        tags: ['awards', 'recognition', 'achievement'],
        isActive: true,
        sortOrder: 6
      }
    ];

    logger.info(`Creating ${galleryItems.length} gallery items`);
    
    for (const item of galleryItems) {
      try {
        await storage.createGalleryItem(item);
        logger.info(`Created gallery item: ${item.title}`);
      } catch (error) {
        logger.error(`Failed to create gallery item: ${item.title}`, error);
      }
    }

    logger.info('Gallery data initialization completed successfully');
  } catch (error) {
    logger.error('Failed to initialize gallery data', error);
  }
}