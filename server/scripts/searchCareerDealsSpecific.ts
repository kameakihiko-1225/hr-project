import axios from 'axios';
import { TelegramFileStorage } from '../services/fileStorage.js';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

async function searchCareerDealsSpecific() {
  console.log('🔍 [CAREER-DEALS] Searching for career-specific deals and checking contact files');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get deals with more detailed filtering for career-related terms
    console.log('📋 [CAREER-DEALS] Fetching deals with career-related keywords...');
    
    const dealsResponse = await axios.get(`${BITRIX_BASE}/crm.deal.list.json?select[]=ID&select[]=TITLE&select[]=CONTACT_ID&select[]=STAGE_ID&select[]=CATEGORY_ID&select[]=COMMENTS&select[]=ASSIGNED_BY_ID`, {
      timeout: 30000
    });
    
    if (!dealsResponse.data?.result) {
      console.log('❌ [CAREER-DEALS] No deals found');
      return;
    }
    
    const allDeals = dealsResponse.data.result;
    console.log(`✅ [CAREER-DEALS] Found ${allDeals.length} total deals`);
    
    // Step 2: Filter for career-related deals based on title keywords
    const careerKeywords = [
      'hr', 'career', 'job', 'position', 'teacher', 'department', 'recruitment', 
      'candidate', 'application', 'resume', 'interview', 'hiring', 'academic',
      'учитель', 'работа', 'вакансия', 'карьера', 'резюме', 'собеседование',
      'ish', 'vazifa', 'ishchi', 'rezyume', 'muhokamat'
    ];
    
    const careerDeals = allDeals.filter((deal: any) => {
      const title = (deal.TITLE || '').toLowerCase();
      const comments = (deal.COMMENTS || '').toLowerCase();
      
      return careerKeywords.some(keyword => 
        title.includes(keyword) || comments.includes(keyword)
      ) || deal.CONTACT_ID; // Include any deal with a contact
    });
    
    console.log(`🎯 [CAREER-DEALS] Found ${careerDeals.length} potentially career-related deals`);
    
    if (careerDeals.length === 0) {
      console.log('⚪ [CAREER-DEALS] No career-related deals found');
      return;
    }
    
    // Step 3: Show deal details and check contacts
    console.log('');
    console.log('📋 [CAREER-DEALS] Career deal details:');
    
    const contactIds = new Set<string>();
    
    for (let i = 0; i < Math.min(careerDeals.length, 20); i++) {
      const deal = careerDeals[i];
      console.log(`   🔗 Deal ${deal.ID}: "${deal.TITLE}" → Contact: ${deal.CONTACT_ID || 'None'}`);
      
      if (deal.CONTACT_ID && deal.CONTACT_ID !== '0') {
        contactIds.add(deal.CONTACT_ID);
      }
    }
    
    if (careerDeals.length > 20) {
      console.log(`   ... and ${careerDeals.length - 20} more deals`);
    }
    
    console.log(`👤 [CAREER-DEALS] Found ${contactIds.size} unique contacts to check`);
    
    // Step 4: Check contacts for file issues
    if (contactIds.size === 0) {
      console.log('⚪ [CAREER-DEALS] No contacts found in career deals');
      return;
    }
    
    let contactsWithFiles = 0;
    let contactsNeedingUpdate = 0;
    
    for (const contactId of Array.from(contactIds)) {
      try {
        console.log('');
        console.log(`🔄 [CAREER-DEALS] Checking contact ${contactId}...`);
        
        const contactResponse = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?id=${contactId}`, {
          timeout: 10000
        });
        
        if (!contactResponse.data?.result) {
          console.log(`❌ [CAREER-DEALS] Contact ${contactId} not found`);
          continue;
        }
        
        const contact = contactResponse.data.result;
        const contactName = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
        console.log(`👤 [CAREER-DEALS] Contact: ${contactName} (ID: ${contactId})`);
        
        // Check file fields
        const fileFields = [
          { field: 'UF_CRM_1752621810', name: 'Resume', value: contact.UF_CRM_1752621810 },
          { field: 'UF_CRM_1752621831', name: 'Diploma', value: contact.UF_CRM_1752621831 },
          { field: 'UF_CRM_1752621857', name: 'Voice Q1', value: contact.UF_CRM_1752621857 },
          { field: 'UF_CRM_1752621874', name: 'Voice Q2', value: contact.UF_CRM_1752621874 },
          { field: 'UF_CRM_1752621887', name: 'Voice Q3', value: contact.UF_CRM_1752621887 }
        ];
        
        let hasFiles = false;
        let needsUpdate = false;
        
        for (const { field, name, value } of fileFields) {
          if (value && value.trim() !== '') {
            hasFiles = true;
            console.log(`   📎 ${name}: ${value.substring(0, 60)}...`);
            
            if (TelegramFileStorage.isTelegramFileId(value)) {
              console.log(`   ⚠️ ${name} has Telegram file ID that needs conversion`);
              needsUpdate = true;
            } else if (value.includes('contact-pending')) {
              console.log(`   🚨 ${name} has broken "contact-pending" URL`);
              needsUpdate = true;
            } else {
              console.log(`   ✅ ${name} has proper permanent URL`);
            }
          }
        }
        
        if (hasFiles) {
          contactsWithFiles++;
          if (needsUpdate) {
            contactsNeedingUpdate++;
          }
        } else {
          console.log(`   ⚪ Contact has no file attachments`);
        }
        
      } catch (error: any) {
        console.error(`   ❌ Error checking contact ${contactId}:`, error.message);
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Step 5: Summary
    console.log('');
    console.log('🎉 [CAREER-DEALS] Career deals analysis complete!');
    console.log('='.repeat(80));
    console.log('📊 RESULTS:');
    console.log(`   🔗 Total deals analyzed: ${allDeals.length}`);
    console.log(`   🎯 Career-related deals: ${careerDeals.length}`);
    console.log(`   👤 Unique contacts found: ${contactIds.size}`);
    console.log(`   📁 Contacts with files: ${contactsWithFiles}`);
    console.log(`   ⚠️ Contacts needing file updates: ${contactsNeedingUpdate}`);
    
    if (contactsNeedingUpdate > 0) {
      console.log('');
      console.log('💡 [CAREER-DEALS] Some contacts in career deals need file URL updates');
    } else {
      console.log('');
      console.log('✅ [CAREER-DEALS] All career deal contacts have proper file URLs');
    }
    
  } catch (error: any) {
    console.error('❌ [CAREER-DEALS] Fatal error during career deals analysis:', error.message);
  }
}

searchCareerDealsSpecific();