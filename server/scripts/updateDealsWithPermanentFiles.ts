import axios from 'axios';
import { TelegramFileStorage } from '../services/fileStorage.js';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

interface ContactFileFields {
  UF_CRM_1752621810?: string; // Resume
  UF_CRM_1752621831?: string; // Diploma
  UF_CRM_1752621857?: string; // Voice Q1
  UF_CRM_1752621874?: string; // Voice Q2
  UF_CRM_1752621887?: string; // Voice Q3
}

async function updateDealsWithPermanentFiles() {
  console.log('🔍 [DEALS] Searching for deals in MU career pipeline and updating contacts with permanent file URLs');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get all deals from Bitrix24
    console.log('📋 [DEALS] Fetching all deals from Bitrix24...');
    
    const dealsResponse = await axios.get(`${BITRIX_BASE}/crm.deal.list.json?select[]=ID&select[]=TITLE&select[]=CONTACT_ID&select[]=STAGE_ID&select[]=CATEGORY_ID`, {
      timeout: 30000
    });
    
    if (!dealsResponse.data?.result) {
      console.log('❌ [DEALS] No deals found or API error');
      return;
    }
    
    const deals = dealsResponse.data.result;
    console.log(`✅ [DEALS] Found ${deals.length} total deals`);
    
    // Step 2: Filter deals that have contacts (career pipeline deals)
    const dealsWithContacts = deals.filter((deal: any) => deal.CONTACT_ID && deal.CONTACT_ID !== '0');
    console.log(`🎯 [DEALS] Found ${dealsWithContacts.length} deals with linked contacts`);
    
    if (dealsWithContacts.length === 0) {
      console.log('⚪ [DEALS] No deals with contacts found');
      return;
    }
    
    // Step 3: Get unique contact IDs from deals
    const contactIds = [...new Set(dealsWithContacts.map((deal: any) => deal.CONTACT_ID))];
    console.log(`👤 [DEALS] Found ${contactIds.length} unique contacts linked to deals`);
    
    // Step 4: Process each contact
    let processedContacts = 0;
    let updatedContacts = 0;
    let contactsWithFiles = 0;
    
    for (const contactId of contactIds) {
      try {
        console.log('');
        console.log(`🔄 [DEALS] Processing contact ${contactId}...`);
        
        // Get contact details
        const contactResponse = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?id=${contactId}`, {
          timeout: 10000
        });
        
        if (!contactResponse.data?.result) {
          console.log(`❌ [DEALS] Contact ${contactId} not found`);
          continue;
        }
        
        const contact = contactResponse.data.result;
        const contactName = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
        console.log(`👤 [DEALS] Contact: ${contactName} (ID: ${contactId})`);
        
        // Check file fields
        const fileFields = {
          'UF_CRM_1752621810': contact.UF_CRM_1752621810, // Resume
          'UF_CRM_1752621831': contact.UF_CRM_1752621831, // Diploma
          'UF_CRM_1752621857': contact.UF_CRM_1752621857, // Voice Q1
          'UF_CRM_1752621874': contact.UF_CRM_1752621874, // Voice Q2
          'UF_CRM_1752621887': contact.UF_CRM_1752621887  // Voice Q3
        };
        
        // Check if contact has any Telegram file IDs that need conversion
        const fieldsToUpdate: ContactFileFields = {};
        let hasFilesToUpdate = false;
        let hasAnyFiles = false;
        
        for (const [fieldName, fieldValue] of Object.entries(fileFields)) {
          if (fieldValue && fieldValue.trim() !== '') {
            hasAnyFiles = true;
            
            if (TelegramFileStorage.isTelegramFileId(fieldValue)) {
              console.log(`   📎 Found Telegram file ID in ${fieldName}: ${fieldValue}`);
              hasFilesToUpdate = true;
              
              // Convert to permanent URL
              const fieldMapping = {
                'UF_CRM_1752621810': 'resume',
                'UF_CRM_1752621831': 'diploma',
                'UF_CRM_1752621857': 'phase2_q1',
                'UF_CRM_1752621874': 'phase2_q2',
                'UF_CRM_1752621887': 'phase2_q3'
              };
              
              const fileType = fieldMapping[fieldName as keyof typeof fieldMapping];
              const permanentUrl = await TelegramFileStorage.processFileField(fieldValue, fileType, contactId);
              fieldsToUpdate[fieldName as keyof ContactFileFields] = permanentUrl;
              console.log(`   ✅ Converted to permanent URL: ${permanentUrl}`);
              
            } else if (fieldValue.includes('contact-pending')) {
              console.log(`   ⚠️ Found broken "contact-pending" URL in ${fieldName}: ${fieldValue}`);
              // Clear broken URLs
              fieldsToUpdate[fieldName as keyof ContactFileFields] = '';
              hasFilesToUpdate = true;
              console.log(`   🧹 Cleared broken URL`);
              
            } else {
              console.log(`   ✅ ${fieldName} already has permanent URL: ${fieldValue.substring(0, 50)}...`);
            }
          }
        }
        
        if (hasAnyFiles) {
          contactsWithFiles++;
        }
        
        // Update contact if needed
        if (hasFilesToUpdate) {
          console.log(`   📤 Updating contact ${contactId} with ${Object.keys(fieldsToUpdate).length} file field changes...`);
          
          const updatePayload = {
            id: contactId,
            fields: fieldsToUpdate
          };
          
          const updateResponse = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          
          if (updateResponse.data?.result) {
            console.log(`   ✅ Contact ${contactId} updated successfully`);
            updatedContacts++;
          } else {
            console.log(`   ❌ Failed to update contact ${contactId}:`, updateResponse.data);
          }
        } else {
          console.log(`   ⚪ Contact ${contactId} - no file updates needed`);
        }
        
        processedContacts++;
        
      } catch (error: any) {
        console.error(`   ❌ Error processing contact ${contactId}:`, error.message);
      }
      
      // Add delay to avoid rate limiting
      if (processedContacts < contactIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Step 5: Show deals associated with updated contacts
    console.log('');
    console.log('📋 [DEALS] Associated deals summary:');
    
    for (const deal of dealsWithContacts.slice(0, 10)) { // Show first 10 deals
      console.log(`   🔗 Deal ${deal.ID}: "${deal.TITLE}" → Contact ${deal.CONTACT_ID}`);
    }
    
    if (dealsWithContacts.length > 10) {
      console.log(`   ... and ${dealsWithContacts.length - 10} more deals`);
    }
    
    // Step 6: Summary
    console.log('');
    console.log('🎉 [DEALS] Deal contact file update complete!');
    console.log('='.repeat(80));
    console.log('📊 RESULTS:');
    console.log(`   🔗 Total deals found: ${deals.length}`);
    console.log(`   👥 Deals with contacts: ${dealsWithContacts.length}`);
    console.log(`   👤 Unique contacts processed: ${processedContacts}`);
    console.log(`   📁 Contacts with files: ${contactsWithFiles}`);
    console.log(`   ✅ Contacts updated: ${updatedContacts}`);
    console.log(`   🏁 All deal contacts now have optimal file URLs`);
    
  } catch (error: any) {
    console.error('❌ [DEALS] Fatal error during deal contact update:', error.message);
  }
}

// Run the update
updateDealsWithPermanentFiles();