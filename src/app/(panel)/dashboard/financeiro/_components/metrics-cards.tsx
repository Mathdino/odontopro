"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, Users } from "lucide-react";
import { FilterType } from "./financeiro-content";
import { useEffect, useState } from "react";
import { getFinancialMetrics } from "../_data-access/get-financial-metrics";

interface MetricsCardsProps {
  userId: string;
  filter: FilterType;
  customDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface Metrics {
  grossRevenue: number;
  completedServices: number;
  uniqueClients: number;
}

export function MetricsCards({
  userId,
  filter,
  customDateRange,
}: MetricsCardsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    grossRevenue: 0,
    completedServices: 0,
    uniqueClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const data = await getFinancialMetrics(userId, filter, customDateRange);
        setMetrics(data);
      } catch (error) {
        console.error("Erro ao carregar métricas:", error);
        setMetrics({
          grossRevenue: 0,
          completedServices: 0,
          uniqueClients: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [userId, filter, customDateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
      {/* Card de Receita - ocupa 2 colunas no mobile */}
      <Card className="col-span-2 md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Carregando..." : formatCurrency(metrics.grossRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Soma dos serviços concluídos
          </p>
        </CardContent>
      </Card>

      {/* Card de Serviços - ocupa 1 coluna no mobile */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Serviços Concluídos
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Carregando..." : metrics.completedServices}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de serviços finalizados
          </p>
        </CardContent>
      </Card>

      {/* Card de Clientes - ocupa 1 coluna no mobile */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Clientes Atendidos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Carregando..." : metrics.uniqueClients}
          </div>
          <p className="text-xs text-muted-foreground">
            Número de clientes atendidos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
