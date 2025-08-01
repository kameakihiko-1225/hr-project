import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';
const CONTACT_ID = '72623';

async function fixContact72623() {
  console.log(`🔧 [FIX] Fixing Contact ${CONTACT_ID} with broken URL...`);
  
  try {
    // First, get the current contact data
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
    
    // Check all file fields for the broken URL
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
      
      if (fieldValue && fieldValue.includes('contact-pending_resume_2025-07-31_c57b48ef.docx')) {
        console.log(`🎯 [FIX] Found broken URL in ${fieldName} field`);
        console.log(`   Current URL: ${fieldValue}`);
        brokenFields.push({ field, fieldName, currentUrl: fieldValue });
      }
    }
    
    if (brokenFields.length === 0) {
      console.log(`✅ [FIX] No broken URLs found in Contact ${CONTACT_ID}`);
      return;
    }
    
    // Get available permanent files to suggest replacements
    const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
    const availableFiles = fs.readdirSync(uploadsDir);
    
    // Look for files that might belong to this contact
    const contactFiles = availableFiles.filter(f => f.startsWith(`contact-${CONTACT_ID}_`));
    const resumeFiles = availableFiles.filter(f => f.includes('_resume_') && f.includes('2025-07-31'));
    
    console.log(`📁 [FIX] Available files for Contact ${CONTACT_ID}: ${contactFiles.length} files`);
    if (contactFiles.length > 0) {
      contactFiles.forEach(f => console.log(`   - ${f}`));
    }
    
    console.log(`📄 [FIX] Available resume files from July 31st: ${resumeFiles.length} files`);
    
    // For each broken field, determine the best action
    const fieldsToUpdate: Record<string, string> = {};
    
    for (const brokenField of brokenFields) {
      if (brokenField.fieldName === 'Resume') {
        // Look for a specific resume file for this contact first
        const specificResume = contactFiles.find(f => f.includes('_resume_'));
        
        if (specificResume) {
          const newUrl = `https://career.millatumidi.uz/uploads/telegram-files/${specificResume}`;
          fieldsToUpdate[brokenField.field] = newUrl;
          console.log(`   ✅ Replace with specific file: ${specificResume}`);
        } else {
          // Clear the broken URL since we don't have a replacement
          fieldsToUpdate[brokenField.field] = '';
          console.log(`   🗑️ Clear broken URL (no replacement available)`);
        }
      } else {
        // For non-resume fields, clear the broken URL
        fieldsToUpdate[brokenField.field] = '';
        console.log(`   🗑️ Clear broken URL from ${brokenField.fieldName} field`);
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
      
      console.log('\n🎉 [FIX] Contact 72623 fixed! The 404 error should now be resolved.');
      
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

fixContact72623().catch(console.error);