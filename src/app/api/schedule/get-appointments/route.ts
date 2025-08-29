//Backend

import prisma from "@/lib/prisma";
import { ok } from "assert";
import { NextRequest, NextResponse } from "next/server";

//Buscar agendamentos em uma data específica
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const dateParam = searchParams.get("date");

  console.log("=== API GET APPOINTMENTS DEBUG ===");
  console.log("userId:", userId);
  console.log("dateParam:", dateParam);

  if (!userId || userId === "null" || !dateParam || dateParam === "null") {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  try {
    const [year, mounth, day] = dateParam.split("-").map(Number);
    const startDate = new Date(year, mounth - 1, day, 0, 0, 0);
    const endDate = new Date(year, mounth - 1, day, 23, 59, 59, 999);

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
        { status: 400 }
      );
    }

    console.log("Usuário encontrado:", user.name);
    console.log("user.times:", user.times);

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
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
}
