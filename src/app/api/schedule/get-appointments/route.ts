//Backend

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

//Buscar agendamentos em uma data específica
export async function GET(request: NextRequest) {
  try {
    // Forma mais segura de obter os parâmetros
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const dateParam = url.searchParams.get("date");

    console.log("=== API GET APPOINTMENTS DEBUG ===");
    console.log("userId:", userId);
    console.log("dateParam:", dateParam);

    if (!userId || userId === "null" || !dateParam || dateParam === "null") {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Validar formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Formato de data inválido" },
        { status: 400 }
      );
    }

    const [year, month, day] = dateParam.split("-").map(Number);

    // Validar se a data é válida
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    console.log("Período de busca:");
    console.log("startDate:", startDate);
    console.log("endDate:", endDate);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      console.log("Usuário não encontrado!");
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("Usuário encontrado:", user.name);
    console.log("user.times:", user.times);
    console.log("user.workingDays:", user.workingDays);

    // Verificar se a clínica funciona no dia da semana selecionado
    const dayOfWeek = startDate.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const selectedDayName = dayNames[dayOfWeek];

    const workingDays = user.workingDays || [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];

    if (!workingDays.includes(selectedDayName)) {
      console.log(`Clínica não funciona em ${selectedDayName}`);
      return NextResponse.json({
        ok: true,
        blockedTimes: user.times || [], // Bloquear todos os horários se não funciona neste dia
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
      },
    });

    console.log("Agendamentos encontrados:", appointments.length);
    console.log(
      "Agendamentos:",
      appointments.map((apt) => ({
        id: apt.id,
        time: apt.time,
        appointmentDate: apt.appointmentDate,
        serviceName: apt.service.name,
        duration: apt.service.duration,
      }))
    );

    //Montar com todos os slots ocupados
    const blockedSlots = new Set<string>();

    for (const apt of appointments) {
      const requiredSlots = Math.ceil(apt.service.duration / 30);
      const startIndex = user.times.indexOf(apt.time);

      console.log(`Processando agendamento ${apt.time}:`);
      console.log("- requiredSlots:", requiredSlots);
      console.log("- startIndex:", startIndex);

      if (startIndex !== -1) {
        for (let i = 0; i < requiredSlots; i++) {
          const blockedHour = user.times[startIndex + i];
          if (blockedHour) {
            console.log("- Bloqueando horário:", blockedHour);
            blockedSlots.add(blockedHour);
          }
        }
      } else {
        console.log("- ERRO: Horário não encontrado em user.times!");
      }
    }

    const blockedTimes = Array.from(blockedSlots);
    console.log("blockedTimes final:", blockedTimes);

    return NextResponse.json({
      ok: true,
      blockedTimes,
    });
  } catch (err) {
    console.error("Erro na API:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
