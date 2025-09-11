import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

// Reuse the same date range function
function getDateRangeFromFilter(
  filter: string,
  customRange?: { from: string | undefined; to: string | undefined }
) {
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
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { from: startOfWeek, to: endOfWeek };
      }
      const fromDate = new Date(customRange.from);
      const toDate = new Date(customRange.to);
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate, to: toDate };
    }
    default:
      return { from: today, to: today };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const filter = url.searchParams.get("filter") || "semana toda";
    const professionalId = url.searchParams.get("professionalId") || undefined;
    const customFrom = url.searchParams.get("customFrom");
    const customTo = url.searchParams.get("customTo");

    const customRange = customFrom && customTo ? { from: customFrom, to: customTo } : undefined;
    const dateRange = getDateRangeFromFilter(filter, customRange);
    const now = new Date();

    const whereCondition: any = {
      userId: session.user.id,
      appointmentDate: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
      status: "CONFIRMED",
      paymentStatus: "PAID",
      OR: [
        {
          appointmentDate: {
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
        {
          AND: [
            {
              appointmentDate: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
              },
            },
            {
              time: {
                lte: now.toTimeString().slice(0, 5),
              },
            },
          ],
        },
      ],
    };

    if (professionalId && professionalId !== "all") {
      whereCondition.professionalId = professionalId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereCondition,
      include: {
        service: true,
        appointmentProducts: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    // Group data by day for bar chart
    const dataByDay = new Map<string, number>();

    // Generate all days in the period
    const currentDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toLocaleDateString("pt-BR");
      dataByDay.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add revenue for each day with appointments
    appointments.forEach((appointment) => {
      const dateKey = appointment.appointmentDate.toLocaleDateString("pt-BR");
      const current = dataByDay.get(dateKey) || 0;
      
      // Calculate total revenue including products
      const serviceRevenue = appointment.service.price / 100;
      const productsRevenue = appointment.appointmentProducts.reduce(
        (sum, ap) => sum + ap.totalPrice / 100,
        0
      );
      
      dataByDay.set(dateKey, current + serviceRevenue + productsRevenue);
    });

    // Convert to sorted array
    const chartData = Array.from(dataByDay.entries())
      .map(([date, receita]) => ({
        date: date.split("/").slice(0, 2).join("/"), // Show only day/month
        receita,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching revenue chart data:", error);
    return NextResponse.json([], { status: 500 });
  }
}