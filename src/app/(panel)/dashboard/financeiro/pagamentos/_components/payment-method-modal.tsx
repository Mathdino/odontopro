"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Banknote, Smartphone, Building } from "lucide-react";
import { markAppointmentAsPaid } from "../_actions/payment-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentIds: string[];
  onSuccess: () => void;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  appointmentIds,
  onSuccess,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const paymentMethods = [
    { value: "CASH", label: "Dinheiro", icon: Banknote },
    { value: "PIX", label: "PIX", icon: Smartphone },
    { value: "CREDIT_CARD", label: "Cartão de Crédito", icon: CreditCard },
    { value: "DEBIT_CARD", label: "Cartão de Débito", icon: CreditCard },
    { value: "BANK_TRANSFER", label: "Transferência Bancária", icon: Building },
  ];

  const handleConfirmPayment = async () => {
    if (!selectedMethod || !appointmentIds || appointmentIds.length === 0) return;

    setIsLoading(true);
    try {
      // Process all appointments in parallel
      const promises = appointmentIds.map(appointmentId => 
        markAppointmentAsPaid({
          appointmentId,
          paymentMethod: selectedMethod as any,
        })
      );
      
      const results = await Promise.all(promises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        const errorMessages = results
          .filter(result => result.error)
          .map(result => result.error)
          .join(", ");
        toast.error(`Erro em alguns pagamentos: ${errorMessages}`);
      } else {
        toast.success(`${appointmentIds.length} pagamento(s) registrado(s) com sucesso! Redirecionando para o dashboard...`);
        onSuccess();
        setSelectedMethod("");
        
        // Redirect to financial dashboard to see updated metrics
        setTimeout(() => {
          router.push('/dashboard/financeiro');
        }, 1500); // Delay to show the success message
      }
    } catch (error) {
      toast.error("Erro ao registrar pagamentos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMethod("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar Pagamento {appointmentIds && appointmentIds.length > 1 ? `(${appointmentIds.length} serviços)` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Método de Pagamento</label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecione o método de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{method.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedMethod || isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}