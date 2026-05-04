'use client';

import { useAppContext } from '@/app/app-provider';
import type { Language } from '@/lib/translations';

export default function LangToggle() {
  const { lang, setLang } = useAppContext();
  return (
    <div className='flex items-center bg-muted rounded-lg p-0.5'>
      {(['en', 'vi'] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
            lang === l
              ? 'text-indigo-600 shadow-sm'
              : 'text-muted-foreground hover:text-muted-foreground'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
