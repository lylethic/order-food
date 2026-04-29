const STATUS_CONFIG: Record<string, { bg: string; text: string; pulse: boolean }> = {
  Received:  { bg: 'bg-blue-50',    text: 'text-blue-600',    pulse: false },
  Preparing: { bg: 'bg-amber-50',   text: 'text-amber-600',   pulse: true  },
  Cooking:   { bg: 'bg-orange-50',  text: 'text-orange-600',  pulse: true  },
  Ready:     { bg: 'bg-emerald-50', text: 'text-emerald-600', pulse: false },
  Delivered: { bg: 'bg-slate-100',  text: 'text-slate-500',   pulse: false },
  Cancelled: { bg: 'bg-rose-50',    text: 'text-rose-500',    pulse: false },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    pulse: false,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${cfg.pulse ? 'animate-pulse' : ''}`}
      />
      {status}
    </span>
  );
}
