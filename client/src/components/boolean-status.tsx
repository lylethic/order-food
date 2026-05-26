import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BooleanStatusProps {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
  className?: string;
  trueColor?: string;
  falseColor?: string;
}

export const BooleanStatus = ({
  value,
  trueLabel = '',
  falseLabel = '',
  className,
  trueColor,
  falseColor,
}: BooleanStatusProps) => {
  const defaultTrue = 'border-green-200 bg-green-50 text-green-700';
  const defaultFalse = 'border-border bg-muted/50 text-muted-foreground';

  return (
    <Button
      variant='outline'
      size='sm'
      className={cn(
        'flex items-center justify-center h-8 gap-2 px-3 font-medium pointer-events-none transition-all w-fit',
        value ? trueColor || defaultTrue : falseColor || defaultFalse,
        className,
      )}
    >
      {value ? (
        <CheckCircle2 className='h-4 w-4 shrink-0' />
      ) : (
        <XCircle className='h-4 w-4 shrink-0' />
      )}
      {(trueLabel || falseLabel) && (
        <span className='leading-none'>{value ? trueLabel : falseLabel}</span>
      )}
    </Button>
  );
};
