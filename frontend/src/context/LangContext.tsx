import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Language } from '../translations';

type T = typeof translations['en'];

interface LangContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: T;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
