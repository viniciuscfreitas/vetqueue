"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { userApi } from "@/lib/api";
import { useToast } from "./ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InactivityWarningModalProps {
  open: boolean;
  minutesRemaining: number;
  onClose: () => void;
}

export function InactivityWarningModal({
  open,
  minutesRemaining,
  onClose,
}: InactivityWarningModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(minutesRemaining);

  const keepAliveMutation = useMutation({
    mutationFn: () => userApi.keepAlive().then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Timer resetado",
        description: "Você continuará trabalhando",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível resetar o timer",
      });
    },
  });

  useEffect(() => {
    setCountdown(minutesRemaining);
  }, [minutesRemaining]);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 60000);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você será desconectado</AlertDialogTitle>
          <AlertDialogDescription>
            Você será desconectado da sala em{" "}
            <strong className="text-lg">{countdown} minutos</strong> por inatividade.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Continuar Inativo
          </Button>
          <Button
            onClick={() => keepAliveMutation.mutate()}
            disabled={keepAliveMutation.isPending}
            className="w-full sm:w-auto"
          >
            {keepAliveMutation.isPending ? "Processando..." : "Continuar Trabalhando"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

