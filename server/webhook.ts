// Import required modules - use exact same approach as working simple-server.js
import axiosDefault from 'axios';
import FormDataClass from 'form-data';

const axios = axiosDefault;
const FormData = FormDataClass;

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || '7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY';
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('998')) {
    return `+${cleaned}`;
  } else if (cleaned.length >= 9) {
    return `+998${cleaned}`;
  }
  return cleaned ? `+998${cleaned}` : '';
}

function isTelegramFileId(value: any): boolean {
  return typeof value === 'string' && /^[A-Za-z0-9]/.test(value) && value.length > 20 && !value.includes(' ');
}

function extractInnerTextFromHtmlLink(value: any): string {
  if (!value) return '';
  const match = value.match(/<a[^>]*>(.*?)<\/a>/i);
  return match ? match[1] : value;
}

function sanitizeFromBOM(text: any): any {
  if (typeof text !== 'string') return text;
  return text.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '').trim();
}

async function findExistingContact(phone: string): Promise<string | null> {
  if (!phone) return null;
  try {
    const searchResp = await axios.get(`${BITRIX_BASE}/crm.contact.list.json?filter[PHONE]=${phone}`);
    const contacts = searchResp.data.result;
    return contacts && contacts.length > 0 ? contacts[0].ID : null;
  } catch {
    return null;
  }
}

async function findDealIdByContact(contactId: string): Promise<string | null> {
  if (!contactId) return null;
  try {
    const searchResp = await axios.get(`${BITRIX_BASE}/crm.deal.list.json?filter[CONTACT_ID]=${contactId}&select[]=ID`);
    const deals = searchResp.data.result;
    return deals && deals.length > 0 ? deals[0].ID : null;
  } catch {
    return null;
  }
}

