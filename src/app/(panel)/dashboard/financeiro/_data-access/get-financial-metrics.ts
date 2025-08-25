import prisma from "@/lib/prisma";
import { FilterType } from "../_components/financeiro-content";

interface DateRange {
  from: Date;
  to: Date;
}

function getDateRangeFromFilter(
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined }
): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "semana toda": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { from: startOfWeek, to: endOfWeek };
    }
    case "4 semanas": {
      const fourWeeksAgo = new Date(today);
      fourWeeksAgo.setDate(today.getDate() - 28);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: fourWeeksAgo, to: endDate };
    }
    case "2 meses": {
      const twoMonthsAgo = new Date(today);
      twoMonthsAgo.setMonth(today.getMonth() - 2);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: twoMonthsAgo, to: endDate };
    }
    case "4 meses": {
      const fourMonthsAgo = new Date(today);
      fourMonthsAgo.setMonth(today.getMonth() - 4);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: fourMonthsAgo, to: endDate };
    }
    case "6 meses": {
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: sixMonthsAgo, to: endDate };
    }
    case "1 ano": {
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: oneYearAgo, to: endDate };
    }
    case "personalizado": {
      if (!customRange?.from || !customRange?.to) {
        // Fallback para semana atual se não houver range personalizado
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { from: startOfWeek, to: endOfWeek };
      }
      const endDate = new Date(customRange.to);
      endDate.setHours(23, 59, 59, 999);
      return { from: customRange.from, to: endDate };
    }
    default:
      return { from: today, to: today };
  }
}

export async function getFinancialMetrics(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined }
) {
  const dateRange = getDateRangeFromFilter(filter, customRange);

  try {
    // Buscar todos os agendamentos no período especificado
    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        appointmentDate: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        service: true,
      },
    });

    // Calcular métricas
    const grossRevenue = appointments.reduce((total, appointment) => {
      return total + appointment.service.price;
    }, 0);

    const completedServices = appointments.length;

    // Contar clientes únicos baseado no email
    const uniqueEmails = new Set(
      appointments.map((appointment) => appointment.email)
    );
    const uniqueClients = uniqueEmails.size;

    return {
      grossRevenue: grossRevenue / 100, // Converter de centavos para reais
      completedServices,
      uniqueClients,
    };
  } catch (error) {
    console.error("Erro ao buscar métricas financeiras:", error);
    return {
      grossRevenue: 0,
      completedServices: 0,
      uniqueClients: 0,
    };
  }
}

export async function getFinancialChartData(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined }
) {
  const dateRange = getDateRangeFromFilter(filter, customRange);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        appointmentDate: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    // Agrupar dados por dia
    const dataByDay = new Map<string, { receita: number; servicos: number }>();

    appointments.forEach((appointment) => {
      const dateKey = appointment.appointmentDate.toLocaleDateString("pt-BR");
      const current = dataByDay.get(dateKey) || { receita: 0, servicos: 0 };

      current.receita += appointment.service.price / 100; // Converter de centavos
      current.servicos += 1;

      dataByDay.set(dateKey, current);
    });

    // Converter para array ordenado
    const chartData = Array.from(dataByDay.entries())
      .map(([date, data]) => ({
        date,
        receita: data.receita,
        servicos: data.servicos,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      });

    return chartData;
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico:", error);
    return [];
  }
}

export async function getServicesRankingData(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined }
) {
  const dateRange = getDateRangeFromFilter(filter, customRange);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        appointmentDate: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        service: true,
      },
    });

    // Agrupar serviços por nome e contar ocorrências
    const serviceCount = new Map<
      string,
      { name: string; count: number; revenue: number }
    >();

    appointments.forEach((appointment) => {
      const serviceName = appointment.service.name;
      const current = serviceCount.get(serviceName) || {
        name: serviceName,
        count: 0,
        revenue: 0,
      };

      current.count += 1;
      current.revenue += appointment.service.price / 100; // Converter de centavos

      serviceCount.set(serviceName, current);
    });

    // Converter para array e ordenar por quantidade (ranking)
    const rankingData = Array.from(serviceCount.values())
      .sort((a, b) => b.count - a.count)
      .map((service, index) => ({
        name: service.name,
        value: service.count,
        revenue: service.revenue,
        fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Cores diferentes para cada serviço
      }));

    return rankingData;
  } catch (error) {
    console.error("Erro ao buscar ranking de serviços:", error);
    return [];
  }
}

export async function getRevenueChartData(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined }
) {
  const dateRange = getDateRangeFromFilter(filter, customRange);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        appointmentDate: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    // Agrupar dados por dia para o gráfico de barras
    const dataByDay = new Map<string, number>();

    // Gerar todos os dias no período
    const currentDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toLocaleDateString("pt-BR");
      dataByDay.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adicionar receita para cada dia com appointments
    appointments.forEach((appointment) => {
      const dateKey = appointment.appointmentDate.toLocaleDateString("pt-BR");
      const current = dataByDay.get(dateKey) || 0;
      dataByDay.set(dateKey, current + appointment.service.price / 100);
    });

    // Converter para array ordenado
    const chartData = Array.from(dataByDay.entries())
      .map(([date, receita]) => ({
        date: date.split("/").slice(0, 2).join("/"), // Mostrar apenas dia/mês
        receita,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      });

    return chartData;
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de receita:", error);
    return [];
  }
}
