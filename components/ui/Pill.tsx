type PillVariant = 'open' | 'closed' | 'pending' | 'answered' | 'member' | 'assistant';

interface PillProps {
  label: string;
  variant: PillVariant;
}

const variants: Record<PillVariant, string> = {
  open:      'pill-open',
  closed:    'pill-closed',
  pending:   'pill-pending',
  answered:  'pill-answered',
  member:    'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  assistant: 'bg-gold/15 text-gold border border-gold/30',
};

export default function Pill({ label, variant }: PillProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${variants[variant]}`}>
      {label}
    </span>
  );
}
