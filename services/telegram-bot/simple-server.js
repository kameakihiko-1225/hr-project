require('dotenv/config');
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

// Telegram file_id patterns vary by file type. Accept any file_id that starts with
// an uppercase letter/number and is reasonably long ( > 20 chars) and doesn't contain spaces
function isTelegramFileId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9]/.test(value) && value.length > 20 && !value.includes(' ');
}

function normalizePhone(phone) {
  if (!phone) return '';
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Ensure proper E.164 format for Uzbekistan numbers
  if (cleaned.startsWith('998')) {
    return `+${cleaned}`;
  } else if (cleaned.length >= 9) {
    return `+998${cleaned}`;
  }
  return cleaned ? `+998${cleaned}` : '';
}

function extractInnerTextFromHtmlLink(value) {
  if (!value) return '';
  const match = value.match(/<a[^>]*>(.*?)<\/a>/i);
  return match ? match[1] : value;
}

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || '7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY';
}

async function getTelegramFileUrl(fileId) {
  try {
    const TELEGRAM_BOT_TOKEN = getBotToken();
    const fileInfoResp = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    if (!fileInfoResp.data.ok || !fileInfoResp.data.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${encodeURI(fileInfoResp.data.result.file_path)}`;
  } catch {
    return null;
  }
}

async function getFileBufferFromTelegram(fileId, fieldName) {
  if (!fileId) return { buffer: null, url: null };
  try {
    console.log(`[TELEGRAM-BOT] Fetching Telegram file for field ${fieldName || ''}: file_id = ${fileId}`);
    const TELEGRAM_BOT_TOKEN = getBotToken();
    const fileInfoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    console.log(`[TELEGRAM-BOT] Fetching file info from: ${fileInfoUrl}`);
    const fileInfoResp = await axios.get(fileInfoUrl);
    console.log(`[TELEGRAM-BOT] File info response for field ${fieldName || ''}: ${JSON.stringify(fileInfoResp.data)}`);
    if (!fileInfoResp.data.ok || !fileInfoResp.data.result || !fileInfoResp.data.result.file_path) {
      console.error(`[TELEGRAM-BOT] No file_path found in file info for field ${fieldName || ''}`);
      return { buffer: null, url: null };
    }
    const filePath = fileInfoResp.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${encodeURI(filePath)}`;
    console.log(`[TELEGRAM-BOT] Fetching file from: ${fileUrl}`);

    // Use fetch for file downloads
    const fetch = (await import('node-fetch')).default;
    let attempt = 0;
    while (attempt < 2) {
      try {
        const resp = await fetch(fileUrl);
        if (!resp.ok) {
          console.warn(`[TELEGRAM-BOT] Download returned HTTP ${resp.status}. Falling back to URL.`);
          return { buffer: null, url: fileUrl };
        }
        const buf = Buffer.from(await resp.arrayBuffer());
        console.log(`[TELEGRAM-BOT] Successfully fetched file (attempt ${attempt + 1}) for field ${fieldName || ''}`);
        return { buffer: buf, url: fileUrl };
      } catch (e) {
        console.warn(`[TELEGRAM-BOT] Attempt ${attempt + 1} failed to fetch file: ${e.message}`);
        attempt += 1;
        if (attempt >= 2) throw e;
      }
    }
    return { buffer: null, url: fileUrl };
  } catch (e) {
    console.error(`[TELEGRAM-BOT] Failed to fetch file for field ${fieldName || ''} with file_id ${fileId}: ${e.message}`);
    return { buffer: null, url: null };
  }
}

// Helper to search Bitrix24 contacts by phone. Returns contact ID or null
async function findContactIdByPhone(phone) {
  if (!phone) return null;
  try {
    const resp = await axios.post(`${BITRIX_BASE}/crm.contact.list.json`, {
      filter: { PHONE: phone },
      select: ['ID'],
    });
    if (Array.isArray(resp.data.result) && resp.data.result.length) {
      return parseInt(resp.data.result[0].ID, 10);
    }
    return null;
  } catch (e) {
    console.error(`[TELEGRAM-BOT] Error searching contact by phone ${phone}: ${e.message}`);
    return null;
  }
}

// Helper to find existing deal in category 55 by contact id (latest)
async function findDealIdByContact(contactId) {
  try {
    const resp = await axios.post(`${BITRIX_BASE}/crm.deal.list.json`, {
      filter: { CONTACT_ID: contactId, CATEGORY_ID: '55' },
      select: ['ID'],
      order: { ID: 'DESC' },
    });
    if (Array.isArray(resp.data.result) && resp.data.result.length) {
      return parseInt(resp.data.result[0].ID, 10);
    }
    return null;
  } catch (e) {
    console.error(`[TELEGRAM-BOT] Error searching deal for contact ${contactId}: ${e.message}`);
    return null;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'telegram-bot-service',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Millat Umidi Telegram Bot Service - Ready!');
});

// Main webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    // Log the full incoming data for troubleshooting
    console.log('[TELEGRAM-BOT] Incoming webhook data:', JSON.stringify(data, null, 2));
    
    // 1. Download resume and diploma files as buffers (log file IDs)
    console.log(`[TELEGRAM-BOT] Resume file_id: ${data.resume}`);
    console.log(`[TELEGRAM-BOT] Diploma file_id: ${data.diploma}`);
    const resumeResult = isTelegramFileId(data.resume)
      ? await getFileBufferFromTelegram(data.resume, 'resume')
      : { buffer: null, url: null };
    const diplomaResult = isTelegramFileId(data.diploma)
      ? await getFileBufferFromTelegram(data.diploma, 'diploma')
      : { buffer: null, url: null };

    // 2. Prepare contact fields (always create new contact)
    const fullName = (data.full_name_uzbek || '').trim();
    const nameParts = fullName.split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ');
    const phoneRaw = data.phone_number_uzbek || '';
    const ageRaw = data.age_uzbek || data.user_age || data.age || data.age_ru;

    const phone = normalizePhone(phoneRaw);
    console.log(`[TELEGRAM-BOT] Full name: "${fullName}", phone_raw: "${phoneRaw}", normalized_phone: "${phone}", age: "${ageRaw}"`);
    console.log(`[TELEGRAM-BOT] Phone check: phone="${phone}", Boolean(phone)=${Boolean(phone)}`);
    const contactFields = {
      NAME: fullName || 'Unknown',
      UF_CRM_1752239621: data.position_uz, // position
      UF_CRM_1752239635: data.city_uzbek,  // city
      UF_CRM_1752239653: data.degree,      // degree
      UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(data.username), // telegram username
      UF_CRM_1752622669492: ageRaw, // age field
    };
    
    // Add phone field using array format with VALUE/VALUE_TYPE + backup custom field
    if (phone) {
      contactFields.PHONE = [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }]; // E.164 format with MOBILE type
      contactFields.UF_CRM_1747689959 = phone; // Backup custom field
      console.log('[TELEGRAM-BOT] Adding phone field (E.164 format):', phone);
      console.log('[TELEGRAM-BOT] Phone backup field UF_CRM_1747689959:', phone);
      console.log('[TELEGRAM-BOT] PHONE array structure:', contactFields.PHONE);
    }
    
    // Resolve resume & diploma links
    const resumeLink = data.resume ? (resumeResult.url || (isTelegramFileId(data.resume) ? await getTelegramFileUrl(data.resume) : null) || data.resume) : null;
    const diplomaLink = data.diploma ? (diplomaResult.url || (isTelegramFileId(data.diploma) ? await getTelegramFileUrl(data.diploma) : null) || data.diploma) : null;

    // Add link fields required by Bitrix24
    if (resumeLink) {
      contactFields['UF_CRM_1752621810'] = resumeLink; // resume link field
    }
    if (diplomaLink) {
      contactFields['UF_CRM_1752621831'] = diplomaLink; // diploma link field
    }

    // Build Comments with links and age (phone now handled separately)
    const commentsParts = [];
    if (resumeLink) commentsParts.push(`Resume: ${resumeLink}`);
    if (diplomaLink) commentsParts.push(`Diploma: ${diplomaLink}`);
    if (ageRaw) {
      commentsParts.push(`The Age is ${ageRaw}`);
    }
    if (commentsParts.length) {
      contactFields.COMMENTS = commentsParts.join('\n');
    }

    // Handle Phase2 text or voice answers (store as text/link)
    const phase2 = [
      { val: data.phase2_q_1, textField: 'UF_CRM_1752241370', voiceField: 'UF_CRM_1752621857', filename: 'q1.ogg', label: 'phase2_q_1' },
      { val: data.phase2_q_2, textField: 'UF_CRM_1752241378', voiceField: 'UF_CRM_1752621874', filename: 'q2.ogg', label: 'phase2_q_2' },
      { val: data.phase2_q_3, textField: 'UF_CRM_1752241386', voiceField: 'UF_CRM_1752621887', filename: 'q3.ogg', label: 'phase2_q_3' },
    ];
    const phase2Log = [];
    for (const q of phase2) {
      if (!q.val) continue;
      if (isTelegramFileId(q.val)) {
        const link = await getTelegramFileUrl(q.val);
        if (link) {
          contactFields[q.voiceField] = link; // Use voice field for valid file IDs
          commentsParts.push(`${q.label}: ${link}`);
          phase2Log.push(`${q.label} (voice file link): ${link}`);
        } else {
          // If file ID cannot be resolved, treat as text and use text field
          contactFields[q.textField] = q.val;
          commentsParts.push(`${q.label} (text fallback): ${q.val}`);
          phase2Log.push(`${q.label} (file_id unresolved, saved as text): ${q.val}`);
        }
      } else {
        contactFields[q.textField] = q.val; // Use text field for simple text
        commentsParts.push(`${q.label} (text): ${q.val}`);
        phase2Log.push(`${q.label} (text): ${q.val}`);
      }
    }
    console.log('[TELEGRAM-BOT] Phase2 answers log:', phase2Log.join(' | '));
    
    // Prepare FormData for contact (no file buffers for resume/diploma/phase2)
    const contactForm = new FormData();
    
    // Add each field to FormData individually with proper formatting
    for (const [key, value] of Object.entries(contactFields)) {
      if (value !== null && value !== undefined) {
        if (key === 'PHONE' && Array.isArray(value)) {
          // Special handling for PHONE field - Bitrix24 multifield format
          contactForm.append(`fields[${key}]`, JSON.stringify(value));
          console.log(`[TELEGRAM-BOT] Added PHONE field to FormData: ${JSON.stringify(value)}`);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          contactForm.append(`fields[${key}]`, JSON.stringify(value));
        } else {
          contactForm.append(`fields[${key}]`, String(value));
        }
      }
    }
    
    contactForm.append('params[REGISTER_SONET_EVENT]', 'Y');
    console.log('[TELEGRAM-BOT] FormData prepared for Bitrix24 submission');
    
    // Check duplicate by phone and update if exists
    let contactId;
    if (phone) {
      const existingId = await findContactIdByPhone(phone);
      if (existingId) {
        console.log(`[TELEGRAM-BOT] Existing contact found: ${existingId}, updating...`);
        contactForm.append('id', existingId.toString());
        const updateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, contactForm, {
          headers: contactForm.getHeaders(),
        });
        console.log('[TELEGRAM-BOT] Contact update response:', updateResp.data);
        contactId = existingId;
      } else {
        const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, contactForm, {
          headers: contactForm.getHeaders(),
        });
        console.log('[TELEGRAM-BOT] Contact create response:', createResp.data);
        
        // Log any errors in the response
        if (createResp.data.error) {
          console.log('[TELEGRAM-BOT] Bitrix24 API Error:', createResp.data.error);
        }
        contactId = createResp.data.result;
        
        // Verify phone field was added by fetching the contact back
        if (contactId && phone) {
          try {
            const verifyResp = await axios.get(`${BITRIX_BASE}/crm.contact.get.json?ID=${contactId}`);
            const contact = verifyResp.data.result;
            if (contact && contact.PHONE && contact.PHONE.length > 0) {
              console.log('[TELEGRAM-BOT] Phone field verified in contact:', contact.PHONE);
            } else {
              console.log('[TELEGRAM-BOT] WARNING: Phone field not found in created contact, adding phone number manually');
              
              // Add phone number using update API
              const phoneUpdateForm = new FormData();
              phoneUpdateForm.append('ID', contactId);
              phoneUpdateForm.append('fields[PHONE][0][VALUE]', phone);
              phoneUpdateForm.append('fields[PHONE][0][VALUE_TYPE]', 'MOBILE');
              
              try {
                const phoneUpdateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, phoneUpdateForm, {
                  headers: phoneUpdateForm.getHeaders(),
                });
                console.log('[TELEGRAM-BOT] Phone field manually added via update:', phoneUpdateResp.data);
              } catch (phoneUpdateError) {
                console.log('[TELEGRAM-BOT] Failed to manually add phone field:', phoneUpdateError.message);
              }
            }
          } catch (verifyError) {
            console.log('[TELEGRAM-BOT] Could not verify contact phone field:', verifyError.message);
          }
        }
      }
    } else {
      // No phone – always create
      const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, contactForm, {
        headers: contactForm.getHeaders(),
      });
      console.log('[TELEGRAM-BOT] Contact create response:', createResp.data);
      contactId = createResp.data.result;
    }

    // 3. Prepare deal fields (always create new deal attached to contact)
    const dealFields = {
      TITLE: `HR BOT - ${firstName} ${lastName}`.trim(),
      CATEGORY_ID: '55',
      STATUS_ID: 'C55:NEW',
      UTM_SOURCE: 'hr_telegram_bot',
      CONTACT_ID: contactId,
      UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(data.username), // telegram username
    };
    console.log('[TELEGRAM-BOT] Deal payload:', dealFields);

    // If we just updated an existing contact, try to find their deal
    let dealId;
    const existingDealId = await findDealIdByContact(contactId);
    if (existingDealId) {
      console.log(`[TELEGRAM-BOT] Existing deal found: ${existingDealId}, updating...`);
      const updatePayload = {
        id: existingDealId,
        fields: dealFields,
        params: { REGISTER_SONET_EVENT: 'Y' },
      };
      const updResp = await axios.post(`${BITRIX_BASE}/crm.deal.update.json`, updatePayload);
      console.log('[TELEGRAM-BOT] Deal update response:', updResp.data);
      dealId = existingDealId;
    } else {
      const createPayload = {
        fields: dealFields,
        params: { REGISTER_SONET_EVENT: 'Y' },
      };
      const createResp = await axios.post(`${BITRIX_BASE}/crm.deal.add.json`, createPayload);
      console.log('[TELEGRAM-BOT] Deal create response:', createResp.data);
      dealId = createResp.data.result;
    }
    console.log(`[TELEGRAM-BOT] DealId processed: ${dealId}`);

    // 4. Return success response
    return res.status(200).json({
      message: 'Contact and Deal created in Bitrix24',
      contactId,
      dealId,
    });
  } catch (error) {
    console.error('[TELEGRAM-BOT] Error processing contact or deal:', error?.response?.data || error.message);
    return res.status(500).json({
      message: 'Error processing contact or deal',
      error: error?.response?.data || error.message,
    });
  }
});

const port = process.env.TELEGRAM_BOT_PORT || 3001;
app.listen(port, () => {
  console.log(`[TELEGRAM-BOT] Service running on port ${port}`);
  console.log(`[TELEGRAM-BOT] Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`[TELEGRAM-BOT] Health check: http://localhost:${port}/health`);
});