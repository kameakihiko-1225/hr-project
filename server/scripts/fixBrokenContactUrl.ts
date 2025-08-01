import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';
const BROKEN_URL = 'https://career.millatumidi.uz/uploads/telegram-files/contact-pending_resume_2025-07-31_c57b48ef.docx';

async function findAndFixBrokenUrl() {
  console.log('🔍 [FIX] Searching for contact with broken URL...');
  console.log(`Target URL: ${BROKEN_URL}`);
  
  // Get available permanent files for potential replacement
  const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  const availableFiles = fs.readdirSync(uploadsDir);
  
  // Search through known contacts that might have this URL
  const contactIds = ['62375', '62377', '62385', '71115', '71227', '71645'];
  
  let foundContact = null;
  
  for (const contactId of contactIds) {
    try {
      console.log(`\n🔍 [FIX] Checking Contact ${contactId}...`);
      
      const response = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?id=${contactId}`, {
        timeout: 10000
      });
      
      if (response.data && response.data.result) {
        const contact = response.data.result;
        
        // Check all file fields
        const fileFields = {
          'UF_CRM_1752621810': 'Resume',
          'UF_CRM_1752621831': 'Diploma',
          'UF_CRM_1752621857': 'Voice Q1',
          'UF_CRM_1752621874': 'Voice Q2',
          'UF_CRM_1752621887': 'Voice Q3'
        };
        
        for (const [field, fieldName] of Object.entries(fileFields)) {
          const fieldValue = contact[field];
          
          if (fieldValue && fieldValue.includes('contact-pending_resume_2025-07-31_c57b48ef.docx')) {
            console.log(`  🎯 FOUND! Contact ${contactId} has broken URL in ${fieldName} field`);
            console.log(`     Broken URL: ${fieldValue}`);
            
            // Look for a replacement file for this contact
            const resumeFiles = availableFiles.filter(f => 
              f.startsWith(`contact-${contactId}_resume_`) && f.includes('2025-07-31')
            );
            
            if (resumeFiles.length > 0) {
              const replacementFile = resumeFiles[0];
              const newUrl = `https://career.millatumidi.uz/uploads/telegram-files/${replacementFile}`;
              
              console.log(`     ✅ Replacement found: ${replacementFile}`);
              console.log(`     New URL: ${newUrl}`);
              
              foundContact = {
                contactId,
                field,
                fieldName,
                currentUrl: fieldValue,
                newUrl,
                replacementFile
              };
              break;
            } else {
              console.log(`     ❌ No replacement resume file found for Contact ${contactId}`);
              
              // Check if there are any files for this contact at all
              const anyFiles = availableFiles.filter(f => f.startsWith(`contact-${contactId}_`));
              if (anyFiles.length > 0) {
                console.log(`     📁 Available files for Contact ${contactId}:`);
                anyFiles.forEach(f => console.log(`        - ${f}`));
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.log(`  ❌ Error checking Contact ${contactId}: ${error.message}`);
    }
    
    if (foundContact) break;
  }
  
  if (!foundContact) {
    console.log('\n❌ [FIX] Could not find any contact with the broken URL');
    console.log('This URL may be from a contact not in our search list or may be orphaned');
    return;
  }
  
  // Update the contact with the correct URL
  console.log(`\n🔄 [FIX] Updating Contact ${foundContact.contactId}...`);
  
  try {
    const updatePayload = {
      id: foundContact.contactId,
      fields: {
        [foundContact.field]: foundContact.newUrl
      }
    };
    
    const updateResponse = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (updateResponse.data && updateResponse.data.result) {
      console.log(`✅ [FIX] Successfully updated Contact ${foundContact.contactId}`);
      console.log(`   Field: ${foundContact.fieldName}`);
      console.log(`   Old URL: ${foundContact.currentUrl}`);
      console.log(`   New URL: ${foundContact.newUrl}`);
      console.log('\n🎉 [FIX] Broken URL fixed! The file will be accessible once deployed.');
    } else {
      console.log(`❌ [FIX] Failed to update contact:`, updateResponse.data);
    }
    
  } catch (error: any) {
    console.error(`❌ [FIX] Error updating contact:`, error.message);
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response data:`, error.response.data);
    }
  }
}

findAndFixBrokenUrl().catch(console.error);