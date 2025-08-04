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

async function checkCategory55Deals() {
  console.log('🔍 [CATEGORY-55] Searching for deals with category_id = 55 and updating contact files');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get deals with category_id = 55
    console.log('📋 [CATEGORY-55] Fetching deals with category_id = 55...');
    
    const dealsResponse = await axios.get(`${BITRIX_BASE}/crm.deal.list.json?filter[CATEGORY_ID]=55&select[]=ID&select[]=TITLE&select[]=CONTACT_ID&select[]=STAGE_ID&select[]=CATEGORY_ID&select[]=ASSIGNED_BY_ID&select[]=DATE_CREATE`, {
      timeout: 30000
    });
    
    if (!dealsResponse.data?.result) {
      console.log('❌ [CATEGORY-55] No deals found with category_id = 55');
      return;
    }
    
    const category55Deals = dealsResponse.data.result;
    console.log(`✅ [CATEGORY-55] Found ${category55Deals.length} deals with category_id = 55`);
    
    if (category55Deals.length === 0) {
      console.log('⚪ [CATEGORY-55] No deals in category 55');
      return;
    }
    
    // Step 2: Display deal information
    console.log('');
    console.log('📋 [CATEGORY-55] Category 55 deals:');
    
    const contactIds = new Set<string>();
    
    for (const deal of category55Deals) {
      console.log(`   🔗 Deal ${deal.ID}: "${deal.TITLE}" → Contact: ${deal.CONTACT_ID || 'None'} (Created: ${deal.DATE_CREATE})`);
      
      if (deal.CONTACT_ID && deal.CONTACT_ID !== '0') {
        contactIds.add(deal.CONTACT_ID);
      }
    }
    
    console.log(`👤 [CATEGORY-55] Found ${contactIds.size} unique contacts linked to category 55 deals`);
    
    if (contactIds.size === 0) {
      console.log('⚪ [CATEGORY-55] No contacts found in category 55 deals');
      return;
    }
    
    // Step 3: Process each contact
    let processedContacts = 0;
    let contactsWithFiles = 0;
    let contactsNeedingUpdate = 0;
    let updatedContacts = 0;
    
    for (const contactId of Array.from(contactIds)) {
      try {
        console.log('');
        console.log(`🔄 [CATEGORY-55] Processing contact ${contactId}...`);
        
        // Get contact details
        const contactResponse = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?id=${contactId}`, {
          timeout: 10000
        });
        
        if (!contactResponse.data?.result) {
          console.log(`❌ [CATEGORY-55] Contact ${contactId} not found`);
          continue;
        }
        
        const contact = contactResponse.data.result;
        const contactName = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
        console.log(`👤 [CATEGORY-55] Contact: ${contactName} (ID: ${contactId})`);
        
        // Check file fields
        const fileFields = [
          { field: 'UF_CRM_1752621810', name: 'Resume', value: contact.UF_CRM_1752621810, type: 'resume' },
          { field: 'UF_CRM_1752621831', name: 'Diploma', value: contact.UF_CRM_1752621831, type: 'diploma' },
          { field: 'UF_CRM_1752621857', name: 'Voice Q1', value: contact.UF_CRM_1752621857, type: 'phase2_q1' },
          { field: 'UF_CRM_1752621874', name: 'Voice Q2', value: contact.UF_CRM_1752621874, type: 'phase2_q2' },
          { field: 'UF_CRM_1752621887', name: 'Voice Q3', value: contact.UF_CRM_1752621887, type: 'phase2_q3' }
        ];
        
        const fieldsToUpdate: ContactFileFields = {};
        let hasFiles = false;
        let needsUpdate = false;
        
        for (const { field, name, value, type } of fileFields) {
          if (value && value.trim() !== '') {
            hasFiles = true;
            console.log(`   📎 ${name}: ${value.substring(0, 80)}${value.length > 80 ? '...' : ''}`);
            
            if (TelegramFileStorage.isTelegramFileId(value)) {
              console.log(`   🔄 ${name}: Converting Telegram file ID to permanent URL...`);
              needsUpdate = true;
              
              try {
                const permanentUrl = await TelegramFileStorage.processFileField(value, type, contactId);
                fieldsToUpdate[field as keyof ContactFileFields] = permanentUrl;
                console.log(`   ✅ ${name}: Successfully converted to permanent URL`);
              } catch (error: any) {
                console.log(`   ❌ ${name}: Conversion failed - ${error.message}`);
                fieldsToUpdate[field as keyof ContactFileFields] = ''; // Clear failed conversions
              }
              
            } else if (value.includes('contact-pending') || value.includes('404') || value.includes('error')) {
              console.log(`   🚨 ${name}: Found broken URL - clearing`);
              needsUpdate = true;
              fieldsToUpdate[field as keyof ContactFileFields] = '';
              
            } else if (value.startsWith('https://career.millatumidi.uz') || value.startsWith('/uploads/')) {
              console.log(`   ✅ ${name}: Already has working permanent URL`);
              
            } else {
              console.log(`   ⚪ ${name}: Unknown format, keeping as-is`);
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
        
        // Update contact if needed
        if (needsUpdate) {
          console.log(`   📤 Updating contact ${contactId} with ${Object.keys(fieldsToUpdate).length} file field changes...`);
          
          try {
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
              console.log(`   ❌ Contact ${contactId} update failed:`, updateResponse.data?.error_description || 'Unknown error');
            }
          } catch (error: any) {
            console.log(`   ❌ Contact ${contactId} update error:`, error.message);
          }
        } else {
          console.log(`   ⚪ Contact ${contactId}: No updates needed`);
        }
        
        processedContacts++;
        
      } catch (error: any) {
        console.error(`   ❌ Error processing contact ${contactId}:`, error.message);
      }
      
      // Rate limiting delay
      if (processedContacts < contactIds.size) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Step 4: Summary
    console.log('');
    console.log('🎉 [CATEGORY-55] Category 55 deals analysis complete!');
    console.log('='.repeat(80));
    console.log('📊 RESULTS:');
    console.log(`   🔗 Deals in category 55: ${category55Deals.length}`);
    console.log(`   👤 Unique contacts found: ${contactIds.size}`);
    console.log(`   👤 Contacts processed: ${processedContacts}`);
    console.log(`   📁 Contacts with files: ${contactsWithFiles}`);
    console.log(`   ⚠️ Contacts needing updates: ${contactsNeedingUpdate}`);
    console.log(`   ✅ Contacts successfully updated: ${updatedContacts}`);
    
    if (updatedContacts > 0) {
      console.log('');
      console.log(`🎯 [CATEGORY-55] Successfully updated ${updatedContacts} contacts in category 55 deals`);
    } else {
      console.log('');
      console.log('✅ [CATEGORY-55] All category 55 deal contacts already have optimal file URLs');
    }
    
  } catch (error: any) {
    console.error('❌ [CATEGORY-55] Fatal error during category 55 analysis:', error.message);
  }
}

checkCategory55Deals();