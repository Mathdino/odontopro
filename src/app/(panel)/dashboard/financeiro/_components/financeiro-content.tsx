"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPeriod } from "./filter-period";
import { MetricsCards } from "./metrics-cards";
import { FinanceChart } from "./finance-chart";
import { RevenueChart } from "./revenue-chart";
import { ServicesRankingChart } from "./services-ranking-chart";

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

  // Carregar filtro salvo no localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem("financeiro-filter") as FilterType;
    const savedRange = localStorage.getItem("financeiro-custom-range");

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
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <FilterPeriod
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          customDateRange={customDateRange}
          onCustomDateChange={setCustomDateRange}
        />
      </div>

      <MetricsCards
        userId={userId}
        filter={selectedFilter}
        customDateRange={customDateRange}
      />

      {/* Linha separadora transparente */}
      <div className="w-full h-px bg-border/20"></div>

      {/* Novo card de gráfico de Receita */}
      <RevenueChart
        userId={userId}
        filter={selectedFilter}
        customDateRange={customDateRange}
      />

      {/* Card de gráfico de Serviços */}
      <ServicesRankingChart
        userId={userId}
        filter={selectedFilter}
        customDateRange={customDateRange}
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
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
