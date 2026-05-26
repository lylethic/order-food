'use client';

import { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  id: string | number;
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm: (id: string | number) => void; // Logic xóa dữ liệu
  title?: string;
  description?: string;
  trigger?: ReactNode;
}

export const DeleteConfirmModal = ({
  id,
  isOpen,
  onClose,
  onConfirm,
  title = 'Do you want to remove?',
  description = 'This action cannot undo.',
  trigger,
}: DeleteConfirmModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger asChild>
          <Button variant='destructive' size='icon'>
            <Trash2 className='h-4 w-4' />
          </Button>
        </AlertDialogTrigger>
      )}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(id)}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
