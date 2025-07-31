import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { TelegramFileStorage } from '../services/fileStorage.js';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';
const TELEGRAM_BOT_TOKEN = '7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY';

// Initialize file storage
TelegramFileStorage.setBotToken(TELEGRAM_BOT_TOKEN);

interface BitrixContact {
  ID: string;
  NAME: string;
  UF_CRM_1752621810?: string; // Resume field
  UF_CRM_1752621831?: string; // Diploma field
  UF_CRM_1752621857?: string; // Voice Q1 field
  UF_CRM_1752621874?: string; // Voice Q2 field
  UF_CRM_1752621887?: string; // Voice Q3 field
}

/**
 * Get specific contact from Bitrix24
 */
async function getContact(contactId: string): Promise<BitrixContact | null> {
  console.log(`🔍 [UPDATE] Fetching contact ${contactId} from Bitrix24...`);
  
  try {
    const response = await axios.get(`${BITRIX_BASE}/crm.contact.get.json`, {
      params: {
        id: contactId,
        select: [
          'ID', 'NAME', 
          'UF_CRM_1752621810', // Resume
          'UF_CRM_1752621831', // Diploma
          'UF_CRM_1752621857', // Voice Q1
          'UF_CRM_1752621874', // Voice Q2
          'UF_CRM_1752621887'  // Voice Q3
        ]
      },
      timeout: 15000
    });

    if (response.data && response.data.result) {
      const contact = response.data.result as BitrixContact;
      console.log(`✅ [UPDATE] Found contact ${contactId}: ${contact.NAME}`);
      return contact;
    } else {
      console.log(`❌ [UPDATE] Contact ${contactId} not found`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ [UPDATE] Error fetching contact ${contactId}:`, error.message);
    return null;
  }
}

/**
 * Check if a field contains a Telegram file ID or URL that needs conversion
 */
function isTelegramFile(value: string): boolean {
  if (!value) return false;
  // Only process Telegram file URLs (not permanent URLs that we've already created)
  return value.includes('api.telegram.org/file/bot') && !value.includes('/uploads/telegram-files/');
}

/**
 * Extract file ID from Telegram file URL
 */
function extractFileIdFromUrl(url: string): string | null {
  // Extract file ID from URL like: https://api.telegram.org/file/bot7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY/documents/file_97.docx
  const match = url.match(/\/file\/bot[^\/]+\/(.+)$/);
  if (match) {
    // Use the file path as the file ID for conversion
    return match[1]; // e.g., "documents/file_97.docx"
  }
  return null;
}

/**
 * Update specific contact with permanent file URLs
 */
async function updateContactFiles(contactId: string): Promise<boolean> {
  console.log(`\n📋 [UPDATE] Processing contact ${contactId}...`);
  
  // Get contact data
  const contact = await getContact(contactId);
  if (!contact) {
    console.log(`❌ [UPDATE] Skipping contact ${contactId} - not found`);
    return false;
  }

  const updatedFields: any = {};
  let hasChanges = false;

  console.log(`📋 [UPDATE] Contact ${contactId}: ${contact.NAME}`);
  console.log(`  📄 Resume: ${contact.UF_CRM_1752621810 || 'None'}`);
  console.log(`  🎓 Diploma: ${contact.UF_CRM_1752621831 || 'None'}`);
  console.log(`  🎧 Voice Q1: ${contact.UF_CRM_1752621857 || 'None'}`);
  console.log(`  🎧 Voice Q2: ${contact.UF_CRM_1752621874 || 'None'}`);
  console.log(`  🎧 Voice Q3: ${contact.UF_CRM_1752621887 || 'None'}`);

  // Process resume field
  if (contact.UF_CRM_1752621810 && isTelegramFile(contact.UF_CRM_1752621810)) {
    console.log(`  📄 Processing resume file: ${contact.UF_CRM_1752621810}`);
    
    // Force download and conversion to permanent URL using direct file download
    try {
      const botToken = '7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY';
      
      // Download file directly from the URL
      const response = await axios.get(contact.UF_CRM_1752621810, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Generate unique filename and save locally
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const filename = `contact-${contactId}_resume_${timestamp}_${uniqueId}.docx`;
      const filePath = path.join(process.cwd(), 'uploads', 'telegram-files', filename);
      
      // Ensure directory exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'telegram-files');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Write file to disk
      fs.writeFileSync(filePath, response.data);
      
      // Create permanent URL
      const permanentUrl = `https://career.millatumidi.uz/uploads/telegram-files/${filename}`;
      
      updatedFields.UF_CRM_1752621810 = permanentUrl;
      hasChanges = true;
      console.log(`  ✅ Resume converted to permanent URL: ${permanentUrl}`);
      
    } catch (error: any) {
      console.log(`  ❌ Resume conversion error: ${error.message}`);
    }
  }

  // Process diploma field
  if (contact.UF_CRM_1752621831 && isTelegramFile(contact.UF_CRM_1752621831)) {
    console.log(`  🎓 Processing diploma file: ${contact.UF_CRM_1752621831}`);
    
    // Force download and conversion to permanent URL using direct file download
    try {
      // Download file directly from the URL
      const response = await axios.get(contact.UF_CRM_1752621831, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Generate unique filename and save locally
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const filename = `contact-${contactId}_diploma_${timestamp}_${uniqueId}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'telegram-files', filename);
      
      // Ensure directory exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'telegram-files');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Write file to disk
      fs.writeFileSync(filePath, response.data);
      
      // Create permanent URL
      const permanentUrl = `https://career.millatumidi.uz/uploads/telegram-files/${filename}`;
      
      updatedFields.UF_CRM_1752621831 = permanentUrl;
      hasChanges = true;
      console.log(`  ✅ Diploma converted to permanent URL: ${permanentUrl}`);
      
    } catch (error: any) {
      console.log(`  ❌ Diploma conversion error: ${error.message}`);
    }
  }

  // Process voice files
  const voiceFields = [
    { field: 'UF_CRM_1752621857', name: 'voice_q1' },
    { field: 'UF_CRM_1752621874', name: 'voice_q2' },
    { field: 'UF_CRM_1752621887', name: 'voice_q3' }
  ];

  for (const voiceField of voiceFields) {
    const currentValue = (contact as any)[voiceField.field];
    if (currentValue && isTelegramFile(currentValue)) {
      console.log(`  🎧 Processing ${voiceField.name}: ${currentValue}`);
      
      // Force download and conversion to permanent URL using direct file download
      try {
        // Download file directly from the URL
        const response = await axios.get(currentValue, {
          responseType: 'arraybuffer',
          timeout: 30000
        });

        // Generate unique filename and save locally
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const uniqueId = Math.random().toString(36).substring(2, 10);
        const filename = `contact-${contactId}_${voiceField.name}_${timestamp}_${uniqueId}.oga`;
        const filePath = path.join(process.cwd(), 'uploads', 'telegram-files', filename);
        
        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'uploads', 'telegram-files');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Write file to disk
        fs.writeFileSync(filePath, response.data);
        
        // Create permanent URL
        const permanentUrl = `https://career.millatumidi.uz/uploads/telegram-files/${filename}`;
        
        updatedFields[voiceField.field] = permanentUrl;
        hasChanges = true;
        console.log(`  ✅ ${voiceField.name} converted to permanent URL: ${permanentUrl}`);
        
      } catch (error: any) {
        console.log(`  ❌ ${voiceField.name} conversion error: ${error.message}`);
      }
    }
  }

  // Update contact in Bitrix24 if there are changes
  if (hasChanges) {
    try {
      console.log(`  🔄 Updating contact ${contactId} in Bitrix24...`);
      
      const updatePayload = {
        id: contactId,
        fields: updatedFields
      };

      const response = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && response.data.result) {
        console.log(`  ✅ Contact ${contactId} updated successfully with permanent URLs`);
        return true;
      } else {
        console.log(`  ❌ Failed to update contact ${contactId}: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error: any) {
      console.error(`  ❌ Error updating contact ${contactId}:`, error.message);
      return false;
    }
  } else {
    console.log(`  ✅ Contact ${contactId} - no Telegram files to convert or already converted`);
    return true;
  }
}

/**
 * Update specific contacts with permanent file URLs
 */
export async function updateSpecificContacts(contactIds: string[]): Promise<void> {
  console.log('🚀 [UPDATE] Starting specific contact file URL updates...');
  console.log(`🎯 [UPDATE] Target contacts: ${contactIds.join(', ')}`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let i = 0; i < contactIds.length; i++) {
      const contactId = contactIds[i];
      console.log(`\n📍 [UPDATE] Progress: ${i + 1}/${contactIds.length}`);
      
      const success = await updateContactFiles(contactId);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Small delay between contacts
      if (i < contactIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ [UPDATE] Specific contact updates completed!');
    console.log(`📊 [UPDATE] Results:`);
    console.log(`  - Contacts processed: ${contactIds.length}`);
    console.log(`  - Successful updates: ${successCount}`);
    console.log(`  - Failed updates: ${failureCount}`);
    console.log(`  - Duration: ${duration} seconds`);
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ [UPDATE] Update process failed:', error.message);
    throw error;
  }
}

/**
 * Run update for specific contacts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetContacts = ['71227', '71115'];
  
  updateSpecificContacts(targetContacts)
    .then(() => {
      console.log('🎉 [UPDATE] Contact update script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 [UPDATE] Contact update script failed:', error);
      process.exit(1);
    });
}