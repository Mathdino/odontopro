"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, ChevronDown } from "lucide-react";
import { CustomPeriodModal } from "./custom-period-modal";
import { FilterType } from "./financeiro-content";

interface FilterPeriodProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  customDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onCustomDateChange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "semana toda", label: "Semana Toda" },
  { value: "4 semanas", label: "4 Semanas" },
  { value: "2 meses", label: "2 Meses" },
  { value: "4 meses", label: "4 Meses" },
  { value: "6 meses", label: "6 Meses" },
  { value: "1 ano", label: "1 Ano" },
  { value: "personalizado", label: "Personalizar" },
];

export function FilterPeriod({
  selectedFilter,
  onFilterChange,
  customDateRange,
  onCustomDateChange,
}: FilterPeriodProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const handleFilterSelect = (filter: FilterType) => {
    if (filter === "personalizado") {
      setIsCustomModalOpen(true);
    } else {
      // Limpar o range personalizado quando selecionar outro filtro
      onCustomDateChange({ from: undefined, to: undefined });
      onFilterChange(filter);
      // Salvar no localStorage
      localStorage.setItem("financeiro-filter", filter);
      localStorage.removeItem("financeiro-custom-range");
    }
  };

  const handleCustomDateApply = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    onCustomDateChange(range);
    onFilterChange("personalizado");
    localStorage.setItem("financeiro-filter", "personalizado");
    localStorage.setItem("financeiro-custom-range", JSON.stringify(range));
    setIsCustomModalOpen(false);
  };

  const getSelectedLabel = () => {
    if (
      selectedFilter === "personalizado" &&
      customDateRange.from &&
      customDateRange.to
    ) {
      return `${customDateRange.from.toLocaleDateString(
        "pt-BR"
      )} - ${customDateRange.to.toLocaleDateString("pt-BR")}`;
    }
    return (
      filterOptions.find((option) => option.value === selectedFilter)?.label ||
      "Semana Toda"
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`min-w-[150px] justify-between ${
              selectedFilter === "personalizado" ? "text-xs" : "text-sm"
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{getSelectedLabel()}</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {filterOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterSelect(option.value)}
              className={selectedFilter === option.value ? "bg-accent" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <CustomPeriodModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onApply={handleCustomDateApply}
        initialRange={customDateRange}
      />
    </>
  );
}
