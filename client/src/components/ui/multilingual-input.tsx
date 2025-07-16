import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalizedContent, SupportedLanguage, SUPPORTED_LANGUAGES } from "@shared/schema";

interface MultilingualInputProps {
  label: string;
  value: LocalizedContent;
  onChange: (value: LocalizedContent) => void;
  placeholder?: string;
  type?: 'input' | 'textarea';
  required?: boolean;
  className?: string;
}

const LANGUAGE_LABELS = {
  en: 'English',
  ru: 'Русский',
  uz: 'O\'zbek'
};

const LANGUAGE_FLAGS = {
  en: '🇺🇸',
  ru: '🇷🇺',
  uz: '🇺🇿'
};

export function MultilingualInput({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'input',
  required = false,
  className = ''
}: MultilingualInputProps) {
  const [activeTab, setActiveTab] = useState<SupportedLanguage>('en');

  const handleInputChange = (language: SupportedLanguage, inputValue: string) => {
    onChange({
      ...value,
      [language]: inputValue
    });
  };

  const isLanguageRequired = (language: SupportedLanguage) => {
    return required && language === 'en'; // Only English is required by default
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-700 mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SupportedLanguage)}>
        <TabsList className="grid w-full grid-cols-3 mb-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
              <span>{LANGUAGE_FLAGS[lang]}</span>
              <span className="hidden sm:inline">{LANGUAGE_LABELS[lang]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TabsContent key={lang} value={lang}>
            {type === 'textarea' ? (
              <Textarea
                value={value[lang] || ''}
                onChange={(e) => handleInputChange(lang, e.target.value)}
                placeholder={`${placeholder} (${LANGUAGE_LABELS[lang]})`}
                required={isLanguageRequired(lang)}
                rows={4}
                className="w-full"
              />
            ) : (
              <Input
                value={value[lang] || ''}
                onChange={(e) => handleInputChange(lang, e.target.value)}
                placeholder={`${placeholder} (${LANGUAGE_LABELS[lang]})`}
                required={isLanguageRequired(lang)}
                className="w-full"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'en' && required && "English is required"}
              {lang !== 'en' && "Optional - will fallback to English if empty"}
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}