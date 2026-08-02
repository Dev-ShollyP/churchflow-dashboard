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
    <div className={`stat-card glass-card p-5 ${gold ? 'border-gold/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-3xl font-display font-semibold leading-none mb-1 ${
            gold ? 'text-gold-gradient' : 'text-white'
          }`}>{value}</p>
          {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          gold
            ? 'bg-gold/15 border border-gold/25'
            : 'bg-navy-soft/80 border border-white/8'
        }`}>
          <Icon size={18} className={gold ? 'text-gold' : 'text-white/50'} />
        </div>
      </div>
    </div>
  );
}
