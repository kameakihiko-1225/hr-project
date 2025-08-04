import { sanitizeWebhookData, createSafeJsonResponse } from '../utils/jsonSanitizer.js';

async function testFixedWorkflow() {
  console.log('🧪 [TEST] Testing fixed JSON sanitization workflow');
  console.log('='.repeat(80));
  
  // Test case 1: Data with quotes in user responses (the problem case)
  const problematicData = {
    "full_name_uzbek": "Millat Umidi Teacher",
    "phone_number_uzbek": "998901234567",
    "age_uzbek": "25",
    "city_uzbek": "Tashkent \"City\"",
    "degree": "Master's \"Computer Science\"",
    "position_uz": "Academic Registrar",
    "resume": "form_variable_F3SCIRAJM2FXY0G8",
    "diploma": "form_variable_H0QIXSYDHQ07ECTK",
    "phase2_q_1": "I work at \"Millat Umidi\" school",
    "phase2_q_2": "My experience includes \"teaching\" and \"administration\"",
    "phase2_q_3": "I believe \"quality education\" is important"
  };
  
  console.log('📋 [TEST] Test Case 1: Data with quotes');
  console.log('Input:', JSON.stringify(problematicData, null, 2));
  
  try {
    const sanitized = sanitizeWebhookData(problematicData);
    console.log('✅ [TEST] Sanitization successful');
    console.log('Output:', JSON.stringify(sanitized, null, 2));
    
    const safeResponse = createSafeJsonResponse(sanitized);
    console.log('✅ [TEST] Safe response creation successful');
    console.log('Safe Response:', JSON.stringify(safeResponse, null, 2));
    
  } catch (error: any) {
    console.log('❌ [TEST] Test case 1 failed:', error.message);
  }
  
  console.log('');
  console.log('-'.repeat(80));
  
  // Test case 2: Data with BOM characters and form variables
  const bomData = {
    "﻿full_name_uzbek": "﻿John Doe﻿",
    "phone_number_uzbek": "﻿form_variable_OM1LIKX3F90H7W7G﻿",
    "age_uzbek": "﻿form_variable_I7AF57HF21MUHB1W﻿",
    "city_uzbek": "form_variable_3JHCZSBEQ1HVE225﻿",
    "degree": "﻿form_variable_NTSK1G6JI2JT7GAV﻿",
    "position_uz": "Academic Registrar",
    "resume": "﻿form_variable_F3SCIRAJM2FXY0G8﻿",
    "diploma": "﻿form_variable_H0QIXSYDHQ07ECTK﻿"
  };
  
  console.log('📋 [TEST] Test Case 2: Data with BOM and form variables');
  console.log('Input keys:', Object.keys(bomData));
  
  try {
    const sanitized = sanitizeWebhookData(bomData);
    console.log('✅ [TEST] BOM sanitization successful');
    console.log('Output:', JSON.stringify(sanitized, null, 2));
    
  } catch (error: any) {
    console.log('❌ [TEST] Test case 2 failed:', error.message);
  }
  
  console.log('');
  console.log('-'.repeat(80));
  
  // Test case 3: Valid data without issues
  const validData = {
    "full_name_uzbek": "Alice Johnson",
    "phone_number_uzbek": "998901234567",
    "age_uzbek": "30",
    "city_uzbek": "Tashkent",
    "degree": "Bachelor of Education",
    "position_uz": "IELTS teacher",
    "resume": "BAADBAADAgADBREAAWGdOVmY1vN5Ag",
    "diploma": "BAADBAADAwADBREAAWGdOVmY1vN6Ag"
  };
  
  console.log('📋 [TEST] Test Case 3: Valid data');
  try {
    const sanitized = sanitizeWebhookData(validData);
    console.log('✅ [TEST] Valid data processing successful');
    console.log('Output:', JSON.stringify(sanitized, null, 2));
    
  } catch (error: any) {
    console.log('❌ [TEST] Test case 3 failed:', error.message);
  }
  
  console.log('');
  console.log('-'.repeat(80));
  
  // Test case 4: Simulate JSON string parsing
  const jsonString = `{
    "full_name_uzbek": "Teacher from "Millat Umidi" school",
    "position_uz": "Academic Registrar",
    "city_uzbek": "Tashkent "Central" district"
  }`;
  
  console.log('📋 [TEST] Test Case 4: Broken JSON string parsing');
  console.log('Broken JSON:', jsonString);
  
  try {
    const { safeJsonParse } = await import('../utils/jsonSanitizer.js');
    const parsed = safeJsonParse(jsonString);
    console.log('✅ [TEST] JSON parsing with error recovery successful');
    console.log('Parsed result:', JSON.stringify(parsed, null, 2));
    
  } catch (error: any) {
    console.log('❌ [TEST] Test case 4 failed:', error.message);
  }
  
  console.log('');
  console.log('🎉 [TEST] All test cases completed');
  console.log('='.repeat(80));
}

testFixedWorkflow();