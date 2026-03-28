import { Language } from '../lib/i18n';

interface LanguageSelectorProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

export function LanguageSelector({ currentLang, onLangChange }: LanguageSelectorProps) {
  const flags = {
    en: { icon: '🇺🇸', label: 'EN' },
    fr: { icon: '🇫🇷', label: 'FR' },
    vi: { icon: '🇻🇳', label: 'VI' }
  };

  const languages: Language[] = ['en', 'fr', 'vi'];

  return (
    <div className="flex gap-1.5 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onLangChange(lang)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all
            ${currentLang === lang 
              ? 'bg-white text-amber-600 shadow-sm scale-105' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/30'
            }
          `}
        >
          <span className="text-sm">{flags[lang].icon}</span>
          <span>{flags[lang].label}</span>
        </button>
      ))}
    </div>
  );
}