import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';
import { Button } from './button';

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
  },
  {
    code: 'ru',
    name: 'Русский',
  },
  {
    code: 'uz',
    name: "O'zbekcha",
  },
];

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors ${className || ''}`}
          aria-label="Select language"
        >
          <span className="font-semibold uppercase tracking-wide text-sm">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] bg-white border border-[#e5e7eb] shadow-lg rounded-md">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
              i18n.language === lang.code
                ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
            }`}
            aria-current={i18n.language === lang.code ? 'true' : undefined}
          >
            <span className="uppercase text-xs font-medium w-8 text-center">{lang.code}</span>
            <span className="ml-2 flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <Check className="ml-auto h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 