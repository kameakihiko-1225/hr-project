import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

interface ContactUpdate {
  contactId: string;
  name: string;
  fieldsToUpdate: Record<string, string>;
}

// Define contacts to update with their available permanent files
const contactsToUpdate: ContactUpdate[] = [
  {
    contactId: '71645',
    name: 'Contact 71645',
    fieldsToUpdate: {}
  },
  {
    contactId: '71227', 
    name: 'Zilola Ergasheva',
    fieldsToUpdate: {
      'UF_CRM_1752621810': 'https://career.millatumidi.uz/uploads/telegram-files/contact-71227_resume_2025-07-31_0sqroyns.docx'
    }
  },
  {
    contactId: '71115',
    name: 'Davlatova Malika', 
    fieldsToUpdate: {
      'UF_CRM_1752621810': 'https://career.millatumidi.uz/uploads/telegram-files/contact-71115_resume_2025-07-31_tjfxsimf.docx',
      'UF_CRM_1752621831': 'https://career.millatumidi.uz/uploads/telegram-files/contact-71115_diploma_2025-07-31_201ovsfu.pdf',
      'UF_CRM_1752621857': 'https://career.millatumidi.uz/uploads/telegram-files/contact-71115_voice_q1_2025-07-31_lp9onozr.oga',
      'UF_CRM_1752621874': 'https://career.millatumidi.uz/uploads/telegram-files/contact-71115_voice_q2_2025-07-31_d8l1smwy.oga'
    }
  }
];

async function updateContactInBitrix(contact: ContactUpdate): Promise<void> {
  try {
    console.log(`\n🔄 [UPDATE] Processing ${contact.name} (ID: ${contact.contactId})`);
    
    if (Object.keys(contact.fieldsToUpdate).length === 0) {
      console.log(`⚠️ [UPDATE] No files available for ${contact.name} - checking for available files...`);
      
      // Check for files with this contact ID
      const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
      const files = fs.readdirSync(uploadsDir);
      const contactFiles = files.filter(file => file.startsWith(`contact-${contact.contactId}_`));
      
      if (contactFiles.length > 0) {
        console.log(`📁 [UPDATE] Found ${contactFiles.length} files for ${contact.name}:`);
        contactFiles.forEach((file, index) => {
          const fileType = file.includes('_resume_') ? 'Resume' : 
                          file.includes('_diploma_') ? 'Diploma' : 
                          file.includes('_voice_q1_') ? 'Voice Q1' :
                          file.includes('_voice_q2_') ? 'Voice Q2' :
                          file.includes('_voice_q3_') ? 'Voice Q3' : 'Unknown';
          console.log(`  ${index + 1}. ${fileType}: ${file}`);
          
          // Add to fields to update
          if (file.includes('_resume_')) {
            contact.fieldsToUpdate['UF_CRM_1752621810'] = `https://career.millatumidi.uz/uploads/telegram-files/${file}`;
          } else if (file.includes('_diploma_')) {
            contact.fieldsToUpdate['UF_CRM_1752621831'] = `https://career.millatumidi.uz/uploads/telegram-files/${file}`;
          } else if (file.includes('_voice_q1_')) {
            contact.fieldsToUpdate['UF_CRM_1752621857'] = `https://career.millatumidi.uz/uploads/telegram-files/${file}`;
          } else if (file.includes('_voice_q2_')) {
            contact.fieldsToUpdate['UF_CRM_1752621874'] = `https://career.millatumidi.uz/uploads/telegram-files/${file}`;
          } else if (file.includes('_voice_q3_')) {
            contact.fieldsToUpdate['UF_CRM_1752621887'] = `https://career.millatumidi.uz/uploads/telegram-files/${file}`;
          }
        });
      } else {
        console.log(`❌ [UPDATE] No permanent files found for ${contact.name}`);
        return;
      }
    }

    if (Object.keys(contact.fieldsToUpdate).length === 0) {
      console.log(`⚠️ [UPDATE] No fields to update for ${contact.name}`);
      return;
    }

    // Prepare update payload
    const updatePayload = {
      id: contact.contactId,
      fields: contact.fieldsToUpdate
    };

    console.log(`📤 [UPDATE] Updating ${contact.name} with permanent URLs:`);
    Object.entries(contact.fieldsToUpdate).forEach(([field, url]) => {
      const fieldName = field === 'UF_CRM_1752621810' ? 'Resume' :
                       field === 'UF_CRM_1752621831' ? 'Diploma' :
                       field === 'UF_CRM_1752621857' ? 'Voice Q1' :
                       field === 'UF_CRM_1752621874' ? 'Voice Q2' :
                       field === 'UF_CRM_1752621887' ? 'Voice Q3' : field;
      console.log(`  📎 ${fieldName}: ${url}`);
    });

    // Send update to Bitrix24
    const response = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.result) {
      console.log(`✅ [UPDATE] Successfully updated ${contact.name} in Bitrix24`);
      console.log(`   Contact ID: ${contact.contactId}`);
      console.log(`   Fields updated: ${Object.keys(contact.fieldsToUpdate).length}`);
    } else {
      console.log(`❌ [UPDATE] Failed to update ${contact.name}:`, response.data);
    }

  } catch (error: any) {
    console.error(`❌ [UPDATE] Error updating ${contact.name}:`, error.message);
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response data:`, error.response.data);
    }
  }
}

async function main() {
  console.log('🚀 [BATCH-UPDATE] Starting targeted contact updates...');
  console.log('=' .repeat(60));
  
  // Check available files first
  const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ [BATCH-UPDATE] Uploads directory not found');
    return;
  }
  
  const allFiles = fs.readdirSync(uploadsDir);
  console.log(`📁 [BATCH-UPDATE] Found ${allFiles.length} total permanent files`);
  
  // Process each contact
  for (const contact of contactsToUpdate) {
    await updateContactInBitrix(contact);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 [BATCH-UPDATE] Targeted contact updates completed!');
  console.log('=' .repeat(60));
}

main().catch(console.error);