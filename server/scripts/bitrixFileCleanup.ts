import axios from 'axios';

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

interface BitrixContact {
  ID: string;
  NAME: string;
  UF_CRM_1752621810?: string; // Resume field
  UF_CRM_1752621831?: string; // Diploma field
  UF_CRM_1752621857?: string; // Voice Q1 field
  UF_CRM_1752621874?: string; // Voice Q2 field
  UF_CRM_1752621887?: string; // Voice Q3 field
}

/**
 * Check if a URL is an expired Telegram file URL
 */
function isExpiredTelegramUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('api.telegram.org/file/bot') || 
         (url.startsWith('BAAD') || url.startsWith('BQA') || url.startsWith('CAADBAAd'));
}

/**
 * Update contacts to mark expired file URLs with clear messages
 */
export async function markExpiredFileUrls(): Promise<void> {
  console.log('🧹 [CLEANUP] Starting expired file URL cleanup...');
  
  try {
    // Get all contacts with file fields
    const response = await axios.get(`${BITRIX_BASE}/crm.contact.list.json`, {
      params: {
        select: [
          'ID', 'NAME', 
          'UF_CRM_1752621810', // Resume
          'UF_CRM_1752621831', // Diploma
          'UF_CRM_1752621857', // Voice Q1
          'UF_CRM_1752621874', // Voice Q2
          'UF_CRM_1752621887'  // Voice Q3
        ],
        filter: {
          '!UF_CRM_1752621810': '', // Has resume field
        }
      },
      timeout: 30000
    });

    if (!response.data || !response.data.result) {
      console.log('❌ [CLEANUP] No contacts found');
      return;
    }

    const contacts = response.data.result as BitrixContact[];
    console.log(`✅ [CLEANUP] Found ${contacts.length} contacts with file fields`);

    let updateCount = 0;

    for (const contact of contacts) {
      console.log(`\n📋 [CLEANUP] Processing contact ${contact.ID}: ${contact.NAME}`);
      
      const updatedFields: any = {};
      let hasExpiredFiles = false;

      // Check resume field
      if (contact.UF_CRM_1752621810 && isExpiredTelegramUrl(contact.UF_CRM_1752621810)) {
        updatedFields.UF_CRM_1752621810 = '[EXPIRED] Resume file - Please re-upload via Telegram bot';
        hasExpiredFiles = true;
        console.log(`  📄 Marked expired resume: ${contact.UF_CRM_1752621810}`);
      }

      // Check diploma field
      if (contact.UF_CRM_1752621831 && isExpiredTelegramUrl(contact.UF_CRM_1752621831)) {
        updatedFields.UF_CRM_1752621831 = '[EXPIRED] Diploma file - Please re-upload via Telegram bot';
        hasExpiredFiles = true;
        console.log(`  🎓 Marked expired diploma: ${contact.UF_CRM_1752621831}`);
      }

      // Check voice files
      if (contact.UF_CRM_1752621857 && isExpiredTelegramUrl(contact.UF_CRM_1752621857)) {
        updatedFields.UF_CRM_1752621857 = '[EXPIRED] Voice Q1 - Please re-upload via Telegram bot';
        hasExpiredFiles = true;
        console.log(`  🎧 Marked expired voice Q1`);
      }

      if (contact.UF_CRM_1752621874 && isExpiredTelegramUrl(contact.UF_CRM_1752621874)) {
        updatedFields.UF_CRM_1752621874 = '[EXPIRED] Voice Q2 - Please re-upload via Telegram bot';
        hasExpiredFiles = true;
        console.log(`  🎧 Marked expired voice Q2`);
      }

      if (contact.UF_CRM_1752621887 && isExpiredTelegramUrl(contact.UF_CRM_1752621887)) {
        updatedFields.UF_CRM_1752621887 = '[EXPIRED] Voice Q3 - Please re-upload via Telegram bot';
        hasExpiredFiles = true;
        console.log(`  🎧 Marked expired voice Q3`);
      }

      // Update contact if expired files found
      if (hasExpiredFiles) {
        try {
          const updatePayload = {
            id: contact.ID,
            fields: updatedFields
          };

          const updateResponse = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });

          if (updateResponse.data && updateResponse.data.result) {
            console.log(`  ✅ Contact ${contact.ID} updated with expired file markers`);
            updateCount++;
          } else {
            console.log(`  ❌ Failed to update contact ${contact.ID}`);
          }
        } catch (error: any) {
          console.error(`  ❌ Error updating contact ${contact.ID}:`, error.message);
        }
      } else {
        console.log(`  ✅ Contact ${contact.ID} has no expired files`);
      }

      // Small delay to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ [CLEANUP] Expired file URL cleanup completed!');
    console.log(`📊 [CLEANUP] Updated ${updateCount} contacts with expired file markers`);
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ [CLEANUP] Cleanup failed:', error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  markExpiredFileUrls()
    .then(() => {
      console.log('🎉 [CLEANUP] Cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 [CLEANUP] Cleanup script failed:', error);
      process.exit(1);
    });
}