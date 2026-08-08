import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-navy-soft/60 border border-white/8 flex items-center justify-center mb-4">
        <Icon size={24} className="text-white/25" />
      </div>
      <p className="text-sm font-medium text-white/40">{title}</p>
      {description && <p className="text-xs text-white/25 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
