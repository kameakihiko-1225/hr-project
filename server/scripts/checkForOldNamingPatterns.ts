import axios from 'axios';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

async function checkForOldNamingPatterns() {
  console.log('🔍 [CHECK] Checking for contacts using old contact-specific file naming patterns');
  console.log('='.repeat(80));
  
  try {
    // Get all contacts with file fields
    const response = await axios.get(`${BITRIX_BASE}/crm.contact.list.json?select[]=ID&select[]=NAME&select[]=LAST_NAME&select[]=UF_CRM_1752621810&select[]=UF_CRM_1752621831&select[]=UF_CRM_1752621857&select[]=UF_CRM_1752621874&select[]=UF_CRM_1752621887`, {
      timeout: 30000
    });
    
    if (!response.data?.result) {
      console.log('❌ [CHECK] No contacts found');
      return;
    }
    
    const contacts = response.data.result;
    console.log(`📋 [CHECK] Checking ${contacts.length} contacts for old naming patterns...`);
    
    let contactsWithOldPatterns = 0;
    let contactsWithNewPatterns = 0;
    let contactsWithNoFiles = 0;
    
    for (const contact of contacts) {
      const contactName = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
      const fileFields = [
        contact.UF_CRM_1752621810, // Resume
        contact.UF_CRM_1752621831, // Diploma
        contact.UF_CRM_1752621857, // Voice Q1
        contact.UF_CRM_1752621874, // Voice Q2
        contact.UF_CRM_1752621887  // Voice Q3
      ];
      
      const hasFiles = fileFields.some(field => field && field.trim() !== '');
      
      if (!hasFiles) {
        contactsWithNoFiles++;
        continue;
      }
      
      let hasOldPattern = false;
      let hasNewPattern = false;
      
      for (const field of fileFields) {
        if (field && field.includes('contact-')) {
          // Check if it's the old contact-specific pattern
          if (field.includes(`contact-${contact.ID}_`) || field.includes('contact-pending')) {
            hasOldPattern = true;
            console.log(`🔍 Contact ${contact.ID} (${contactName}): OLD pattern found - ${field}`);
          }
        } else if (field && field.includes('career.millatumidi.uz/uploads/telegram-files/')) {
          // Check if it's using the new UUID-based pattern
          hasNewPattern = true;
        }
      }
      
      if (hasOldPattern) {
        contactsWithOldPatterns++;
      } else if (hasNewPattern) {
        contactsWithNewPatterns++;
      }
    }
    
    console.log('');
    console.log('📊 [CHECK] Summary:');
    console.log(`   📁 Contacts with old contact-specific patterns: ${contactsWithOldPatterns}`);
    console.log(`   ✅ Contacts with new UUID-based patterns: ${contactsWithNewPatterns}`);
    console.log(`   ⚪ Contacts with no files: ${contactsWithNoFiles}`);
    console.log(`   📋 Total contacts checked: ${contacts.length}`);
    
    if (contactsWithOldPatterns > 0) {
      console.log('');
      console.log('⚠️ [CHECK] Found contacts using old naming patterns that could be updated');
      console.log('💡 [CHECK] These contacts have working URLs but use contact-specific naming');
    } else {
      console.log('');
      console.log('🎉 [CHECK] All contacts are using the optimal file naming approach!');
    }
    
  } catch (error: any) {
    console.error('❌ [CHECK] Error during check:', error.message);
  }
}

checkForOldNamingPatterns();