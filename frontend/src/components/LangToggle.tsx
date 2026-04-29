import { useLang } from '../context/LangContext';
import type { Language } from '../translations';

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
      {(['en', 'vi'] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
            lang === l
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
