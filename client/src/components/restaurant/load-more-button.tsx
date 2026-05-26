import { Loader2, ChevronsDown } from 'lucide-react';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
  label?: string;
  loadingLabel?: string;
}

export default function LoadMoreButton({
  onClick,
  loading,
  label = 'Load more',
  loadingLabel = 'Loading…',
}: LoadMoreButtonProps) {
  return (
    <div className='flex justify-center pt-4'>
      <button
        onClick={onClick}
        disabled={loading}
        className='flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {loading ? (
          <Loader2 className='w-4 h-4 animate-spin' />
        ) : (
          <ChevronsDown className='w-4 h-4' />
        )}
        {loading ? loadingLabel : label}
      </button>
    </div>
  );
}
