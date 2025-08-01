import axios from 'axios';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';
const BROKEN_URL = 'contact-pending_resume_2025-07-31_c57b48ef.docx';

async function searchAllContactsForBrokenUrl() {
  console.log('🔍 [SEARCH] Searching ALL contacts for broken URL...');
  console.log(`Target filename: ${BROKEN_URL}`);
  
  try {
    // Get all contacts from Bitrix24
    console.log('\n📋 [SEARCH] Fetching all contacts from Bitrix24...');
    
    const response = await axios.get(`${BITRIX_BASE}/crm.contact.list.json`, {
      params: {
        order: { 'ID': 'DESC' },
        filter: {},
        select: ['ID', 'NAME', 'LAST_NAME', 'UF_CRM_1752621810', 'UF_CRM_1752621831', 'UF_CRM_1752621857', 'UF_CRM_1752621874', 'UF_CRM_1752621887'],
        start: 0
      },
      timeout: 15000
    });
    
    if (!response.data || !response.data.result) {
      console.log('❌ [SEARCH] Failed to fetch contacts');
      return;
    }
    
    const contacts = response.data.result;
    console.log(`📊 [SEARCH] Found ${contacts.length} contacts to check`);
    
    let foundContacts = [];
    
    // Check each contact for the broken URL
    for (const contact of contacts) {
      const contactId = contact.ID;
      const name = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
      
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
        
        if (fieldValue && fieldValue.includes(BROKEN_URL)) {
          console.log(`\n🎯 [FOUND] Contact ${contactId} (${name})`);
          console.log(`   Field: ${fieldName}`);
          console.log(`   URL: ${fieldValue}`);
          
          foundContacts.push({
            id: contactId,
            name: name,
            field: field,
            fieldName: fieldName,
            url: fieldValue
          });
        }
      }
    }
    
    if (foundContacts.length === 0) {
      console.log('\n❌ [SEARCH] No contacts found with the broken URL');
      console.log('The URL may be from:');
      console.log('  1. A deleted contact');
      console.log('  2. A contact outside Bitrix24');
      console.log('  3. An orphaned reference');
      
      // Check if there are any contacts with "pending" or similar patterns
      console.log('\n🔍 [SEARCH] Looking for contacts with "pending" patterns...');
      const pendingContacts = contacts.filter(c => {
        const fields = [c.UF_CRM_1752621810, c.UF_CRM_1752621831, c.UF_CRM_1752621857, c.UF_CRM_1752621874, c.UF_CRM_1752621887];
        return fields.some(field => field && field.includes('pending'));
      });
      
      if (pendingContacts.length > 0) {
        console.log(`Found ${pendingContacts.length} contacts with "pending" patterns:`);
        pendingContacts.forEach(c => {
          console.log(`  - Contact ${c.ID}: ${c.NAME || ''} ${c.LAST_NAME || ''}`);
        });
      }
      
    } else {
      console.log(`\n✅ [SEARCH] Found ${foundContacts.length} contacts with broken URL:`);
      foundContacts.forEach(contact => {
        console.log(`  - Contact ${contact.id} (${contact.name}): ${contact.fieldName} field`);
      });
      
      // Suggest how to fix each one
      console.log('\n🔧 [SOLUTION] To fix these contacts:');
      foundContacts.forEach(contact => {
        console.log(`  Contact ${contact.id}: Update ${contact.fieldName} field with a valid permanent URL`);
        console.log(`    Current: ${contact.url}`);
        console.log(`    Action: Replace with correct permanent file URL or clear the field`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ [SEARCH] Error searching contacts:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
}

searchAllContactsForBrokenUrl().catch(console.error);