export async function processWebhookData(data: any): Promise<{ message: string; contactId: string; dealId: string }> {
  console.log('='.repeat(60));
  console.log('[WEBHOOK-PROCESSING] PUZZLEBOT CLEAN JSON FORMAT');
  console.log('[WEBHOOK-PROCESSING] Data type:', typeof data);
  console.log('[WEBHOOK-PROCESSING] Data keys:', data ? Object.keys(data) : 'No keys');
  console.log('[WEBHOOK-PROCESSING] Raw data structure:', JSON.stringify(data, null, 2));
  console.log('='.repeat(60));
  
  // Handle the new clean JSON format from Puzzlebot
  // Data now comes as a clean JSON object with all fields directly accessible
  let cleanedData = data;
  
  console.log('[WEBHOOK-PROCESSING] Processing clean JSON data...');
  console.log('[WEBHOOK-PROCESSING] Available fields:', Object.keys(cleanedData || {}));
  
  // Validate that we have the essential fields
  const requiredFields = ['full_name_uzbek', 'phone_number_uzbek', 'position_uz'];
  const missingFields = requiredFields.filter(field => !cleanedData[field]);
  if (missingFields.length > 0) {
    console.log('[WEBHOOK-PROCESSING] Warning: Missing required fields:', missingFields);
  }

  console.log('[WEBHOOK-PROCESSING] Final cleaned data structure:');
  Object.keys(cleanedData).forEach(key => {
    console.log(`- ${key}: ${JSON.stringify(cleanedData[key])} (type: ${typeof cleanedData[key]})`);
  });

  // Extract fields
  const firstName = cleanedData.full_name_uzbek || '';
  const phone = normalizePhone(cleanedData.phone_number_uzbek);
  const age = cleanedData.age_uzbek || '';
  const city = cleanedData.city_uzbek || '';
  const degree = cleanedData.degree || '';
  const position = cleanedData.position_uz || '';
  const username = cleanedData.username || '';

  console.log(`[TELEGRAM-BOT] Full name: ${JSON.stringify(firstName)}, phone_raw: ${JSON.stringify(cleanedData.phone_number_uzbek)}, normalized_phone: ${JSON.stringify(phone)}, age: ${JSON.stringify(age)}`);

  // Prepare contact fields
  const contactFields: Record<string, any> = {
    NAME: firstName,
    UF_CRM_1752239621: position, // Position
    UF_CRM_1752239635: city, // City
    UF_CRM_1752239653: degree, // Degree
    UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(username), // Username
    UF_CRM_1752622669492: age, // Age
  };

  // Add phone fields
  if (phone) {
    console.log(`[TELEGRAM-BOT] Adding phone field (E.164 format): ${phone}`);
    contactFields.PHONE = [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }];
    contactFields.UF_CRM_1747689959 = phone; // Phone backup
  }

  // Handle file fields
  const resumeFileId = cleanedData.resume;
  const diplomaFileId = cleanedData.diploma;
  
  console.log(`[TELEGRAM-BOT] Resume file ID extracted: "${resumeFileId}" (is valid file ID: ${isTelegramFileId(resumeFileId)})`);
  console.log(`[TELEGRAM-BOT] Diploma file ID extracted: "${diplomaFileId}" (is valid file ID: ${isTelegramFileId(diplomaFileId)})`);
  
  if (resumeFileId && isTelegramFileId(resumeFileId)) {
    contactFields.UF_CRM_1752621810 = resumeFileId;
    console.log(`[TELEGRAM-BOT] Added resume file ID to UF_CRM_1752621810: ${resumeFileId}`);
  }
  if (diplomaFileId && isTelegramFileId(diplomaFileId)) {
    contactFields.UF_CRM_1752621831 = diplomaFileId;
    console.log(`[TELEGRAM-BOT] Added diploma file ID to UF_CRM_1752621831: ${diplomaFileId}`);
  }

  // Handle phase2 answers
  const phase2_q1 = cleanedData.phase2_q_1 || '';
  const phase2_q2 = cleanedData.phase2_q_2 || '';
  const phase2_q3 = cleanedData.phase2_q_3 || '';

  console.log(`[TELEGRAM-BOT] Phase2 answers extracted - Q1: "${phase2_q1}", Q2: "${phase2_q2}", Q3: "${phase2_q3}"`);

  if (phase2_q1) {
    contactFields.UF_CRM_1752241370 = phase2_q1;
    console.log(`[TELEGRAM-BOT] Added phase2 Q1 to UF_CRM_1752241370: ${phase2_q1}`);
  }
  if (phase2_q2) {
    contactFields.UF_CRM_1752241378 = phase2_q2;
    console.log(`[TELEGRAM-BOT] Added phase2 Q2 to UF_CRM_1752241378: ${phase2_q2}`);
  }
  if (phase2_q3) {
    contactFields.UF_CRM_1752241386 = phase2_q3;
    console.log(`[TELEGRAM-BOT] Added phase2 Q3 to UF_CRM_1752241386: ${phase2_q3}`);
  }

  // Add comments
  const comments = [];
  if (resumeFileId) comments.push(`Resume: ${resumeFileId}`);
  if (diplomaFileId) comments.push(`Diploma: ${diplomaFileId}`);
  if (age) comments.push(`The Age is ${age}`);
  if (comments.length > 0) {
    contactFields.COMMENTS = comments.join('\\n');
  }

  console.log('[TELEGRAM-BOT] Contact fields being sent to Bitrix24:');
  console.log(JSON.stringify(contactFields, null, 2));

  // Create JSON payload for contact - Bitrix24 works better with JSON than FormData
  const contactPayload = {
    fields: contactFields
  };
  
  console.log('[TELEGRAM-BOT] Contact JSON payload being sent to Bitrix24:');
  console.log(JSON.stringify(contactPayload, null, 2));

  // Check for existing contact
  let contactId: string;
  const existingContactId = await findExistingContact(phone);
  
  if (existingContactId) {
    console.log(`[TELEGRAM-BOT] Existing contact found: ${existingContactId}, updating...`);
    const updatePayload = {
      id: existingContactId,
      fields: contactFields
    };
    const updateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    console.log('[TELEGRAM-BOT] Contact update response:', updateResp.data);
    contactId = existingContactId;
  } else {
    console.log('[TELEGRAM-BOT] Creating new contact...');
    const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, contactPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    console.log('[TELEGRAM-BOT] Contact create response:', createResp.data);
    contactId = createResp.data.result;
  }

  // Create/update deal with proper contact linking
  const dealFields = {
    TITLE: `HR BOT - ${firstName}`.trim(),
    CATEGORY_ID: '55',
    STATUS_ID: 'C55:NEW',
    UTM_SOURCE: 'hr_telegram_bot',
    CONTACT_ID: contactId,
    UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(username),
  };

  const existingDealId = await findDealIdByContact(contactId);
  let dealId: string;
  
  if (existingDealId) {
    const updatePayload = {
      id: existingDealId,
      fields: dealFields,
      params: { REGISTER_SONET_EVENT: 'Y' },
    };
    const updateResp = await axios.post(`${BITRIX_BASE}/crm.deal.update.json`, updatePayload);
    console.log('[TELEGRAM-BOT] Deal update response:', updateResp.data);
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

  // Contact is automatically linked to deal via CONTACT_ID field during deal creation
  console.log(`[TELEGRAM-BOT] ✅ Contact ${contactId} linked to deal ${dealId} successfully`);

  return {
    message: 'Contact and Deal created in Bitrix24',
    contactId,
    dealId,
  };
}