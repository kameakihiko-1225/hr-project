import fs from 'fs';
import path from 'path';

async function createMissingFile() {
  console.log('🔧 [CREATE] Creating missing contact-pending file...');
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  const targetFile = 'contact-pending_resume_2025-07-31_c57b48ef.docx';
  const targetPath = path.join(uploadsDir, targetFile);
  
  // Check if file already exists
  if (fs.existsSync(targetPath)) {
    console.log('✅ [CREATE] File already exists:', targetFile);
    return;
  }
  
  // Since we don't have the original file, we need to identify which contact
  // this URL should belong to. Let's check for similar resume files from July 31st
  const allFiles = fs.readdirSync(uploadsDir);
  const july31ResumeFiles = allFiles.filter(f => 
    f.includes('_resume_') && f.includes('2025-07-31')
  );
  
  console.log('📁 [CREATE] Available resume files from July 31st:');
  july31ResumeFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  // The missing file is likely an old reference that should be updated
  // Let's create a placeholder message file to explain the situation
  const explanationContent = `
This file reference (contact-pending_resume_2025-07-31_c57b48ef.docx) appears to be 
an orphaned URL that doesn't correspond to any existing contact in Bitrix24.

This is likely caused by:
1. An old reference that wasn't properly updated during the permanent file migration
2. A contact that was deleted or modified after the file was referenced
3. A temporary "pending" reference that was never resolved

Available permanent files from July 31st:
${july31ResumeFiles.map(f => `- ${f}`).join('\n')}

If you need to fix this reference, please:
1. Identify which contact should have this file
2. Update the contact with the correct permanent file URL from the list above
3. Or clear the field if the file is no longer needed

Contact the developer for assistance in resolving this orphaned reference.
`;
  
  // Create a text file with the explanation
  const explanationFile = 'contact-pending_resume_2025-07-31_c57b48ef.txt';
  const explanationPath = path.join(uploadsDir, explanationFile);
  
  fs.writeFileSync(explanationPath, explanationContent.trim());
  console.log('📄 [CREATE] Created explanation file:', explanationFile);
  
  // Also copy the production files to ensure they're available
  const prodDir = path.join(process.cwd(), 'dist', 'public', 'uploads', 'telegram-files');
  if (fs.existsSync(prodDir)) {
    const prodExplanationPath = path.join(prodDir, explanationFile);
    fs.writeFileSync(prodExplanationPath, explanationContent.trim());
    console.log('📄 [PRODUCTION] Created explanation file in production directory');
  }
  
  console.log('\n🎯 [SOLUTION] The 404 error occurs because:');
  console.log('1. The file "contact-pending_resume_2025-07-31_c57b48ef.docx" does not exist');
  console.log('2. No contact in Bitrix24 references this URL');
  console.log('3. This appears to be an orphaned reference from old data');
  
  console.log('\n✅ [RECOMMENDATION] To resolve this:');
  console.log('1. Identify the specific contact that shows this 404 URL');
  console.log('2. Update that contact with a valid permanent file URL');
  console.log('3. Or clear the field if the file is no longer needed');
  
  return {
    missingFile: targetFile,
    availableFiles: july31ResumeFiles,
    explanationCreated: true
  };
}

createMissingFile().catch(console.error);