/**
 * JSON Sanitizer for PuzzleBot webhook data
 * Handles cases where user input contains quotes that break JSON parsing
 */

export interface SanitizedWebhookData {
  full_name_uzbek?: string;
  phone_number_uzbek?: string;
  age_uzbek?: string;
  city_uzbek?: string;
  degree?: string;
  position_uz?: string;
  username?: string;
  resume?: string;
  diploma?: string;
  phase2_q_1?: string;
  phase2_q_2?: string;
  phase2_q_3?: string;
}

/**
 * Escape quotes and special characters in a string value
 */
function escapeJsonValue(value: any): string {
  if (typeof value !== 'string') {
    return String(value || '');
  }
  
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/'/g, "\\'")    // Escape single quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t')   // Escape tabs
    .trim();
}

/**
 * Clean and normalize field names and values from PuzzleBot
 */
function cleanFieldName(fieldName: string): string {
  return fieldName
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '') // Remove BOM and zero-width characters
    .trim();
}

function cleanFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let cleanValue = String(value);
  
  // Remove BOM and zero-width characters
  cleanValue = cleanValue.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');
  
  // Remove form variable placeholders that might leak through
  cleanValue = cleanValue.replace(/form_variable_[A-Z0-9]+/g, '');
  
  // Trim whitespace
  cleanValue = cleanValue.trim();
  
  return cleanValue;
}

/**
 * Sanitize webhook data object to prevent JSON parsing errors
 */
export function sanitizeWebhookData(rawData: any): SanitizedWebhookData {
  console.log('🧹 [JSON-SANITIZER] Starting webhook data sanitization');
  console.log('📋 [JSON-SANITIZER] Raw data type:', typeof rawData);
  console.log('📋 [JSON-SANITIZER] Raw data keys:', rawData ? Object.keys(rawData) : 'No keys');
  
  if (!rawData || typeof rawData !== 'object') {
    console.log('⚠️ [JSON-SANITIZER] Invalid raw data, returning empty object');
    return {};
  }

  const sanitizedData: SanitizedWebhookData = {};

  // Define expected field mappings
  const fieldMappings = {
    'full_name_uzbek': 'full_name_uzbek',
    'phone_number_uzbek': 'phone_number_uzbek', 
    'age_uzbek': 'age_uzbek',
    'city_uzbek': 'city_uzbek',
    'degree': 'degree',
    'position_uz': 'position_uz',
    'username': 'username',
    'resume': 'resume',
    'diploma': 'diploma',
    'phase2_q_1': 'phase2_q_1',
    'phase2_q_2': 'phase2_q_2',
    'phase2_q_3': 'phase2_q_3'
  };

  console.log('🔍 [JSON-SANITIZER] Processing fields:');

  // Process each field
  Object.keys(rawData).forEach(rawKey => {
    const cleanKey = cleanFieldName(rawKey);
    const rawValue = rawData[rawKey];
    
    console.log(`  🔧 Field "${rawKey}" (cleaned: "${cleanKey}"):`, JSON.stringify(rawValue));
    
    // Find matching field mapping
    const mappedKey = fieldMappings[cleanKey as keyof typeof fieldMappings];
    
    if (mappedKey) {
      const cleanValue = cleanFieldValue(rawValue);
      
      if (cleanValue && cleanValue !== '') {
        sanitizedData[mappedKey as keyof SanitizedWebhookData] = cleanValue;
        console.log(`    ✅ Mapped to "${mappedKey}": "${cleanValue}"`);
      } else {
        console.log(`    ⚪ Empty value, skipping field "${mappedKey}"`);
      }
    } else {
      console.log(`    ❓ Unknown field "${cleanKey}", skipping`);
    }
  });

  console.log('');
  console.log('✅ [JSON-SANITIZER] Sanitization complete');
  console.log('📊 [JSON-SANITIZER] Final sanitized data:', JSON.stringify(sanitizedData, null, 2));
  
  return sanitizedData;
}

/**
 * Attempt to parse JSON string with error recovery
 */
export function safeJsonParse(jsonString: string): any {
  console.log('🔧 [JSON-PARSER] Attempting to parse JSON string');
  console.log('📝 [JSON-PARSER] JSON length:', jsonString.length);
  
  try {
    // Try direct parsing first
    const parsed = JSON.parse(jsonString);
    console.log('✅ [JSON-PARSER] Direct JSON parsing successful');
    return parsed;
  } catch (directError: any) {
    console.log('⚠️ [JSON-PARSER] Direct parsing failed:', directError.message);
    
    try {
      // Try to fix common JSON issues
      let fixedJson = jsonString
        // Fix unescaped quotes in values
        .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix missing quotes around property names
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      const parsed = JSON.parse(fixedJson);
      console.log('✅ [JSON-PARSER] Fixed JSON parsing successful');
      return parsed;
    } catch (fixedError: any) {
      console.log('❌ [JSON-PARSER] Fixed parsing also failed:', fixedError.message);
      console.log('📋 [JSON-PARSER] Returning original string as fallback');
      return jsonString;
    }
  }
}

/**
 * Create a safe JSON response that won't break when stringified
 */
export function createSafeJsonResponse(data: any): any {
  console.log('🛡️ [JSON-SAFE-RESPONSE] Creating safe JSON response');
  
  if (!data || typeof data !== 'object') {
    return data;
  }

  const safeData: any = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (typeof value === 'string') {
      // Ensure string values are properly escaped
      safeData[key] = escapeJsonValue(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      safeData[key] = createSafeJsonResponse(value);
    } else {
      // Keep primitive values as-is
      safeData[key] = value;
    }
  });

  console.log('✅ [JSON-SAFE-RESPONSE] Safe response created');
  return safeData;
}