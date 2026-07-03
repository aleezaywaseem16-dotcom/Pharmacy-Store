import { Star } from 'lucide-react';

interface Props {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, count, size = 'sm', interactive, onChange }: Props) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            <Star
              className={`${s} ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-200'}`}
            />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-slate-500 text-xs">({count})</span>
      )}
    </div>
  );
}
