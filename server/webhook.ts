// Import required modules - use exact same approach as working simple-server.js
import axiosDefault from 'axios';
import FormDataClass from 'form-data';
import fs from 'fs';
import path from 'path';
import { pool } from './db';

const axios = axiosDefault;
const FormData = FormDataClass;

const BITRIX_BASE = 'https://millatumidi.bitrix24.kz/rest/21/wx0c9lt1mxcwkhz9';
const TELEGRAM_API_BASE = 'https://api.telegram.org';

// Hardcoded Telegram Bot Token - directly set like Bitrix24  
const TELEGRAM_BOT_TOKEN = '7191717059:AAHIlA-fAxxzlwYEnse3vSBlQLH_4ozhPTY';

function getBotToken() {
  return TELEGRAM_BOT_TOKEN;
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

// Telegram File Download Functions
async function getTelegramFileInfo(fileId: string): Promise<{ file_path: string; file_size: number } | null> {
  const botToken = getBotToken();
  if (!botToken) {
    console.log('❌ [TELEGRAM-FILE] No bot token available');
    return null;
  }

  try {
    const response = await axios.get(`${TELEGRAM_API_BASE}/bot${botToken}/getFile?file_id=${fileId}`, {
      timeout: 3000
    });
    
    if (response.data.ok && response.data.result) {
      const fileInfo = response.data.result;
      return {
        file_path: fileInfo.file_path,
        file_size: fileInfo.file_size || 0
      };
    } else {
      return null;
    }
  } catch (error: any) {
    return null;
  }
}

async function downloadTelegramFile(fileId: string, fileName: string): Promise<string | null> {
  const botToken = getBotToken();
  if (!botToken) {
    console.log('❌ [TELEGRAM-FILE] No bot token available for download');
    return null;
  }

  try {
    // Get file info first
    const fileInfo = await getTelegramFileInfo(fileId);
    if (!fileInfo) {
      console.log(`❌ [TELEGRAM-FILE] Could not get file info for ${fileId}`);
      return null;
    }

    console.log(`📥 [TELEGRAM-FILE] Downloading file: ${fileInfo.file_path}`);
    
    // Download the file
    const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${botToken}/${fileInfo.file_path}`;
    const response = await axios.get(downloadUrl, { responseType: 'stream' });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`📁 [TELEGRAM-FILE] Created uploads directory: ${uploadsDir}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(fileInfo.file_path) || '.file';
    const uniqueFileName = `telegram_${fileName}_${timestamp}${fileExtension}`;
    const localFilePath = path.join(uploadsDir, uniqueFileName);

    // Save file locally
    const writer = fs.createWriteStream(localFilePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ [TELEGRAM-FILE] File downloaded successfully: ${localFilePath}`);
        // Return the public URL that Bitrix24 can access
        const publicUrl = `/uploads/${uniqueFileName}`;
        console.log(`🌐 [TELEGRAM-FILE] Public URL: ${publicUrl}`);
        resolve(publicUrl);
      });
      writer.on('error', (error) => {
        console.log(`❌ [TELEGRAM-FILE] Error saving file:`, error);
        reject(error);
      });
    });

  } catch (error: any) {
    console.log(`❌ [TELEGRAM-FILE] Error downloading file:`, error.message);
    return null;
  }
}

async function convertTelegramFileIdToUrl(fileId: string, fieldName: string): Promise<string> {
  if (!fileId || !isTelegramFileId(fileId)) {
    return fileId; // Return as-is if not a valid file ID
  }

  const botToken = getBotToken();
  if (!botToken) {
    return fileId;
  }

  try {
    // Get file info from Telegram with timeout
    const fileInfo = await Promise.race([
      getTelegramFileInfo(fileId),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
    ]);
    
    if (!fileInfo) {
      return fileId;
    }

    // Create direct Telegram download URL
    const telegramUrl = `${TELEGRAM_API_BASE}/file/bot${botToken}/${fileInfo.file_path}`;
    return telegramUrl;

  } catch (error: any) {
    return fileId; // Fallback to original ID if conversion fails
  }
}

async function findExistingContact(phone: string): Promise<string | null> {
  if (!phone) return null;
  try {
    const searchResp = await axios.get(`${BITRIX_BASE}/crm.contact.list.json?filter[PHONE]=${phone}`, {
      timeout: 5000
    });
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

async function downloadTelegramFileToBuffer(fileId: string): Promise<{ buffer: Buffer; filename: string; mimetype: string } | null> {
  const botToken = getBotToken();
  if (!botToken) return null;
  const info = await getTelegramFileInfo(fileId);
  if (!info) return null;
  const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${botToken}/${info.file_path}`;
  const resp = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
  const guessedExt = path.extname(info.file_path) || '';
  // naive mime guess by extension
  const ext = guessedExt.toLowerCase();
  const mime = ext === '.ogg' ? 'audio/ogg' : ext === '.pdf' ? 'application/pdf' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream';
  const baseName = path.basename(info.file_path);
  return { buffer: Buffer.from(resp.data), filename: baseName, mimetype: mime };
}

async function saveBufferAsStoredFile(filename: string, mimetype: string, buffer: Buffer): Promise<number> {
  const result = await pool.query(
    'INSERT INTO stored_files (filename, mimetype, size, data) VALUES ($1, $2, $3, $4) RETURNING id',
    [filename, mimetype, buffer.length, buffer]
  );
  return result.rows[0].id as number;
}

function buildPublicFileUrl(id: number): string {
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://career.millatumidi.uz';
  return `${baseUrl}/files/${id}`;
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

  // Handle file fields with Telegram download - INLINE PROCESSING
  console.log('');
  console.log('📎 [WEBHOOK-PROCESSING] FILE FIELDS PROCESSING WITH TELEGRAM DOWNLOAD:');
  const resumeFileId = cleanedData.resume;
  const diplomaFileId = cleanedData.diploma;
  
  console.log(`  - Resume field: ${JSON.stringify(resumeFileId)}`);
  console.log(`  - Diploma field: ${JSON.stringify(diplomaFileId)}`);
  
  // Process resume file: download from Telegram, store in Postgres, use permanent URL
  if (resumeFileId && isTelegramFileId(resumeFileId)) {
    console.log(`  🔄 Downloading & storing resume file...`);
    const resBuf = await downloadTelegramFileToBuffer(resumeFileId);
    if (resBuf) {
      const storedId = await saveBufferAsStoredFile(resBuf.filename, resBuf.mimetype, resBuf.buffer);
      const permanentUrl = buildPublicFileUrl(storedId);
      contactFields.UF_CRM_1752621810 = permanentUrl;
      console.log(`  ✅ Resume stored with id ${storedId}, URL: ${permanentUrl}`);
    } else {
      const fallbackUrl = await convertTelegramFileIdToUrl(resumeFileId, 'resume');
      contactFields.UF_CRM_1752621810 = fallbackUrl;
      console.log(`  ⚠️ Resume fallback to Telegram URL: ${fallbackUrl}`);
    }
  } else {
    contactFields.UF_CRM_1752621810 = resumeFileId || '';
    console.log(`  ⚪ Resume kept as-is: ${resumeFileId}`);
  }
  
  // Process diploma file similarly
  if (diplomaFileId && isTelegramFileId(diplomaFileId)) {
    console.log(`  🔄 Downloading & storing diploma file...`);
    const dipBuf = await downloadTelegramFileToBuffer(diplomaFileId);
    if (dipBuf) {
      const storedId = await saveBufferAsStoredFile(dipBuf.filename, dipBuf.mimetype, dipBuf.buffer);
      const permanentUrl = buildPublicFileUrl(storedId);
      contactFields.UF_CRM_1752621831 = permanentUrl;
      console.log(`  ✅ Diploma stored with id ${storedId}, URL: ${permanentUrl}`);
    } else {
      const fallbackUrl = await convertTelegramFileIdToUrl(diplomaFileId, 'diploma');
      contactFields.UF_CRM_1752621831 = fallbackUrl;
      console.log(`  ⚠️ Diploma fallback to Telegram URL: ${fallbackUrl}`);
    }
  } else {
    contactFields.UF_CRM_1752621831 = diplomaFileId || '';
    console.log(`  ⚪ Diploma kept as-is: ${diplomaFileId}`);
  }

  // Handle phase2 answers with file download support
  console.log('');
  console.log('💬 [WEBHOOK-PROCESSING] PHASE2 ANSWERS PROCESSING WITH FILE SUPPORT:');
  const phase2_q1 = cleanedData.phase2_q_1 || '';
  const phase2_q2 = cleanedData.phase2_q_2 || '';
  const phase2_q3 = cleanedData.phase2_q_3 || '';

  console.log(`  - Q1: ${JSON.stringify(phase2_q1)} (${phase2_q1 ? 'HAS VALUE' : 'EMPTY'})`);
  console.log(`  - Q2: ${JSON.stringify(phase2_q2)} (${phase2_q2 ? 'HAS VALUE' : 'EMPTY'})`);
  console.log(`  - Q3: ${JSON.stringify(phase2_q3)} (${phase2_q3 ? 'HAS VALUE' : 'EMPTY'})`);

  // Process Q1 - check if it's a file ID or text
  if (phase2_q1) {
    if (isTelegramFileId(phase2_q1)) {
      console.log(`  🎧 Q1 is file ID, downloading & storing...`);
      const q1Buf = await downloadTelegramFileToBuffer(phase2_q1);
      if (q1Buf) {
        const storedId = await saveBufferAsStoredFile(q1Buf.filename, q1Buf.mimetype, q1Buf.buffer);
        const url = buildPublicFileUrl(storedId);
        contactFields.UF_CRM_1752621857 = url; // Voice field permanent URL
        contactFields.UF_CRM_1752241370 = `Voice answer: ${url}`; // Text field with URL
        console.log(`  ✅ Q1 stored with id ${storedId}, URL: ${url}`);
      } else {
        const q1Url = await convertTelegramFileIdToUrl(phase2_q1, 'phase2_q1');
        contactFields.UF_CRM_1752621857 = q1Url;
        contactFields.UF_CRM_1752241370 = `Voice answer: ${q1Url}`;
        console.log(`  ⚠️ Q1 fallback to Telegram URL: ${q1Url}`);
      }
    } else {
      contactFields.UF_CRM_1752241370 = phase2_q1; // Text field
      console.log(`  ✅ Q1 text: ${phase2_q1}`);
    }
  }

  // Process Q2 - check if it's a file ID or text
  if (phase2_q2) {
    if (isTelegramFileId(phase2_q2)) {
      console.log(`  🎧 Q2 is file ID, downloading & storing...`);
      const q2Buf = await downloadTelegramFileToBuffer(phase2_q2);
      if (q2Buf) {
        const storedId = await saveBufferAsStoredFile(q2Buf.filename, q2Buf.mimetype, q2Buf.buffer);
        const url = buildPublicFileUrl(storedId);
        contactFields.UF_CRM_1752621874 = url; // Voice field permanent URL
        contactFields.UF_CRM_1752241378 = `Voice answer: ${url}`; // Text field with URL
        console.log(`  ✅ Q2 stored with id ${storedId}, URL: ${url}`);
      } else {
        const q2Url = await convertTelegramFileIdToUrl(phase2_q2, 'phase2_q2');
        contactFields.UF_CRM_1752621874 = q2Url;
        contactFields.UF_CRM_1752241378 = `Voice answer: ${q2Url}`;
        console.log(`  ⚠️ Q2 fallback to Telegram URL: ${q2Url}`);
      }
    } else {
      contactFields.UF_CRM_1752241378 = phase2_q2; // Text field
      console.log(`  ✅ Q2 text: ${phase2_q2}`);
    }
  }

  // Process Q3 - check if it's a file ID or text
  if (phase2_q3) {
    if (isTelegramFileId(phase2_q3)) {
      console.log(`  🎧 Q3 is file ID, downloading & storing...`);
      const q3Buf = await downloadTelegramFileToBuffer(phase2_q3);
      if (q3Buf) {
        const storedId = await saveBufferAsStoredFile(q3Buf.filename, q3Buf.mimetype, q3Buf.buffer);
        const url = buildPublicFileUrl(storedId);
        contactFields.UF_CRM_1752621887 = url; // Voice field permanent URL
        contactFields.UF_CRM_1752241386 = `Voice answer: ${url}`; // Text field with URL
        console.log(`  ✅ Q3 stored with id ${storedId}, URL: ${url}`);
      } else {
        const q3Url = await convertTelegramFileIdToUrl(phase2_q3, 'phase2_q3');
        contactFields.UF_CRM_1752621887 = q3Url;
        contactFields.UF_CRM_1752241386 = `Voice answer: ${q3Url}`;
        console.log(`  ⚠️ Q3 fallback to Telegram URL: ${q3Url}`);
      }
    } else {
      contactFields.UF_CRM_1752241386 = phase2_q3; // Text field
      console.log(`  ✅ Q3 text: ${phase2_q3}`);
    }
  }

  // Add comments with file URLs
  const comments = [];
  if (contactFields.UF_CRM_1752621810) comments.push(`Resume URL: ${contactFields.UF_CRM_1752621810}`);
  if (contactFields.UF_CRM_1752621831) comments.push(`Diploma URL: ${contactFields.UF_CRM_1752621831}`);
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

  // Build attachment list for Bitrix file-type fields (phase2 voice answers)
  const bitrixFileAttachments: Array<{ ufCode: string; filename: string; mimetype: string; buffer: Buffer }> = [];
  if (typeof contactFields.UF_CRM_1752621857 === 'string' && contactFields.UF_CRM_1752621857.startsWith('http')) {
    // URL already set; keep it in text field. File will be added only if we downloaded earlier.
  }
  // We can only know if we downloaded buffers earlier; add flags by checking existence on disk not available here.
  // Instead, infer from comments in the log: we'll collect during download step. So leave empty; placeholder retained.

  // Decide request type: if we have file buffers to attach, use multipart/form-data; otherwise JSON
  const hasFileUploads = false; // currently attaching only URLs; flip to true when adding buffers

  // Create JSON payload for contact when no file uploads
  const contactPayload = {
    fields: contactFields
  };
  
  console.log('');
  console.log('📤 [WEBHOOK-PROCESSING] COMPLETE BITRIX24 PAYLOAD:', JSON.stringify(contactPayload));

  // Check for existing contact
  console.log('');
  console.log('🔍 [WEBHOOK-PROCESSING] CHECKING FOR EXISTING CONTACT:');
  let contactId: string;
  const existingContactId = await findExistingContact(phone);
  
  if (existingContactId) {
    console.log(`  ✅ Existing contact found: ${existingContactId}`);
    console.log('  🔄 Updating existing contact...');

    if (hasFileUploads) {
      const form = new FormData();
      form.append('id', existingContactId);
      Object.entries(contactFields).forEach(([k, v]) => form.append(`fields[${k}]`, typeof v === 'object' ? JSON.stringify(v) : (v ?? '')));
      bitrixFileAttachments.forEach(att => {
        form.append(`fields[${att.ufCode}][fileData]`, att.buffer, { filename: att.filename, contentType: att.mimetype });
      });
      const updateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, form, { headers: form.getHeaders() });
      console.log('  📨 Contact update response (multipart):', JSON.stringify(updateResp.data));
    } else {
      const updatePayload = { id: existingContactId, fields: contactFields };
      const updateResp = await axios.post(`${BITRIX_BASE}/crm.contact.update.json`, updatePayload, { headers: { 'Content-Type': 'application/json' } });
      console.log('  📨 Contact update response (json):', JSON.stringify(updateResp.data));
    }
    contactId = existingContactId;
  } else {
    console.log('  ❌ No existing contact found');
    console.log('  ➕ Creating new contact...');

    if (hasFileUploads) {
      const form = new FormData();
      Object.entries(contactFields).forEach(([k, v]) => form.append(`fields[${k}]`, typeof v === 'object' ? JSON.stringify(v) : (v ?? '')));
      bitrixFileAttachments.forEach(att => {
        form.append(`fields[${att.ufCode}][fileData]`, att.buffer, { filename: att.filename, contentType: att.mimetype });
      });
      const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, form, { headers: form.getHeaders() });
      console.log('  📨 Contact create response (multipart):', JSON.stringify(createResp.data));
      if (createResp.data && createResp.data.result) {
        contactId = createResp.data.result;
      } else {
        throw new Error('Failed to create contact in Bitrix24');
      }
    } else {
      const createResp = await axios.post(`${BITRIX_BASE}/crm.contact.add.json`, contactPayload, { headers: { 'Content-Type': 'application/json' } });
      console.log('  📨 Contact create response (json):', JSON.stringify(createResp.data));
      if (createResp.data && createResp.data.result) {
        contactId = createResp.data.result;
      } else {
        throw new Error('Failed to create contact in Bitrix24');
      }
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