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
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80',
        tags: ['collaboration', 'development', 'innovation'],
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Leadership Excellence',
        description: 'Meet our founder and CEO, driving the vision of transforming education across Uzbekistan with cutting-edge technology and passionate leadership.',
        category: 'culture',
        imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
        tags: ['leadership', 'vision', 'education'],
        isActive: true,
        sortOrder: 2
      },
      {
        title: 'Educational Innovation Hub',
        description: 'Our modern workspace where creativity meets technology, fostering an environment of continuous learning and educational excellence.',
        category: 'workspace',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80',
        tags: ['innovation', 'workspace', 'technology'],
        isActive: true,
        sortOrder: 3
      },
      {
        title: 'Team Building Excellence',
        description: 'Celebrating our diverse team of educators, developers, and innovators who work together to create exceptional learning experiences.',
        category: 'culture',
        imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        tags: ['team', 'diversity', 'culture'],
        isActive: true,
        sortOrder: 4
      },
      {
        title: 'Product Development Workshop',
        description: 'Behind-the-scenes look at our product development process, where we design and build educational tools that make learning engaging and effective.',
        category: 'teamwork',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80',
        tags: ['product', 'development', 'education'],
        isActive: true,
        sortOrder: 5
      },
      {
        title: 'Innovation Awards Ceremony',
        description: 'Celebrating our achievements in educational technology and recognizing the outstanding contributions of our team members.',
        category: 'events',
        imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
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