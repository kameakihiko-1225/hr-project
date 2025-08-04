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

async function migrateAllContactsToPermamentFiles() {
  console.log('🚀 [MIGRATION] Starting migration of all contacts to permanent file solution');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get all contacts from Bitrix24
    console.log('📋 [MIGRATION] Fetching all contacts from Bitrix24...');
    
    const response = await axios.get(`${BITRIX_BASE}/crm.contact.list.json?select[]=ID&select[]=NAME&select[]=LAST_NAME&select[]=UF_CRM_1752621810&select[]=UF_CRM_1752621831&select[]=UF_CRM_1752621857&select[]=UF_CRM_1752621874&select[]=UF_CRM_1752621887`, {
      timeout: 30000
    });
    
    if (!response.data || !response.data.result) {
      console.log('❌ [MIGRATION] No contacts found or API error');
      return;
    }
    
    const contacts = response.data.result;
    console.log(`✅ [MIGRATION] Found ${contacts.length} total contacts`);
    
    // Step 2: Filter contacts that have file fields with Telegram file IDs
    const contactsWithFiles = contacts.filter((contact: any) => {
      const fileFields = [
        contact.UF_CRM_1752621810, // Resume
        contact.UF_CRM_1752621831, // Diploma
        contact.UF_CRM_1752621857, // Voice Q1
        contact.UF_CRM_1752621874, // Voice Q2
        contact.UF_CRM_1752621887  // Voice Q3
      ];
      
      return fileFields.some(field => 
        field && 
        typeof field === 'string' && 
        TelegramFileStorage.isTelegramFileId(field)
      );
    });
    
    console.log(`🎯 [MIGRATION] Found ${contactsWithFiles.length} contacts with Telegram file IDs to migrate`);
    
    if (contactsWithFiles.length === 0) {
      console.log('✅ [MIGRATION] No contacts require migration - all files already using permanent URLs');
      return;
    }
    
    // Step 3: Process each contact
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < contactsWithFiles.length; i++) {
      const contact = contactsWithFiles[i];
      const contactName = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
      
      console.log('');
      console.log(`🔄 [MIGRATION] Processing contact ${i + 1}/${contactsWithFiles.length}: ${contact.ID} (${contactName})`);
      
      try {
        const updatedFields: ContactFileFields = {};
        let hasUpdates = false;
        
        // Process Resume
        if (contact.UF_CRM_1752621810 && TelegramFileStorage.isTelegramFileId(contact.UF_CRM_1752621810)) {
          console.log(`   📄 Converting resume: ${contact.UF_CRM_1752621810}`);
          const permanentUrl = await TelegramFileStorage.processFileField(
            contact.UF_CRM_1752621810, 
            'resume', 
            contact.ID
          );
          updatedFields.UF_CRM_1752621810 = permanentUrl;
          hasUpdates = true;
          console.log(`   ✅ Resume converted to: ${permanentUrl}`);
        }
        
        // Process Diploma
        if (contact.UF_CRM_1752621831 && TelegramFileStorage.isTelegramFileId(contact.UF_CRM_1752621831)) {
          console.log(`   🎓 Converting diploma: ${contact.UF_CRM_1752621831}`);
          const permanentUrl = await TelegramFileStorage.processFileField(
            contact.UF_CRM_1752621831, 
            'diploma', 
            contact.ID
          );
          updatedFields.UF_CRM_1752621831 = permanentUrl;
          hasUpdates = true;
          console.log(`   ✅ Diploma converted to: ${permanentUrl}`);
        }
        
        // Process Voice Q1
        if (contact.UF_CRM_1752621857 && TelegramFileStorage.isTelegramFileId(contact.UF_CRM_1752621857)) {
          console.log(`   🎧 Converting voice Q1: ${contact.UF_CRM_1752621857}`);
          const permanentUrl = await TelegramFileStorage.processFileField(
            contact.UF_CRM_1752621857, 
            'phase2_q1', 
            contact.ID
          );
          updatedFields.UF_CRM_1752621857 = permanentUrl;
          hasUpdates = true;
          console.log(`   ✅ Voice Q1 converted to: ${permanentUrl}`);
        }
        
        // Process Voice Q2
        if (contact.UF_CRM_1752621874 && TelegramFileStorage.isTelegramFileId(contact.UF_CRM_1752621874)) {
          console.log(`   🎧 Converting voice Q2: ${contact.UF_CRM_1752621874}`);
          const permanentUrl = await TelegramFileStorage.processFileField(
            contact.UF_CRM_1752621874, 
            'phase2_q2', 
            contact.ID
          );
          updatedFields.UF_CRM_1752621874 = permanentUrl;
          hasUpdates = true;
          console.log(`   ✅ Voice Q2 converted to: ${permanentUrl}`);
        }
        
        // Process Voice Q3
        if (contact.UF_CRM_1752621887 && TelegramFileStorage.isTelegramFileId(contact.UF_CRM_1752621887)) {
          console.log(`   🎧 Converting voice Q3: ${contact.UF_CRM_1752621887}`);
          const permanentUrl = await TelegramFileStorage.processFileField(
            contact.UF_CRM_1752621887, 
            'phase2_q3', 
            contact.ID
          );
          updatedFields.UF_CRM_1752621887 = permanentUrl;
          hasUpdates = true;
          console.log(`   ✅ Voice Q3 converted to: ${permanentUrl}`);
        }
        
        // Update contact if we have changes
        if (hasUpdates) {
          console.log(`   📤 Updating contact ${contact.ID} with ${Object.keys(updatedFields).length} permanent URLs...`);
          
          const updatePayload = {
            id: contact.ID,
            fields: updatedFields
          };
          
          const updateResponse = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          
          if (updateResponse.data && updateResponse.data.result) {
            console.log(`   ✅ Contact ${contact.ID} updated successfully`);
            successCount++;
          } else {
            console.log(`   ❌ Failed to update contact ${contact.ID}:`, updateResponse.data);
            errorCount++;
          }
        } else {
          console.log(`   ⚪ Contact ${contact.ID} - no Telegram file IDs found to convert`);
        }
        
      } catch (error: any) {
        console.error(`   ❌ Error processing contact ${contact.ID}:`, error.message);
        errorCount++;
      }
      
      // Add small delay to avoid rate limiting
      if (i < contactsWithFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Step 4: Summary
    console.log('');
    console.log('🎉 [MIGRATION] Migration complete!');
    console.log('='.repeat(80));
    console.log(`📊 RESULTS:`);
    console.log(`   ✅ Successfully migrated: ${successCount} contacts`);
    console.log(`   ❌ Errors: ${errorCount} contacts`);
    console.log(`   📋 Total processed: ${contactsWithFiles.length} contacts`);
    console.log(`   🏁 All contacts now use permanent file URLs`);
    
  } catch (error: any) {
    console.error('❌ [MIGRATION] Fatal error during migration:', error.message);
  }
}

// Run the migration
migrateAllContactsToPermamentFiles();