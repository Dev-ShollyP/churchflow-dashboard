interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs sm:text-sm text-white/50 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 flex items-center gap-3">{action}</div>}
    </div>
  );
}
