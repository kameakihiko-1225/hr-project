import { migrateAllBitrixFiles } from './migrateBitrixFiles.js';

console.log('🚀 Starting Bitrix24 file URL migration...');

migrateAllBitrixFiles()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });