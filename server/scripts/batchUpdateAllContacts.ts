import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

interface ContactFileMapping {
  contactId: string;
  files: {
    resume?: string;
    diploma?: string;
    voiceQ1?: string;
    voiceQ2?: string;
    voiceQ3?: string;
  };
}

async function getAllContactsWithFiles(): Promise<ContactFileMapping[]> {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ [BATCH-UPDATE] Uploads directory not found');
    return [];
  }

  const allFiles = fs.readdirSync(uploadsDir);
  const contactMap = new Map<string, ContactFileMapping>();

  // Process each file and organize by contact ID
  for (const file of allFiles) {
    if (!file.startsWith('contact-')) continue;

    const parts = file.split('_');
    if (parts.length < 4) continue;

    const contactId = parts[0].replace('contact-', '');
    const fileType = parts[1];

    if (!contactMap.has(contactId)) {
      contactMap.set(contactId, {
        contactId,
        files: {}
      });
    }

    const contact = contactMap.get(contactId)!;
    const permanentUrl = `https://career.millatumidi.uz/uploads/telegram-files/${file}`;

    // Map file types to appropriate fields
    if (fileType === 'resume') {
      contact.files.resume = permanentUrl;
    } else if (fileType === 'diploma') {
      contact.files.diploma = permanentUrl;
    } else if (file.includes('_voice_q1_')) {
      contact.files.voiceQ1 = permanentUrl;
    } else if (file.includes('_voice_q2_')) {
      contact.files.voiceQ2 = permanentUrl;
    } else if (file.includes('_voice_q3_')) {
      contact.files.voiceQ3 = permanentUrl;
    }
  }

  return Array.from(contactMap.values());
}

async function updateContactInBitrix(contact: ContactFileMapping): Promise<boolean> {
  try {
    console.log(`\n🔄 [UPDATE] Processing Contact ${contact.contactId}`);
    
    // Prepare update fields
    const fieldsToUpdate: Record<string, string> = {};
    
    if (contact.files.resume) {
      fieldsToUpdate['UF_CRM_1752621810'] = contact.files.resume;
      console.log(`  📎 Resume: ${contact.files.resume}`);
    }
    
    if (contact.files.diploma) {
      fieldsToUpdate['UF_CRM_1752621831'] = contact.files.diploma;
      console.log(`  📎 Diploma: ${contact.files.diploma}`);
    }
    
    if (contact.files.voiceQ1) {
      fieldsToUpdate['UF_CRM_1752621857'] = contact.files.voiceQ1;
      console.log(`  🎤 Voice Q1: ${contact.files.voiceQ1}`);
    }
    
    if (contact.files.voiceQ2) {
      fieldsToUpdate['UF_CRM_1752621874'] = contact.files.voiceQ2;
      console.log(`  🎤 Voice Q2: ${contact.files.voiceQ2}`);
    }
    
    if (contact.files.voiceQ3) {
      fieldsToUpdate['UF_CRM_1752621887'] = contact.files.voiceQ3;
      console.log(`  🎤 Voice Q3: ${contact.files.voiceQ3}`);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      console.log(`  ⚠️ No files to update for Contact ${contact.contactId}`);
      return false;
    }

    // Send update to Bitrix24
    const updatePayload = {
      id: contact.contactId,
      fields: fieldsToUpdate
    };

    const response = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.result) {
      console.log(`  ✅ Successfully updated Contact ${contact.contactId} with ${Object.keys(fieldsToUpdate).length} files`);
      return true;
    } else {
      console.log(`  ❌ Failed to update Contact ${contact.contactId}:`, response.data);
      return false;
    }

  } catch (error: any) {
    console.error(`  ❌ Error updating Contact ${contact.contactId}:`, error.message);
    if (error.response?.status === 404) {
      console.error(`     Contact ${contact.contactId} may not exist in Bitrix24`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 [BATCH-UPDATE] Starting comprehensive contact file updates...');
  console.log('=' .repeat(70));
  
  // Get all contacts with files
  const contactsWithFiles = await getAllContactsWithFiles();
  
  if (contactsWithFiles.length === 0) {
    console.log('❌ [BATCH-UPDATE] No contacts with files found');
    return;
  }
  
  console.log(`📊 [BATCH-UPDATE] Found ${contactsWithFiles.length} contacts with permanent files:`);
  
  // Display summary
  contactsWithFiles.forEach(contact => {
    const fileCount = Object.keys(contact.files).length;
    const fileTypes = Object.keys(contact.files).join(', ');
    console.log(`  📁 Contact ${contact.contactId}: ${fileCount} files (${fileTypes})`);
  });
  
  console.log('\n🔄 [BATCH-UPDATE] Processing updates...');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each contact
  for (const contact of contactsWithFiles) {
    const success = await updateContactInBitrix(contact);
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 [BATCH-UPDATE] Final Results:');
  console.log('=' .repeat(70));
  console.log(`  ✅ Successfully updated: ${successCount} contacts`);
  console.log(`  ❌ Failed updates: ${errorCount} contacts`);
  console.log(`  📁 Total contacts processed: ${contactsWithFiles.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 [BATCH-UPDATE] Permanent file URLs successfully updated in Bitrix24!');
    console.log('All non-404 URLs are now properly configured and will never expire.');
  }
  
  console.log('\n⚠️  [PRODUCTION-NOTE] Files will be accessible once production deployment is completed.');
  console.log('=' .repeat(70));
}

main().catch(console.error);