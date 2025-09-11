"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterType } from "./financeiro-content";
import { getRevenueChartData, getFinancialMetrics } from "../_data-access/get-financial-metrics";

interface RevenueChartProps {
  userId: string;
  filter: FilterType;
  customDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  professionalId?: string;
}

interface ChartData {
  date: string;
  receita: number;
}

export function RevenueChart({
  userId,
  filter,
  customDateRange,
  professionalId,
}: RevenueChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialMetrics, setFinancialMetrics] = useState({ grossRevenue: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [chartData, metricsData] = await Promise.all([
          getRevenueChartData(
            userId,
            filter,
            customDateRange,
            professionalId
          ),
          getFinancialMetrics(
            userId,
            filter,
            customDateRange,
            professionalId
          )
        ]);
        setData(chartData);
        setFinancialMetrics(metricsData);
      } catch (error) {
        console.error("Erro ao carregar dados do gráfico de receita:", error);
        setData([]);
        setFinancialMetrics({ grossRevenue: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, filter, customDateRange, professionalId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-medium">{`Data: ${label}`}</p>
          <p className="text-emerald-600">
            {`Receita: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcular período para subtítulo
  const getDateRangeText = () => {
    if (
      filter === "personalizado" &&
      customDateRange.from &&
      customDateRange.to
    ) {
      return `${customDateRange.from.toLocaleDateString(
        "pt-BR"
      )} - ${customDateRange.to.toLocaleDateString("pt-BR")}`;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "semana toda": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString(
          "pt-BR"
        )} - ${endOfWeek.toLocaleDateString("pt-BR")}`;
      }
      case "4 semanas": {
        const fourWeeksAgo = new Date(today);
        fourWeeksAgo.setDate(today.getDate() - 28);
        return `${fourWeeksAgo.toLocaleDateString(
          "pt-BR"
        )} - ${today.toLocaleDateString("pt-BR")}`;
      }
      case "2 meses": {
        const twoMonthsAgo = new Date(today);
        twoMonthsAgo.setMonth(today.getMonth() - 2);
        return `${twoMonthsAgo.toLocaleDateString(
          "pt-BR"
        )} - ${today.toLocaleDateString("pt-BR")}`;
      }
      case "4 meses": {
        const fourMonthsAgo = new Date(today);
        fourMonthsAgo.setMonth(today.getMonth() - 4);
        return `${fourMonthsAgo.toLocaleDateString(
          "pt-BR"
        )} - ${today.toLocaleDateString("pt-BR")}`;
      }
      case "6 meses": {
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        return `${sixMonthsAgo.toLocaleDateString(
          "pt-BR"
        )} - ${today.toLocaleDateString("pt-BR")}`;
      }
      case "1 ano": {
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return `${oneYearAgo.toLocaleDateString(
          "pt-BR"
        )} - ${today.toLocaleDateString("pt-BR")}`;
      }
      default:
        return "Período selecionado";
    }
  };

  // Calcular totais
  const totalRevenue = data.reduce((sum, item) => sum + item.receita, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita</CardTitle>
          <p className="text-sm text-muted-foreground">{getDateRangeText()}</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita</CardTitle>
        <p className="text-sm text-muted-foreground">{getDateRangeText()}</p>
      </CardHeader>

      {/* Linha separadora transparente */}
      <div className="w-full h-px bg-border/30 mx-6"></div>

      <CardContent className="pt-6">
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={
                data.length === 0 ? [{ date: "Sem dados", receita: 0 }] : data
              }
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e2e8f0" }}
                tickFormatter={formatCurrency}
                domain={[0, "dataMax"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Linha separadora transparente */}
        <div className="w-full h-px bg-border/20 my-4"></div>

        {/* Totais */}
        <div className="flex justify-center items-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Lucro Total</p>
            <p className="text-lg font-semibold">{formatCurrency(financialMetrics.grossRevenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
