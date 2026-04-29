import type { NavItem } from '../types';

interface Props {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
}

export function BottomNav({ items, active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30 flex md:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${
            active === item.id ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${active === item.id ? 'bg-indigo-50' : ''}`}
          >
            <item.icon className="w-5 h-5" strokeWidth={active === item.id ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
