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
  member:    'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  assistant: 'bg-gold/10 text-gold border border-gold/20',
};

export default function Pill({ label, variant }: PillProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
