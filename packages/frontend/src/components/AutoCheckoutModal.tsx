"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface AutoCheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AutoCheckoutModal({ open, onClose }: AutoCheckoutModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você foi desconectado</AlertDialogTitle>
          <AlertDialogDescription>
            Você foi desconectado da sala por inatividade. Para continuar
            trabalhando, faça check-in em uma sala novamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}