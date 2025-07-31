import axios from 'axios';
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
 * Get all contacts from Bitrix24 that might have Telegram file URLs
 */
async function getAllContactsWithFiles(): Promise<BitrixContact[]> {
  console.log('🔍 [MIGRATION] Fetching all contacts from Bitrix24...');
  
  try {
    const response = await axios.get(`${BITRIX_BASE}/crm.contact.list.json`, {
      params: {
        select: [
          'ID', 'NAME', 
          'UF_CRM_1752621810', // Resume
          'UF_CRM_1752621831', // Diploma
          'UF_CRM_1752621857', // Voice Q1
          'UF_CRM_1752621874', // Voice Q2
          'UF_CRM_1752621887'  // Voice Q3
        ],
        filter: {
          '!UF_CRM_1752621810': '', // Has resume field
        }
      },
      timeout: 30000
    });

    if (response.data && response.data.result) {
      const contacts = response.data.result as BitrixContact[];
      console.log(`✅ [MIGRATION] Found ${contacts.length} contacts with file fields`);
      return contacts;
    } else {
      console.log('❌ [MIGRATION] No contacts found or API error');
      return [];
    }
  } catch (error: any) {
    console.error('❌ [MIGRATION] Error fetching contacts:', error.message);
    return [];
  }
}

/**
 * Check if a URL is a Telegram file URL that might be expired
 */
function isTelegramFileUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('api.telegram.org/file/bot') || TelegramFileStorage.isTelegramFileId(url);
}

/**
 * Migrate a single contact's file URLs
 */
async function migrateContactFiles(contact: BitrixContact): Promise<boolean> {
  console.log(`\n📋 [MIGRATION] Processing contact ${contact.ID}: ${contact.NAME}`);
  
  const updatedFields: any = {};
  let hasChanges = false;

  // Check and migrate resume file
  if (contact.UF_CRM_1752621810 && isTelegramFileUrl(contact.UF_CRM_1752621810)) {
    console.log(`  📄 Resume field needs migration: ${contact.UF_CRM_1752621810}`);
    
    const permanentUrl = await TelegramFileStorage.processFileField(
      contact.UF_CRM_1752621810, 
      'resume', 
      contact.ID
    );
    
    if (permanentUrl !== contact.UF_CRM_1752621810) {
      updatedFields.UF_CRM_1752621810 = permanentUrl;
      hasChanges = true;
      console.log(`  ✅ Resume migrated to: ${permanentUrl}`);
    } else {
      console.log(`  ⚠️ Resume migration failed, keeping original`);
    }
  }

  // Check and migrate diploma file
  if (contact.UF_CRM_1752621831 && isTelegramFileUrl(contact.UF_CRM_1752621831)) {
    console.log(`  🎓 Diploma field needs migration: ${contact.UF_CRM_1752621831}`);
    
    const permanentUrl = await TelegramFileStorage.processFileField(
      contact.UF_CRM_1752621831, 
      'diploma', 
      contact.ID
    );
    
    if (permanentUrl !== contact.UF_CRM_1752621831) {
      updatedFields.UF_CRM_1752621831 = permanentUrl;
      hasChanges = true;
      console.log(`  ✅ Diploma migrated to: ${permanentUrl}`);
    } else {
      console.log(`  ⚠️ Diploma migration failed, keeping original`);
    }
  }

  // Check and migrate voice files
  const voiceFields = [
    { field: 'UF_CRM_1752621857', name: 'voice_q1' },
    { field: 'UF_CRM_1752621874', name: 'voice_q2' },
    { field: 'UF_CRM_1752621887', name: 'voice_q3' }
  ];

  for (const voiceField of voiceFields) {
    const currentValue = (contact as any)[voiceField.field];
    if (currentValue && isTelegramFileUrl(currentValue)) {
      console.log(`  🎧 ${voiceField.name} field needs migration: ${currentValue}`);
      
      const permanentUrl = await TelegramFileStorage.processFileField(
        currentValue, 
        voiceField.name, 
        contact.ID
      );
      
      if (permanentUrl !== currentValue) {
        updatedFields[voiceField.field] = permanentUrl;
        hasChanges = true;
        console.log(`  ✅ ${voiceField.name} migrated to: ${permanentUrl}`);
      } else {
        console.log(`  ⚠️ ${voiceField.name} migration failed, keeping original`);
      }
    }
  }

  // Update contact in Bitrix24 if there are changes
  if (hasChanges) {
    try {
      console.log(`  🔄 Updating contact ${contact.ID} in Bitrix24...`);
      
      const updatePayload = {
        id: contact.ID,
        fields: updatedFields
      };

      const response = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.result) {
        console.log(`  ✅ Contact ${contact.ID} updated successfully`);
        return true;
      } else {
        console.log(`  ❌ Failed to update contact ${contact.ID}: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error: any) {
      console.error(`  ❌ Error updating contact ${contact.ID}:`, error.message);
      return false;
    }
  } else {
    console.log(`  ✅ Contact ${contact.ID} has no Telegram file URLs to migrate`);
    return true;
  }
}

/**
 * Main migration function
 */
export async function migrateAllBitrixFiles(): Promise<void> {
  console.log('🚀 [MIGRATION] Starting Bitrix24 file URL migration...');
  console.log('🎯 [MIGRATION] Target: Convert Telegram file URLs to permanent URLs');
  
  const startTime = Date.now();
  
  try {
    // Get all contacts with file fields
    const contacts = await getAllContactsWithFiles();
    
    if (contacts.length === 0) {
      console.log('✅ [MIGRATION] No contacts found with file fields to migrate');
      return;
    }

    // Filter contacts that actually need migration
    const contactsNeedingMigration = contacts.filter(contact => {
      return (contact.UF_CRM_1752621810 && isTelegramFileUrl(contact.UF_CRM_1752621810)) ||
             (contact.UF_CRM_1752621831 && isTelegramFileUrl(contact.UF_CRM_1752621831)) ||
             (contact.UF_CRM_1752621857 && isTelegramFileUrl(contact.UF_CRM_1752621857)) ||
             (contact.UF_CRM_1752621874 && isTelegramFileUrl(contact.UF_CRM_1752621874)) ||
             (contact.UF_CRM_1752621887 && isTelegramFileUrl(contact.UF_CRM_1752621887));
    });

    console.log(`📊 [MIGRATION] Contacts needing migration: ${contactsNeedingMigration.length} of ${contacts.length}`);

    if (contactsNeedingMigration.length === 0) {
      console.log('✅ [MIGRATION] All contacts already have permanent URLs');
      return;
    }

    // Migrate contacts one by one to avoid overwhelming the APIs
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < contactsNeedingMigration.length; i++) {
      const contact = contactsNeedingMigration[i];
      console.log(`\n📍 [MIGRATION] Progress: ${i + 1}/${contactsNeedingMigration.length}`);
      
      const success = await migrateContactFiles(contact);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Add a small delay to be respectful to the APIs
      if (i < contactsNeedingMigration.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ [MIGRATION] Migration completed!');
    console.log(`📊 [MIGRATION] Results:`);
    console.log(`  - Total contacts processed: ${contactsNeedingMigration.length}`);
    console.log(`  - Successful migrations: ${successCount}`);
    console.log(`  - Failed migrations: ${failureCount}`);
    console.log(`  - Duration: ${duration} seconds`);
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ [MIGRATION] Migration failed:', error.message);
    throw error;
  }
}

/**
 * Run migration if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllBitrixFiles()
    .then(() => {
      console.log('🎉 [MIGRATION] Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 [MIGRATION] Migration script failed:', error);
      process.exit(1);
    });
}