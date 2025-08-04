import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';
const CONTACT_ID = '75131';

async function fixContact75131() {
  console.log(`🔧 [FIX] Fixing Contact ${CONTACT_ID} with broken URLs...`);
  
  try {
    // Get the current contact data
    console.log(`📋 [FIX] Fetching Contact ${CONTACT_ID} data...`);
    
    const getResponse = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?id=${CONTACT_ID}`, {
      timeout: 10000
    });
    
    if (!getResponse.data || !getResponse.data.result) {
      console.log(`❌ [FIX] Contact ${CONTACT_ID} not found`);
      return;
    }
    
    const contact = getResponse.data.result;
    const name = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
    
    console.log(`👤 [FIX] Contact ${CONTACT_ID}: ${name}`);
    
    // Check all file fields for broken URLs with "contact-pending" pattern
    const fileFields = {
      'UF_CRM_1752621810': 'Resume',
      'UF_CRM_1752621831': 'Diploma', 
      'UF_CRM_1752621857': 'Voice Q1',
      'UF_CRM_1752621874': 'Voice Q2',
      'UF_CRM_1752621887': 'Voice Q3'
    };
    
    let brokenFields = [];
    
    for (const [field, fieldName] of Object.entries(fileFields)) {
      const fieldValue = contact[field];
      
      if (fieldValue && fieldValue.includes('contact-pending')) {
        console.log(`🎯 [FIX] Found broken URL in ${fieldName} field`);
        console.log(`   Current URL: ${fieldValue}`);
        brokenFields.push({ field, fieldName, currentUrl: fieldValue });
      }
    }
    
    if (brokenFields.length === 0) {
      console.log(`✅ [FIX] No broken URLs found in Contact ${CONTACT_ID}`);
      return;
    }
    
    // Get available permanent files
    const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
    const availableFiles = fs.readdirSync(uploadsDir);
    
    // Look for files that might belong to this contact
    const contactFiles = availableFiles.filter(f => f.startsWith(`contact-${CONTACT_ID}_`));
    const aug3Files = availableFiles.filter(f => f.includes('2025-08-03'));
    
    console.log(`📁 [FIX] Available files for Contact ${CONTACT_ID}: ${contactFiles.length} files`);
    if (contactFiles.length > 0) {
      contactFiles.forEach(f => console.log(`   - ${f}`));
    }
    
    console.log(`📅 [FIX] Available files from August 3rd: ${aug3Files.length} files`);
    if (aug3Files.length > 0) {
      aug3Files.forEach(f => console.log(`   - ${f}`));
    }
    
    // For each broken field, determine the best action
    const fieldsToUpdate: Record<string, string> = {};
    
    for (const brokenField of brokenFields) {
      // Look for a specific file for this contact first
      let replacementFile = null;
      
      if (brokenField.fieldName === 'Resume') {
        replacementFile = contactFiles.find(f => f.includes('_resume_'));
      } else if (brokenField.fieldName === 'Diploma') {
        replacementFile = contactFiles.find(f => f.includes('_diploma_'));
      } else if (brokenField.fieldName === 'Voice Q1') {
        replacementFile = contactFiles.find(f => f.includes('_voice_q1_'));
      } else if (brokenField.fieldName === 'Voice Q2') {
        replacementFile = contactFiles.find(f => f.includes('_voice_q2_'));
      } else if (brokenField.fieldName === 'Voice Q3') {
        replacementFile = contactFiles.find(f => f.includes('_voice_q3_'));
      }
      
      if (replacementFile) {
        const newUrl = `https://career.millatumidi.uz/uploads/telegram-files/${replacementFile}`;
        fieldsToUpdate[brokenField.field] = newUrl;
        console.log(`   ✅ Replace ${brokenField.fieldName} with: ${replacementFile}`);
      } else {
        // Clear the broken URL since we don't have a replacement
        fieldsToUpdate[brokenField.field] = '';
        console.log(`   🗑️ Clear broken ${brokenField.fieldName} URL (no replacement available)`);
      }
    }
    
    if (Object.keys(fieldsToUpdate).length === 0) {
      console.log(`⚠️ [FIX] No updates needed for Contact ${CONTACT_ID}`);
      return;
    }
    
    // Update the contact
    console.log(`🔄 [FIX] Updating Contact ${CONTACT_ID}...`);
    
    const updatePayload = {
      id: CONTACT_ID,
      fields: fieldsToUpdate
    };
    
    const updateResponse = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (updateResponse.data && updateResponse.data.result) {
      console.log(`✅ [FIX] Successfully updated Contact ${CONTACT_ID}`);
      console.log(`   Contact: ${name}`);
      console.log(`   Fields updated: ${Object.keys(fieldsToUpdate).length}`);
      
      Object.entries(fieldsToUpdate).forEach(([field, value]) => {
        const fieldName = fileFields[field as keyof typeof fileFields];
        if (value) {
          console.log(`   📎 ${fieldName}: ${value}`);
        } else {
          console.log(`   🗑️ ${fieldName}: Cleared broken URL`);
        }
      });
      
      console.log('\n🎉 [FIX] Contact 75131 fixed! All 404 errors should now be resolved.');
      
    } else {
      console.log(`❌ [FIX] Failed to update Contact ${CONTACT_ID}:`, updateResponse.data);
    }
    
  } catch (error: any) {
    console.error(`❌ [FIX] Error processing Contact ${CONTACT_ID}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
}

fixContact75131().catch(console.error);