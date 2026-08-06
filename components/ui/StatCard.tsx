import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  gold?: boolean;
}

export default function StatCard({ label, value, icon: Icon, sub, gold }: StatCardProps) {
  return (
    <div className={`stat-card glass-card p-4 sm:p-5 ${gold ? 'border-gold/35 shadow-gold' : ''}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className={`text-2xl sm:text-3xl xl:text-4xl font-display font-semibold leading-none mb-1.5 ${
            gold ? 'text-gold-gradient' : 'text-white'
          }`}>{value}</p>
          {sub && <p className="text-[10px] sm:text-xs text-white/35 font-medium truncate">{sub}</p>}
        </div>
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
          gold
            ? 'bg-gold/15 border border-gold/30 shadow-inner'
            : 'bg-white/5 border border-white/10'
        }`}>
          <Icon size={18} className={`sm:w-5 sm:h-5 ${gold ? 'text-gold' : 'text-white/60'}`} />
        </div>
      </div>
    </div>
  );
}
