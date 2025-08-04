import axios from 'axios';
import { TelegramFileStorage } from '../services/fileStorage.js';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

async function comprehensiveContactFileUpdate() {
  console.log('🔍 [COMPREHENSIVE] Comprehensive search for all contacts with files needing updates');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Search for contacts with specific field patterns
    console.log('📋 [COMPREHENSIVE] Searching for contacts with file fields...');
    
    // Get contacts with potential file fields - larger batch
    const contactsResponse = await axios.get(`${BITRIX_BASE}/crm.contact.list.json?start=0&select[]=ID&select[]=NAME&select[]=LAST_NAME&select[]=UF_CRM_1752621810&select[]=UF_CRM_1752621831&select[]=UF_CRM_1752621857&select[]=UF_CRM_1752621874&select[]=UF_CRM_1752621887&select[]=DATE_CREATE`, {
      timeout: 30000
    });
    
    if (!contactsResponse.data?.result) {
      console.log('❌ [COMPREHENSIVE] No contacts found');
      return;
    }
    
    let allContacts = contactsResponse.data.result;
    console.log(`✅ [COMPREHENSIVE] Found ${allContacts.length} contacts in first batch`);
    
    // Check if there are more contacts (Bitrix24 typically returns 50 at a time)
    if (allContacts.length === 50) {
      console.log('📋 [COMPREHENSIVE] Fetching additional contacts...');
      
      try {
        const moreContactsResponse = await axios.get(`${BITRIX_BASE}/crm.contact.list.json?start=50&select[]=ID&select[]=NAME&select[]=LAST_NAME&select[]=UF_CRM_1752621810&select[]=UF_CRM_1752621831&select[]=UF_CRM_1752621857&select[]=UF_CRM_1752621874&select[]=UF_CRM_1752621887&select[]=DATE_CREATE`, {
          timeout: 30000
        });
        
        if (moreContactsResponse.data?.result) {
          allContacts = [...allContacts, ...moreContactsResponse.data.result];
          console.log(`✅ [COMPREHENSIVE] Total contacts found: ${allContacts.length}`);
        }
      } catch (error) {
        console.log('⚠️ [COMPREHENSIVE] Could not fetch additional contacts, continuing with current batch');
      }
    }
    
    // Step 2: Filter contacts that have any file fields
    const contactsWithFiles = allContacts.filter((contact: any) => {
      const fileFields = [
        contact.UF_CRM_1752621810, // Resume
        contact.UF_CRM_1752621831, // Diploma
        contact.UF_CRM_1752621857, // Voice Q1
        contact.UF_CRM_1752621874, // Voice Q2
        contact.UF_CRM_1752621887  // Voice Q3
      ];
      
      return fileFields.some(field => field && field.trim() !== '');
    });
    
    console.log(`🎯 [COMPREHENSIVE] Found ${contactsWithFiles.length} contacts with file attachments`);
    
    if (contactsWithFiles.length === 0) {
      console.log('⚪ [COMPREHENSIVE] No contacts with files found');
      return;
    }
    
    // Step 3: Analyze file types and issues
    let telegramFileIds = 0;
    let brokenUrls = 0;
    let workingUrls = 0;
    let contactsNeedingUpdate = 0;
    let updatedContacts = 0;
    
    console.log('');
    console.log('🔍 [COMPREHENSIVE] Analyzing contacts with files:');
    
    for (let i = 0; i < contactsWithFiles.length; i++) {
      const contact = contactsWithFiles[i];
      const contactName = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
      
      console.log(`\n🔄 [COMPREHENSIVE] ${i + 1}/${contactsWithFiles.length}: Contact ${contact.ID} (${contactName})`);
      
      const fileFields = [
        { field: 'UF_CRM_1752621810', name: 'Resume', value: contact.UF_CRM_1752621810, type: 'resume' },
        { field: 'UF_CRM_1752621831', name: 'Diploma', value: contact.UF_CRM_1752621831, type: 'diploma' },
        { field: 'UF_CRM_1752621857', name: 'Voice Q1', value: contact.UF_CRM_1752621857, type: 'phase2_q1' },
        { field: 'UF_CRM_1752621874', name: 'Voice Q2', value: contact.UF_CRM_1752621874, type: 'phase2_q2' },
        { field: 'UF_CRM_1752621887', name: 'Voice Q3', value: contact.UF_CRM_1752621887, type: 'phase2_q3' }
      ];
      
      const fieldsToUpdate: Record<string, string> = {};
      let needsUpdate = false;
      
      for (const { field, name, value, type } of fileFields) {
        if (value && value.trim() !== '') {
          console.log(`   📎 ${name}: ${value.substring(0, 80)}...`);
          
          if (TelegramFileStorage.isTelegramFileId(value)) {
            console.log(`   🔄 ${name}: Converting Telegram file ID to permanent URL...`);
            telegramFileIds++;
            needsUpdate = true;
            
            try {
              const permanentUrl = await TelegramFileStorage.processFileField(value, type, contact.ID);
              fieldsToUpdate[field] = permanentUrl;
              console.log(`   ✅ ${name}: Converted successfully`);
            } catch (error: any) {
              console.log(`   ❌ ${name}: Conversion failed - ${error.message}`);
              fieldsToUpdate[field] = ''; // Clear failed conversions
            }
            
          } else if (value.includes('contact-pending') || value.includes('404') || value.includes('error')) {
            console.log(`   🚨 ${name}: Found broken URL - clearing`);
            brokenUrls++;
            needsUpdate = true;
            fieldsToUpdate[field] = '';
            
          } else if (value.startsWith('https://career.millatumidi.uz') || value.startsWith('/uploads/')) {
            console.log(`   ✅ ${name}: Already has working permanent URL`);
            workingUrls++;
            
          } else {
            console.log(`   ⚪ ${name}: Unknown format - ${value.substring(0, 50)}...`);
          }
        }
      }
      
      // Update contact if needed
      if (needsUpdate) {
        contactsNeedingUpdate++;
        console.log(`   📤 Updating contact ${contact.ID} with file changes...`);
        
        try {
          const updatePayload = {
            id: contact.ID,
            fields: fieldsToUpdate
          };
          
          const updateResponse = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          
          if (updateResponse.data?.result) {
            console.log(`   ✅ Contact ${contact.ID} updated successfully`);
            updatedContacts++;
          } else {
            console.log(`   ❌ Contact ${contact.ID} update failed:`, updateResponse.data?.error_description || 'Unknown error');
          }
        } catch (error: any) {
          console.log(`   ❌ Contact ${contact.ID} update error:`, error.message);
        }
      } else {
        console.log(`   ⚪ Contact ${contact.ID}: No updates needed`);
      }
      
      // Rate limiting
      if (i < contactsWithFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    
    // Step 4: Final summary
    console.log('\n🎉 [COMPREHENSIVE] Comprehensive contact file update complete!');
    console.log('='.repeat(80));
    console.log('📊 FINAL RESULTS:');
    console.log(`   👥 Total contacts analyzed: ${allContacts.length}`);
    console.log(`   📁 Contacts with files: ${contactsWithFiles.length}`);
    console.log(`   🔄 Telegram file IDs found: ${telegramFileIds}`);
    console.log(`   🚨 Broken URLs found: ${brokenUrls}`);
    console.log(`   ✅ Working URLs found: ${workingUrls}`);
    console.log(`   ⚠️ Contacts needing updates: ${contactsNeedingUpdate}`);
    console.log(`   ✅ Contacts successfully updated: ${updatedContacts}`);
    console.log('');
    
    if (updatedContacts > 0) {
      console.log(`🎯 [COMPREHENSIVE] Successfully updated ${updatedContacts} contacts with permanent file URLs`);
    } else {
      console.log('✅ [COMPREHENSIVE] All contacts already have optimal file URLs - no updates needed');
    }
    
  } catch (error: any) {
    console.error('❌ [COMPREHENSIVE] Fatal error during comprehensive update:', error.message);
  }
}

comprehensiveContactFileUpdate();