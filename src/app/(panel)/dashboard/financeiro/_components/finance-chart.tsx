"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FilterType } from "./financeiro-content";
import { getFinancialChartData } from "../_data-access/get-financial-metrics";

interface FinanceChartProps {
  userId: string;
  filter: FilterType;
  customDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface ChartData {
  date: string;
  receita: number;
  servicos: number;
}

export function FinanceChart({
  userId,
  filter,
  customDateRange,
}: FinanceChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const chartData = await getFinancialChartData(
          userId,
          filter,
          customDateRange
        );
        setData(chartData);
      } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [userId, filter, customDateRange]);

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
          <p className="text-blue-600">
            {`Receita: ${formatCurrency(payload[0].value)}`}
          </p>
          <p className="text-green-600">{`Serviços: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Carregando gráfico...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">
          Nenhum dado encontrado para o período selecionado
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            yAxisId="receita"
            orientation="left"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            yAxisId="servicos"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="receita"
            type="monotone"
            dataKey="receita"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            name="Receita (R$)"
          />
          <Line
            yAxisId="servicos"
            type="monotone"
            dataKey="servicos"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            name="Serviços"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
