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
  console.log('[TELEGRAM-BOT] Processing webhook data...');
  console.log('[TELEGRAM-BOT] Raw data received:', JSON.stringify(data, null, 2));
  
  let cleanedData = data;

  // Handle case where Telegram bot sends data as individual field strings instead of proper JSON
  if (typeof data === 'string' || (data && Object.keys(data).some(key => typeof data[key] === 'string' && data[key].includes('"')))) {
    console.log('[TELEGRAM-BOT] Detected individual field format, attempting to parse...');
    
    try {
      // Convert the entire data object to a string to search for individual fields
      const dataString = JSON.stringify(data);
      console.log('[TELEGRAM-BOT] Full data string for parsing:', dataString);
      
      // Extract individual fields using more flexible patterns
      const extractFieldFromText = (fieldName: string, text: string): string => {
        const patterns = [
          // Look for "fieldname": "value" patterns
          new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'gi'),
          // Look for fieldname_uzbek: value patterns
          new RegExp(`"${fieldName}_uzbek"\\s*:\\s*"([^"]*)"`, 'gi'),
          // Look for simple fieldname patterns
          new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'gi')
        ];
        
        for (const pattern of patterns) {
          const matches = [...text.matchAll(pattern)];
          if (matches.length > 0) {
            const value = matches[matches.length - 1][1]; // Get last match
            console.log(`[TELEGRAM-BOT] Extracted ${fieldName}: "${value}"`);
            return value;
          }
        }
        console.log(`[TELEGRAM-BOT] Failed to extract ${fieldName} from text`);
        return '';
      };

      // Try to extract from the raw data string and individual object values
      let fullText = dataString;
      Object.values(data).forEach(value => {
        if (typeof value === 'string') {
          fullText += ' ' + value;
        }
      });

      cleanedData = {
        full_name_uzbek: extractFieldFromText('full_name', fullText) || data.full_name_uzbek || '',
        phone_number_uzbek: extractFieldFromText('phone_number', fullText) || data.phone_number_uzbek || '',
        age_uzbek: extractFieldFromText('age', fullText) || data.age_uzbek || '',
        city_uzbek: extractFieldFromText('city', fullText) || data.city_uzbek || '',
        degree: extractFieldFromText('degree', fullText) || data.degree || '',
        position_uz: extractFieldFromText('position', fullText) || data.position_uz || '',
        username: extractFieldFromText('username', fullText) || data.username || '',
        resume: extractFieldFromText('resume', fullText) || data.resume || '',
        diploma: extractFieldFromText('diploma', fullText) || data.diploma || '',
        phase2_q_1: extractFieldFromText('phase2_q_1', fullText) || data.phase2_q_1 || '',
        phase2_q_2: extractFieldFromText('phase2_q_2', fullText) || data.phase2_q_2 || '',
        phase2_q_3: extractFieldFromText('phase2_q_3', fullText) || data.phase2_q_3 || ''
      };

      console.log('[TELEGRAM-BOT] Reconstructed data from field parsing:', JSON.stringify(cleanedData, null, 2));
    } catch (error) {
      console.log('[TELEGRAM-BOT] Failed to parse field format, using original data');
    }
  }

  // Handle username field that contains embedded JSON data
  if (data.username && typeof data.username === 'string' && (data.username.includes('resume') || data.username.includes('diploma') || data.username.includes('phase2'))) {
    console.log('[TELEGRAM-BOT] Detected embedded JSON in username field, attempting to parse...');
    console.log('[TELEGRAM-BOT] Username field contains:', data.username);
    try {
      // Try to extract JSON fields from the username string
      const embeddedDataString = data.username;
      
      // Extract individual fields using regex patterns
      const extractField = (fieldName: string, str: string): string => {
        // Handle different quote variations and escaping patterns
        const patterns = [
          // Standard JSON format: "fieldname":"value"
          new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i'),
          // Escaped quotes: \"fieldname\":\"value\"
          new RegExp(`\\\\"${fieldName}\\\\"\\s*:\\s*\\\\"([^\\\\]*)\\\\"`, 'i'),
          // With extra escaping: \\\"fieldname\\\":\\\"value\\\"
          new RegExp(`\\\\\\\\"${fieldName}\\\\\\\\"\\s*:\\s*\\\\\\\\"([^\\\\]*)\\\\\\\\"`, 'i'),
          // Mixed escaping: \"fieldname\":\"value with possible content\"
          new RegExp(`\\\\"${fieldName}\\\\"\\s*:\\s*\\\\"([^\\\\]+(?:\\\\.[^\\\\]*)*)\\\\"`, 'i')
        ];
        
        for (const pattern of patterns) {
          const match = str.match(pattern);
          if (match && match[1]) {
            console.log(`[TELEGRAM-BOT] Extracted ${fieldName}: ${match[1]}`);
            return match[1];
          }
        }
        console.log(`[TELEGRAM-BOT] Failed to extract ${fieldName} from: ${str.substring(0, 200)}...`);
        return '';
      };
      
      // Extract embedded data and merge with existing cleanedData
      const extractedData = {
        username: extractField('username', embeddedDataString) || data.username,
        resume: extractField('resume', embeddedDataString),
        diploma: extractField('diploma', embeddedDataString),
        phase2_q_1: extractField('phase2_q_1', embeddedDataString),
        phase2_q_2: extractField('phase2_q_2', embeddedDataString),
        phase2_q_3: extractField('phase2_q_3', embeddedDataString)
      };
      
      // Merge extracted data with cleanedData (keeping existing basic fields)
      cleanedData = {
        ...cleanedData,
        ...extractedData
      };
      
      console.log('[TELEGRAM-BOT] Reconstructed data from malformed JSON:', JSON.stringify(cleanedData, null, 2));
    } catch (error) {
      console.log('[TELEGRAM-BOT] Failed to parse malformed JSON, using original data');
    }
  }

  console.log('[TELEGRAM-BOT] Field extraction debug:');
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