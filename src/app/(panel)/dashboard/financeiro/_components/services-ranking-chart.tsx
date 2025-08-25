"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterType } from "./financeiro-content";
import { getServicesRankingData } from "../_data-access/get-financial-metrics";
import { formatCurrency } from "@/utils/formatCurrency";

interface ServicesRankingChartProps {
  userId: string;
  filter: FilterType;
  customDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface RankingData {
  name: string;
  value: number;
  revenue: number;
  fill: string;
}

export function ServicesRankingChart({
  userId,
  filter,
  customDateRange,
}: ServicesRankingChartProps) {
  const [data, setData] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRankingData() {
      setLoading(true);
      try {
        const rankingData = await getServicesRankingData(
          userId,
          filter,
          customDateRange
        );
        setData(rankingData);
      } catch (error) {
        console.error("Erro ao carregar ranking de serviços:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRankingData();
  }, [userId, filter, customDateRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">{`Quantidade: ${data.value}`}</p>
          <p className="text-green-600">
            {`Receita: ${new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(data.revenue)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-muted-foreground">
              {entry.value} (
              {data.find((d) => d.name === entry.value)?.value || 0})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular total da receita
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <>
            <div className="h-[150px] flex items-center justify-center">
              <div className="text-muted-foreground">
                Nenhum resultado para este período
              </div>
            </div>

            {/* Linha separadora transparente */}
            <div className="w-full h-px bg-border/20 my-4"></div>

            {/* Total */}
            <div className="flex justify-center items-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{formatCurrency(0)}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Linha separadora transparente */}
            <div className="w-full h-px bg-border/20 my-4"></div>

            {/* Total */}
            <div className="flex justify-center items-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
