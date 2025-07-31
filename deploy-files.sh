#!/bin/bash

# Deploy Files Script - Ensures telegram files are accessible in production
echo "🚀 [DEPLOY-FILES] Deploying permanent telegram files for production access..."

# Create production directories
mkdir -p dist/public/uploads/telegram-files

# Copy all telegram files to production directory
echo "📁 [DEPLOY-FILES] Copying telegram files to production directory..."
cp -r uploads/telegram-files/* dist/public/uploads/telegram-files/ 2>/dev/null || {
    echo "⚠️  [DEPLOY-FILES] No files to copy or copy failed"
    exit 1
}

# Verify files were copied
file_count=$(ls -1 dist/public/uploads/telegram-files/ 2>/dev/null | wc -l)
echo "✅ [DEPLOY-FILES] Copied $file_count files to production directory"

# List key files
echo "📋 [DEPLOY-FILES] Key files deployed:"
ls -la dist/public/uploads/telegram-files/ | grep -E "(contact-71115|contact-71227)" || echo "No target files found"

echo "🎉 [DEPLOY-FILES] File deployment completed!"
echo "🔗 [DEPLOY-FILES] Files should now be accessible at: https://career.millatumidi.uz/uploads/telegram-files/"