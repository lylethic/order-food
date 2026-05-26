import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Shadcn utility

interface StatusProps {
  status: 'success' | 'failure' | 'pending';
  label?: string;
  onClick?: () => void;
}

export const StatusAction = ({ status, label, onClick }: StatusProps) => {
  const configs = {
    success: {
      icon: <CheckCircle2 className='h-4 w-4' />,
      styles: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
      defaultLabel: 'Completed',
    },
    failure: {
      icon: <XCircle className='h-4 w-4' />,
      styles: 'border-border text-muted-foreground hover:bg-accent',
      defaultLabel: 'Failed',
    },
    pending: {
      icon: <AlertCircle className='h-4 w-4' />,
      styles:
        'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
      defaultLabel: 'Pending',
    },
  };

  const current = configs[status];

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onClick}
      className={cn(
        'h-8 gap-2 px-3 font-medium transition-colors',
        current.styles,
      )}
    >
      {current.icon}
      <span>{label || current.defaultLabel}</span>
    </Button>
  );
};
