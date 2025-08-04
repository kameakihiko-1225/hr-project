import axios from 'axios';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

async function searchAllContactsForPendingUrls() {
  console.log('🔍 [SEARCH] Searching ALL contacts for contact-pending URLs...');
  
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
    
    // Check each contact for contact-pending URLs
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
      
      let contactHasPendingUrls = false;
      let pendingUrls = [];
      
      for (const [field, fieldName] of Object.entries(fileFields)) {
        const fieldValue = contact[field];
        
        if (fieldValue && fieldValue.includes('contact-pending')) {
          contactHasPendingUrls = true;
          pendingUrls.push({
            field: field,
            fieldName: fieldName,
            url: fieldValue
          });
        }
      }
      
      if (contactHasPendingUrls) {
        foundContacts.push({
          id: contactId,
          name: name,
          pendingUrls: pendingUrls
        });
      }
    }
    
    if (foundContacts.length === 0) {
      console.log('\n✅ [SEARCH] No contacts found with contact-pending URLs');
      console.log('All orphaned URLs have been cleaned up successfully!');
    } else {
      console.log(`\n🚨 [SEARCH] Found ${foundContacts.length} contacts with contact-pending URLs:`);
      
      foundContacts.forEach(contact => {
        console.log(`\n📋 Contact ${contact.id}: ${contact.name}`);
        contact.pendingUrls.forEach(urlInfo => {
          console.log(`   ${urlInfo.fieldName}: ${urlInfo.url}`);
        });
      });
      
      console.log('\n🔧 [SOLUTION] These contacts need to be fixed:');
      foundContacts.forEach(contact => {
        console.log(`   Contact ${contact.id}: ${contact.pendingUrls.length} broken URLs`);
      });
    }
    
    return foundContacts;
    
  } catch (error: any) {
    console.error('❌ [SEARCH] Error searching contacts:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
}

searchAllContactsForPendingUrls().catch(console.error);