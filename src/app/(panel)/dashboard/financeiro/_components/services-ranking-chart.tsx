"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
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
  professionalId?: string;
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
  professionalId,
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
          customDateRange,
          professionalId
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
  }, [userId, filter, customDateRange, professionalId]);

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

  const LegendModal = () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Ver Legenda
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Legenda dos Serviços</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  ></div>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{entry.value} serviços</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(entry.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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

  // Calcular total de serviços
  const totalServices = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Serviços</CardTitle>
          {data.length > 0 && <LegendModal />}
        </div>
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
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Serviços</p>
              <p className="text-lg font-semibold">0</p>
            </div>
          </>
        ) : (
          <>
            <div className="h-[200px] flex justify-center">
              <div className="w-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Linha separadora transparente */}
            <div className="w-full h-px bg-border/20 my-4"></div>

            {/* Total */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Serviços</p>
              <p className="text-lg font-semibold">{totalServices}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
