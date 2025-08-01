import fs from 'fs';
import path from 'path';
import axios from 'axios';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

async function findMissingFile() {
  console.log('🔍 [SEARCH] Looking for contact-pending file...');
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ [SEARCH] Uploads directory not found');
    return;
  }
  
  const allFiles = fs.readdirSync(uploadsDir);
  console.log(`📁 [SEARCH] Found ${allFiles.length} total files in uploads directory`);
  
  // Look for files with similar UUID or name pattern
  const targetUUID = 'c57b48ef';
  const similarFiles = allFiles.filter(file => 
    file.includes(targetUUID) || 
    file.includes('contact-pending') ||
    file.includes('2025-07-31')
  );
  
  console.log('\n🔍 [SEARCH] Files matching search criteria:');
  if (similarFiles.length === 0) {
    console.log('  ❌ No files found matching UUID c57b48ef or contact-pending pattern');
  } else {
    similarFiles.forEach((file, index) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${index + 1}. ${file} (${Math.round(stats.size/1024)}KB)`);
    });
  }
  
  // Check if there are any files from July 31st that might be the missing file
  const july31Files = allFiles.filter(file => file.includes('2025-07-31'));
  console.log(`\n📅 [SEARCH] All files from July 31st (${july31Files.length} files):`);
  july31Files.forEach((file, index) => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${index + 1}. ${file} (${Math.round(stats.size/1024)}KB)`);
  });
  
  // Search for the contact that might have this file in Bitrix24
  console.log('\n🔍 [SEARCH] Checking if any contact has this problematic URL...');
  
  try {
    // Get all contacts to find which one has this URL
    const contactIds = ['62375', '62377', '62385', '71115', '71227', '71645'];
    
    for (const contactId of contactIds) {
      try {
        const response = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?id=${contactId}`, {
          timeout: 5000
        });
        
        if (response.data && response.data.result) {
          const contact = response.data.result;
          const fields = contact;
          
          // Check all file fields for the problematic URL
          const fileFields = [
            'UF_CRM_1752621810', // Resume
            'UF_CRM_1752621831', // Diploma  
            'UF_CRM_1752621857', // Voice Q1
            'UF_CRM_1752621874', // Voice Q2
            'UF_CRM_1752621887'  // Voice Q3
          ];
          
          for (const field of fileFields) {
            if (fields[field] && fields[field].includes('contact-pending_resume_2025-07-31_c57b48ef.docx')) {
              console.log(`  🎯 Found problematic URL in Contact ${contactId}, field ${field}`);
              console.log(`     Current URL: ${fields[field]}`);
              
              // Look for a replacement file for this contact
              const replacementFiles = allFiles.filter(f => f.startsWith(`contact-${contactId}_resume_`));
              if (replacementFiles.length > 0) {
                console.log(`     ✅ Replacement found: ${replacementFiles[0]}`);
                return {
                  contactId: contactId,
                  field: field,
                  currentUrl: fields[field],
                  replacementFile: replacementFiles[0]
                };
              } else {
                console.log(`     ❌ No replacement file found for contact ${contactId}`);
              }
            }
          }
        }
      } catch (error) {
        // Skip contacts that don't exist
      }
    }
    
  } catch (error: any) {
    console.log(`❌ [SEARCH] Error checking contacts: ${error.message}`);
  }
  
  console.log('\n📋 [SEARCH] Summary:');
  console.log(`  - Target file: contact-pending_resume_2025-07-31_c57b48ef.docx`);
  console.log(`  - File exists locally: ${similarFiles.length > 0 ? 'YES' : 'NO'}`);
  console.log(`  - Total permanent files available: ${allFiles.length}`);
  
  return null;
}

findMissingFile().catch(console.error);