require('dotenv/config');
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

// Telegram file_id patterns vary by file type. Accept any file_id that starts with
// an uppercase letter/number and is reasonably long ( > 20 chars)
function isTelegramFileId(value) {
  return typeof value === 'string' && /^[A-Z0-9]/.test(value) && value.length > 20;
}

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
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

    // Some proxies return 404 when using axios on binary endpoints. Use node-fetch which
    // mirrors the behaviour of Telegram examples. Retry once on failure.
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

// Phone number fallback function - verify and add phone if missing after contact creation
async function ensurePhoneNumberSet(contactId, phone) {
  if (!contactId || !phone) {
    console.log('[TELEGRAM-BOT] Skipping phone verification - missing contactId or phone');
    return;
  }

  try {
    console.log(`[TELEGRAM-BOT] Verifying phone number for contact ${contactId}...`);
    
    // Get contact details to check if phone was set
    const getResp = await axios.post(`${BITRIX_BASE}/crm.contact.get.json`, {
      id: contactId,
      select: ['PHONE']
    });
    
    if (!getResp.data.result || !getResp.data.result.PHONE || getResp.data.result.PHONE.length === 0) {
      console.log(`[TELEGRAM-BOT] Phone number missing from contact ${contactId}, adding manually...`);
      
      // Try multiple methods to add phone number
      const phoneData = { VALUE: phone, VALUE_TYPE: 'MOBILE' };
      
      // Method 1: Direct contact update with phone array
      try {
        const updateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, {
          id: contactId,
          fields: { PHONE: [phoneData] }
        });
        console.log('[TELEGRAM-BOT] Phone added via contact update:', updateResp.data);
        if (updateResp.data.result) {
          console.log('[TELEGRAM-BOT] ✅ Phone number successfully added to contact');
          return;
        }
      } catch (updateError) {
        console.log('[TELEGRAM-BOT] Direct phone update failed:', updateError?.response?.data || updateError.message);
      }
      
      // Method 2: FormData approach (same as initial creation)
      try {
        const phoneForm = new FormData();
        phoneForm.append('id', contactId);
        phoneForm.append('fields[PHONE]', JSON.stringify([phoneData]));
        
        const formResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, phoneForm, {
          headers: phoneForm.getHeaders(),
        });
        console.log('[TELEGRAM-BOT] Phone added via FormData:', formResp.data);
        if (formResp.data.result) {
          console.log('[TELEGRAM-BOT] ✅ Phone number successfully added via FormData method');
          return;
        }
      } catch (formError) {
        console.log('[TELEGRAM-BOT] FormData phone update failed:', formError?.response?.data || formError.message);
      }
      
    } else {
      console.log(`[TELEGRAM-BOT] ✅ Phone number already present for contact ${contactId}`);
    }
    
  } catch (error) {
    console.error(`[TELEGRAM-BOT] Error during phone verification for contact ${contactId}:`, error?.response?.data || error.message);
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

// GET webhook info endpoint
app.get('/webhook', (req, res) => {
  res.json({ 
    status: 'Webhook endpoint is active',
    url: 'https://career.millatumidi.uz/webhook',
    method: 'POST',
    timestamp: new Date().toISOString()
  });
});

// Main webhook handler - follows exact NestJS logic
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

    // 2. Prepare contact fields - extract exactly as main webhook does
    const fullName = (data.full_name_uzbek || '').trim();
    const phoneRaw = data.phone_number_uzbek || '';
    const ageRaw = data.age_uzbek || '';
    const cityRaw = data.city_uzbek || '';
    const degreeRaw = data.degree || '';
    const positionRaw = data.position_uz || '';
    const usernameRaw = data.username || '';

    // Normalize phone number to E.164 format
    const normalizedPhone = phoneRaw ? (phoneRaw.startsWith('998') ? `+${phoneRaw}` : `+998${phoneRaw}`) : '';
    
    console.log(`[TELEGRAM-BOT] Full name: "${fullName}", phone_raw: "${phoneRaw}", normalized_phone: "${normalizedPhone}", age: "${ageRaw}"`);
    console.log(`[TELEGRAM-BOT] City: "${cityRaw}", degree: "${degreeRaw}", position: "${positionRaw}", username: "${usernameRaw}"`);
    
    const contactFields = {
      NAME: fullName || 'Unknown',
      UF_CRM_1752239621: positionRaw, // position
      UF_CRM_1752239635: cityRaw,     // city
      UF_CRM_1752239653: degreeRaw,   // degree
      UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(usernameRaw), // telegram username
      UF_CRM_1752622669492: ageRaw,   // age field (this was missing!)
    };

    // Add phone if available
    if (normalizedPhone) {
      contactFields.PHONE = [{ VALUE: normalizedPhone, VALUE_TYPE: 'MOBILE' }];
    }

    // Handle file fields using correct field IDs
    if (data.resume && isTelegramFileId(data.resume)) {
      contactFields.UF_CRM_1752621810 = data.resume; // Resume file field
    }
    if (data.diploma && isTelegramFileId(data.diploma)) {
      contactFields.UF_CRM_1752621831 = data.diploma; // Diploma file field
    }

    // Handle phase2 answers using correct field IDs
    if (data.phase2_q_1) {
      contactFields.UF_CRM_1752241370 = data.phase2_q_1; // Phase2 Q1 field
    }
    if (data.phase2_q_2) {
      contactFields.UF_CRM_1752241378 = data.phase2_q_2; // Phase2 Q2 field
    }
    if (data.phase2_q_3) {
      contactFields.UF_CRM_1752241386 = data.phase2_q_3; // Phase2 Q3 field
    }

    // Build comments
    const commentsParts = [];
    if (data.resume) commentsParts.push(`Resume: ${data.resume}`);
    if (data.diploma) commentsParts.push(`Diploma: ${data.diploma}`);
    if (ageRaw) commentsParts.push(`The Age is ${ageRaw}`);
    if (commentsParts.length > 0) {
      contactFields.COMMENTS = commentsParts.join('\\n');
    }

    console.log('[TELEGRAM-BOT] Contact fields being sent to Bitrix24:');
    console.log(JSON.stringify(contactFields, null, 2));

    // Prepare FormData for contact - use correct format
    const contactForm = new FormData();
    Object.keys(contactFields).forEach(key => {
      if (key === 'PHONE' && Array.isArray(contactFields[key])) {
        contactForm.append(key, JSON.stringify(contactFields[key]));
      } else {
        contactForm.append(key, contactFields[key]);
      }
    });

    // Check for existing contact by phone
    let contactId;
    if (normalizedPhone) {
      const existingId = await findContactIdByPhone(normalizedPhone);
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
        contactId = createResp.data.result;
      }
    } else {
      // No phone – always create
      const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, contactForm, {
        headers: contactForm.getHeaders(),
      });
      console.log('[TELEGRAM-BOT] Contact create response:', createResp.data);
      contactId = createResp.data.result;
    }

    // PHONE NUMBER FALLBACK: Verify and add phone if missing after contact creation
    if (normalizedPhone && contactId) {
      await ensurePhoneNumberSet(contactId, normalizedPhone);
    }

    // 3. Prepare deal fields (always create new deal attached to contact)
    const dealFields = {
      TITLE: `HR BOT - ${fullName}`.trim(),
      CATEGORY_ID: '55',
      STATUS_ID: 'C55:NEW',
      UTM_SOURCE: 'hr_telegram_bot',
      CONTACT_ID: contactId,
      UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(usernameRaw), // telegram username
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
    res.status(200).json({
      message: 'Contact and Deal created in Bitrix24',
      contactId,
      dealId,
    });

  } catch (error) {
    console.error('[TELEGRAM-BOT] Error processing contact or deal:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Error processing contact or deal',
      error: error?.response?.data || error.message,
    });
  }
});

// Start the server
const PORT = process.env.TELEGRAM_BOT_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[TELEGRAM-BOT] Service running on port ${PORT}`);
  console.log(`[TELEGRAM-BOT] Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`[TELEGRAM-BOT] Health check: http://localhost:${PORT}/health`);
});