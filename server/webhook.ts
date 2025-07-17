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
  console.log('🔄 [WEBHOOK-PROCESSING] STARTING DATA PROCESSING');
  console.log('='.repeat(80));
  console.log('📊 [WEBHOOK-PROCESSING] INPUT DATA ANALYSIS:');
  console.log('- Data type:', typeof data);
  console.log('- Data constructor:', data?.constructor?.name || 'Unknown');
  console.log('- Is null/undefined:', data === null || data === undefined);
  console.log('- Is array:', Array.isArray(data));
  console.log('- Has keys:', data ? Object.keys(data).length : 0);
  console.log('- Available keys:', data ? Object.keys(data) : 'No keys');
  console.log('');
  console.log('📝 [WEBHOOK-PROCESSING] RAW DATA STRUCTURE:');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
  
  // Handle the new clean JSON format from Puzzlebot
  let cleanedData = data;
  
  console.log('🧹 [WEBHOOK-PROCESSING] FIELD VALIDATION:');
  
  // Validate that we have the essential fields
  const requiredFields = ['full_name_uzbek', 'phone_number_uzbek', 'position_uz'];
  const optionalFields = ['age_uzbek', 'city_uzbek', 'degree', 'username', 'resume', 'diploma', 'phase2_q_1', 'phase2_q_2', 'phase2_q_3'];
  
  console.log('');
  console.log('🔍 [WEBHOOK-PROCESSING] REQUIRED FIELDS CHECK:');
  requiredFields.forEach(field => {
    const value = cleanedData[field];
    const exists = value !== undefined && value !== null && value !== '';
    console.log(`  ${exists ? '✅' : '❌'} ${field}: ${JSON.stringify(value)} (${typeof value})`);
  });
  
  console.log('');
  console.log('📋 [WEBHOOK-PROCESSING] OPTIONAL FIELDS CHECK:');
  optionalFields.forEach(field => {
    const value = cleanedData[field];
    const exists = value !== undefined && value !== null && value !== '';
    console.log(`  ${exists ? '✅' : '⚪'} ${field}: ${JSON.stringify(value)} (${typeof value})`);
  });
  
  const missingRequired = requiredFields.filter(field => !cleanedData[field]);
  if (missingRequired.length > 0) {
    console.log('');
    console.log('⚠️  [WEBHOOK-PROCESSING] WARNING: Missing required fields:', missingRequired);
  }
  
  console.log('');
  console.log('📊 [WEBHOOK-PROCESSING] COMPLETE FIELD SUMMARY:');
  Object.keys(cleanedData || {}).forEach(key => {
    const value = cleanedData[key];
    const isEmpty = !value || value === '';
    console.log(`  - ${key}: ${JSON.stringify(value)} (${typeof value}) ${isEmpty ? '[EMPTY]' : '[HAS VALUE]'}`);
  });
  console.log('='.repeat(80));

  // Extract fields
  const firstName = cleanedData.full_name_uzbek || '';
  const phone = normalizePhone(cleanedData.phone_number_uzbek);
  const age = cleanedData.age_uzbek || '';
  const city = cleanedData.city_uzbek || '';
  const degree = cleanedData.degree || '';
  const position = cleanedData.position_uz || '';
  const username = cleanedData.username || '';

  console.log('');
  console.log('🎯 [WEBHOOK-PROCESSING] FIELD EXTRACTION:');
  console.log(`  - Full name: ${JSON.stringify(firstName)} (from: ${JSON.stringify(cleanedData.full_name_uzbek)})`);
  console.log(`  - Phone raw: ${JSON.stringify(cleanedData.phone_number_uzbek)}`);
  console.log(`  - Phone normalized: ${JSON.stringify(phone)}`);
  console.log(`  - Age: ${JSON.stringify(age)} (from: ${JSON.stringify(cleanedData.age_uzbek)})`);
  console.log(`  - City: ${JSON.stringify(city)} (from: ${JSON.stringify(cleanedData.city_uzbek)})`);
  console.log(`  - Degree: ${JSON.stringify(degree)} (from: ${JSON.stringify(cleanedData.degree)})`);
  console.log(`  - Position: ${JSON.stringify(position)} (from: ${JSON.stringify(cleanedData.position_uz)})`);
  console.log(`  - Username: ${JSON.stringify(username)} (from: ${JSON.stringify(cleanedData.username)})`);

  // Prepare contact fields
  const contactFields: Record<string, any> = {
    NAME: firstName,
    UF_CRM_1752239621: position, // Position
    UF_CRM_1752239635: city, // City
    UF_CRM_1752239653: degree, // Degree
    UF_CRM_CONTACT_1745579971270: extractInnerTextFromHtmlLink(username), // Username
    UF_CRM_1752622669492: age, // Age
  };
  
  console.log('');
  console.log('🏗️ [WEBHOOK-PROCESSING] BASIC CONTACT FIELDS PREPARED:');
  Object.keys(contactFields).forEach(key => {
    console.log(`  - ${key}: ${JSON.stringify(contactFields[key])}`);
  });

  // Add phone fields
  console.log('');
  console.log('📞 [WEBHOOK-PROCESSING] PHONE FIELD PROCESSING:');
  if (phone) {
    console.log(`  ✅ Phone normalized successfully: ${phone}`);
    contactFields.PHONE = [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }];
    contactFields.UF_CRM_1747689959 = phone; // Phone backup
    console.log(`  - Added PHONE array: ${JSON.stringify(contactFields.PHONE)}`);
    console.log(`  - Added UF_CRM_1747689959 backup: ${phone}`);
  } else {
    console.log(`  ❌ No valid phone number found. Raw: ${JSON.stringify(cleanedData.phone_number_uzbek)}`);
  }

  // Handle file fields
  console.log('');
  console.log('📎 [WEBHOOK-PROCESSING] FILE FIELDS PROCESSING:');
  const resumeFileId = cleanedData.resume;
  const diplomaFileId = cleanedData.diploma;
  
  console.log(`  - Resume field: ${JSON.stringify(resumeFileId)}`);
  console.log(`  - Resume is valid Telegram file ID: ${isTelegramFileId(resumeFileId)}`);
  console.log(`  - Diploma field: ${JSON.stringify(diplomaFileId)}`);
  console.log(`  - Diploma is valid Telegram file ID: ${isTelegramFileId(diplomaFileId)}`);
  
  if (resumeFileId && isTelegramFileId(resumeFileId)) {
    contactFields.UF_CRM_1752621810 = resumeFileId;
    console.log(`  ✅ Added resume file ID to UF_CRM_1752621810: ${resumeFileId}`);
  } else {
    console.log(`  ❌ Resume file ID invalid or missing`);
  }
  
  if (diplomaFileId && isTelegramFileId(diplomaFileId)) {
    contactFields.UF_CRM_1752621831 = diplomaFileId;
    console.log(`  ✅ Added diploma file ID to UF_CRM_1752621831: ${diplomaFileId}`);
  } else {
    console.log(`  ❌ Diploma file ID invalid or missing`);
  }

  // Handle phase2 answers
  console.log('');
  console.log('💬 [WEBHOOK-PROCESSING] PHASE2 ANSWERS PROCESSING:');
  const phase2_q1 = cleanedData.phase2_q_1 || '';
  const phase2_q2 = cleanedData.phase2_q_2 || '';
  const phase2_q3 = cleanedData.phase2_q_3 || '';

  console.log(`  - Q1: ${JSON.stringify(phase2_q1)} (${phase2_q1 ? 'HAS VALUE' : 'EMPTY'})`);
  console.log(`  - Q2: ${JSON.stringify(phase2_q2)} (${phase2_q2 ? 'HAS VALUE' : 'EMPTY'})`);
  console.log(`  - Q3: ${JSON.stringify(phase2_q3)} (${phase2_q3 ? 'HAS VALUE' : 'EMPTY'})`);

  if (phase2_q1) {
    contactFields.UF_CRM_1752241370 = phase2_q1;
    console.log(`  ✅ Added Q1 to UF_CRM_1752241370: ${phase2_q1}`);
  }
  if (phase2_q2) {
    contactFields.UF_CRM_1752241378 = phase2_q2;
    console.log(`  ✅ Added Q2 to UF_CRM_1752241378: ${phase2_q2}`);
  }
  if (phase2_q3) {
    contactFields.UF_CRM_1752241386 = phase2_q3;
    console.log(`  ✅ Added Q3 to UF_CRM_1752241386: ${phase2_q3}`);
  }

  // Add comments
  const comments = [];
  if (resumeFileId) comments.push(`Resume: ${resumeFileId}`);
  if (diplomaFileId) comments.push(`Diploma: ${diplomaFileId}`);
  if (age) comments.push(`The Age is ${age}`);
  if (comments.length > 0) {
    contactFields.COMMENTS = comments.join('\\n');
  }

  console.log('');
  console.log('🚀 [WEBHOOK-PROCESSING] FINAL BITRIX24 PAYLOAD PREPARATION:');
  console.log('📋 Contact fields summary:');
  Object.keys(contactFields).forEach(key => {
    const value = contactFields[key];
    const isEmpty = !value || (Array.isArray(value) && value.length === 0) || value === '';
    console.log(`  ${isEmpty ? '⚪' : '✅'} ${key}: ${JSON.stringify(value)}`);
  });

  // Create JSON payload for contact - Bitrix24 works better with JSON than FormData
  const contactPayload = {
    fields: contactFields
  };
  
  console.log('');
  console.log('📤 [WEBHOOK-PROCESSING] COMPLETE BITRIX24 PAYLOAD:');
  console.log(JSON.stringify(contactPayload, null, 2));

  // Check for existing contact
  console.log('');
  console.log('🔍 [WEBHOOK-PROCESSING] CHECKING FOR EXISTING CONTACT:');
  let contactId: string;
  const existingContactId = await findExistingContact(phone);
  
  if (existingContactId) {
    console.log(`  ✅ Existing contact found: ${existingContactId}`);
    console.log('  🔄 Updating existing contact...');
    const updatePayload = {
      id: existingContactId,
      fields: contactFields
    };
    console.log('  📤 Update payload:', JSON.stringify(updatePayload, null, 2));
    
    const updateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    console.log('  📨 Contact update response status:', updateResp.status);
    console.log('  📨 Contact update response data:', JSON.stringify(updateResp.data, null, 2));
    contactId = existingContactId;
  } else {
    console.log('  ❌ No existing contact found');
    console.log('  ➕ Creating new contact...');
    console.log('  📤 Create payload:', JSON.stringify(contactPayload, null, 2));
    
    const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, contactPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    console.log('  📨 Contact create response status:', createResp.status);
    console.log('  📨 Contact create response data:', JSON.stringify(createResp.data, null, 2));
    
    if (createResp.data && createResp.data.result) {
      contactId = createResp.data.result;
      console.log(`  ✅ New contact created with ID: ${contactId}`);
    } else {
      console.log('  ❌ Contact creation failed - no result ID returned');
      throw new Error('Failed to create contact in Bitrix24');
    }
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