import { LocalizedContent, SupportedLanguage, getLocalizedContent } from './schema';

/**
 * Creates localized content from form data
 * Supports both multi-language objects and single-language strings
 */
export function createLocalizedContent(
  data: Record<string, any>,
  fieldName: string,
  defaultLanguage: SupportedLanguage = 'en'
): LocalizedContent {
  const result: LocalizedContent = {};
  
  // Check if we have language-specific fields (e.g., title_en, title_ru, title_uz)
  const hasMultiLang = ['en', 'ru', 'uz'].some(lang => 
    data[`${fieldName}_${lang}`] !== undefined
  );
  
  if (hasMultiLang) {
    // Multi-language form data
    if (data[`${fieldName}_en`]) result.en = data[`${fieldName}_en`];
    if (data[`${fieldName}_ru`]) result.ru = data[`${fieldName}_ru`];
    if (data[`${fieldName}_uz`]) result.uz = data[`${fieldName}_uz`];
  } else if (data[fieldName]) {
    // Single field - store in default language
    result[defaultLanguage] = data[fieldName];
  }
  
  return result;
}

/**
 * Converts localized content to form data for editing
 */
export function localizedContentToFormData(
  content: LocalizedContent | string | null,
  fieldName: string
): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!content) return result;
  
  if (typeof content === 'string') {
    result[fieldName] = content;
    return result;
  }
  
  if (content.en) result[`${fieldName}_en`] = content.en;
  if (content.ru) result[`${fieldName}_ru`] = content.ru;
  if (content.uz) result[`${fieldName}_uz`] = content.uz;
  
  return result;
}

/**
 * Validates that at least one language is provided
 */
export function validateLocalizedContent(content: LocalizedContent): boolean {
  return !!(content.en || content.ru || content.uz);
}

/**
 * Merges existing localized content with updates
 */
export function mergeLocalizedContent(
  existing: LocalizedContent | null,
  updates: LocalizedContent
): LocalizedContent {
  const result: LocalizedContent = {};
  
  if (existing) {
    if (existing.en) result.en = existing.en;
    if (existing.ru) result.ru = existing.ru;
    if (existing.uz) result.uz = existing.uz;
  }
  
  // Apply updates
  if (updates.en !== undefined) result.en = updates.en;
  if (updates.ru !== undefined) result.ru = updates.ru;
  if (updates.uz !== undefined) result.uz = updates.uz;
  
  return result;
}

/**
 * Creates fallback content when a specific language is missing
 */
export function getLocalizedContentWithFallback(
  content: LocalizedContent | string | null,
  language: SupportedLanguage,
  fallbackChain: SupportedLanguage[] = ['en', 'ru', 'uz']
): string {
  return getLocalizedContent(content, language);
}

/**
 * Converts database data to display format for a specific language
 */
export function localizeEntity<T extends Record<string, any>>(
  entity: T,
  language: SupportedLanguage,
  localizedFields: (keyof T)[]
): T & Record<string, string> {
  const result = { ...entity };
  
  localizedFields.forEach(field => {
    const content = entity[field];
    if (content) {
      // Create both the localized version and keep the original
      (result as any)[`${String(field)}_localized`] = getLocalizedContent(content, language);
    }
  });
  
  return result as T & Record<string, string>;
}

/**
 * Helper to get all available languages from localized content
 */
export function getAvailableLanguages(content: LocalizedContent): SupportedLanguage[] {
  const languages: SupportedLanguage[] = [];
  if (content.en) languages.push('en');
  if (content.ru) languages.push('ru');
  if (content.uz) languages.push('uz');
  return languages;
}