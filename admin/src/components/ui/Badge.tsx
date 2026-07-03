const variants: Record<string, string> = {
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  danger: 'bg-red-900/50 text-red-400 border border-red-800',
  warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  info: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  default: 'bg-gray-800 text-gray-300 border border-gray-700',
};

export function Badge({ label, variant = 'default' }: { label: string; variant?: keyof typeof variants }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant] ?? variants.default}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, keyof typeof variants> = {
    PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info',
    PACKED: 'info', SHIPPED: 'info', OUT_FOR_DELIVERY: 'info',
    DELIVERED: 'success', CANCELLED: 'danger', REFUNDED: 'danger',
    PAID: 'success', UNPAID: 'warning', FAILED: 'danger',
    APPROVED: 'success', REJECTED: 'danger', ACTIVE: 'success',
    INACTIVE: 'default', true: 'success', false: 'danger',
  };
  return <Badge label={status.replace(/_/g, ' ')} variant={map[status] ?? 'default'} />;
}
