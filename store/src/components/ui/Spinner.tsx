interface Props { size?: 'sm' | 'md' | 'lg'; className?: string }

export default function Spinner({ size = 'md', className = '' }: Props) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' }[size];
  return (
    <div
      className={`${s} rounded-full border-emerald-200 border-t-emerald-600 animate-spin ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
