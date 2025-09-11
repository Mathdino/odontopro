"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterPeriod } from "./filter-period";
import { MetricsCards } from "./metrics-cards";
import { FinanceChart } from "./finance-chart";
import { RevenueChart } from "./revenue-chart";
import { ServicesRankingChart } from "./services-ranking-chart";
import { getProfessionals } from "../_data-access/get-financial-metrics";
import { useQuery } from "@tanstack/react-query";
import { User, Users, CreditCard } from "lucide-react";
import Link from "next/link";

interface FinanceiroContentProps {
  userId: string;
}

export type FilterType =
  | "semana toda"
  | "4 semanas"
  | "2 meses"
  | "4 meses"
  | "6 meses"
  | "1 ano"
  | "personalizado";

export default function FinanceiroContent({ userId }: FinanceiroContentProps) {
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("semana toda");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");

  // Fetch professionals for the filter
  const { data: professionals } = useQuery({
    queryKey: ["professionals", userId],
    queryFn: () => getProfessionals(userId),
  });

  // Carregar filtro salvo no localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem("financeiro-filter") as FilterType;
    const savedRange = localStorage.getItem("financeiro-custom-range");
    const savedProfessional = localStorage.getItem("financeiro-professional");

    if (savedFilter) {
      setSelectedFilter(savedFilter);

      if (savedFilter === "personalizado" && savedRange) {
        try {
          const parsedRange = JSON.parse(savedRange);
          setCustomDateRange({
            from: parsedRange.from ? new Date(parsedRange.from) : undefined,
            to: parsedRange.to ? new Date(parsedRange.to) : undefined,
          });
        } catch (error) {
          console.error("Erro ao carregar período personalizado:", error);
        }
      }
    }

    if (savedProfessional) {
      setSelectedProfessional(savedProfessional);
    }
  }, []);

  // Handle professional filter change
  const handleProfessionalChange = (value: string) => {
    setSelectedProfessional(value);
    localStorage.setItem("financeiro-professional", value);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          
        </div>
        
        {/* Filters Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Professional Filter */}
          <div className="flex items-center gap-2 justify-between">
            <Select value={selectedProfessional} onValueChange={handleProfessionalChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Todos os Profissionais</span>
                  </div>
                </SelectItem>
                {professionals?.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{professional.name}</span>
                      {professional.specialty && (
                        <span className="text-xs text-muted-foreground">({professional.specialty})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link href="/dashboard/financeiro/pagamentos">
            <Button variant="outline" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamentos
            </Button>
          </Link>
          </div>
          
          {/* Period Filter */}
          <FilterPeriod
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            customDateRange={customDateRange}
            onCustomDateChange={setCustomDateRange}
          />
        </div>
      </div>

      <MetricsCards
        userId={userId}
        filter={selectedFilter}
        customDateRange={customDateRange}
        professionalId={selectedProfessional === "all" ? undefined : selectedProfessional}
      />

      {/* Linha separadora transparente */}
      <div className="w-full h-px bg-border/20"></div>

      {/* Novo card de gráfico de Receita */}
      <RevenueChart
        userId={userId}
        filter={selectedFilter}
        customDateRange={customDateRange}
        professionalId={selectedProfessional === "all" ? undefined : selectedProfessional}
      />

      {/* Card de gráfico de Serviços */}
      <ServicesRankingChart
        userId={userId}
        filter={selectedFilter}
        customDateRange={customDateRange}
        professionalId={selectedProfessional === "all" ? undefined : selectedProfessional}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <FinanceChart
              userId={userId}
              filter={selectedFilter}
              customDateRange={customDateRange}
              professionalId={selectedProfessional === "all" ? undefined : selectedProfessional}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
