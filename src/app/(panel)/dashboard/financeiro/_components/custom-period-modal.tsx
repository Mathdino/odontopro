"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

interface CustomPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: { from: Date | undefined; to: Date | undefined }) => void;
  initialRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export function CustomPeriodModal({
  isOpen,
  onClose,
  onApply,
  initialRange,
}: CustomPeriodModalProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(initialRange);
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);

  const handleApply = () => {
    if (dateRange.from && dateRange.to) {
      onApply(dateRange);
    }
  };

  const handleCancel = () => {
    setDateRange(initialRange);
    onClose();
  };

  const isValidRange =
    dateRange.from && dateRange.to && dateRange.from <= dateRange.to;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Período</DialogTitle>
          <DialogDescription>
            Selecione o período personalizado para visualizar os dados
            financeiros.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Input Data Inicial */}
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover
                open={fromCalendarOpen}
                onOpenChange={setFromCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      format(dateRange.from, "dd/MM/yyyy")
                    ) : (
                      <span className="text-muted-foreground">
                        Selecionar data
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => {
                      setDateRange((prev) => ({ ...prev, from: date }));
                      setFromCalendarOpen(false);
                    }}
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Input Data Final */}
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? (
                      format(dateRange.to, "dd/MM/yyyy")
                    ) : (
                      <span className="text-muted-foreground">
                        Selecionar data
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => {
                      setDateRange((prev) => ({ ...prev, to: date }));
                      setToCalendarOpen(false);
                    }}
                    locale={ptBR}
                    disabled={(date) => {
                      const today = new Date();
                      const fromDate = dateRange.from;
                      if (date > today) return true;
                      if (fromDate && date < fromDate) return true;
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {dateRange.from && dateRange.to && (
            <div className="text-sm text-muted-foreground text-center">
              Período selecionado: {dateRange.from.toLocaleDateString("pt-BR")}{" "}
              até {dateRange.to.toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={!isValidRange}
            className="w-full sm:w-auto"
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
