//Backend

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Appointment, Professional } from "@prisma/client";

//Buscar agendamentos em uma data específica
export async function GET(request: NextRequest) {
  try {
    // Forma mais segura de obter os parâmetros
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const dateParam = url.searchParams.get("date");
    const professionalId = url.searchParams.get("professionalId"); // Novo parâmetro opcional

    console.log("=== API GET APPOINTMENTS DEBUG ===");
    console.log("userId:", userId);
    console.log("dateParam:", dateParam);
    console.log("professionalId:", professionalId);

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

    // Buscar todos os profissionais ativos da clínica
    const professionals = await prisma.professional.findMany({
      where: {
        userId: userId,
        status: true,
      },
    });

    console.log("Profissionais ativos encontrados:", professionals.length);

    // Se não há profissionais, bloquear todos os horários
    if (professionals.length === 0) {
      console.log("Nenhum profissional ativo - bloqueando todos os horários");
      return NextResponse.json({
        ok: true,
        blockedTimes: user.times || [],
      });
    }

    // @ts-ignore - Prisma types might not be updated yet
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        // @ts-ignore - Prisma types might not be updated yet
        appointmentServices: {
          include: {
            service: true,
          },
        },
        professional: true,
      },
    });

    console.log("Agendamentos encontrados:", appointments.length);

    // Criar um mapa de horários bloqueados por profissional
    const professionalBlockedSlots = new Map<string, Set<string>>();
    
    // Inicializar conjuntos para cada profissional
    professionals.forEach(prof => {
      professionalBlockedSlots.set(prof.id, new Set<string>());
    });

    // Para cada agendamento, bloquear os slots apropriados com base na duração TOTAL dos serviços
    for (const appointment of appointments) {
      const professionalId = appointment.professionalId;
      const startTime = appointment.time;
      const totalDuration = (appointment as any).totalDuration; // duração total em minutos
      
      // Se não tiver profissional associado, pular
      if (!professionalId) continue;
      
      // Obter os slots bloqueados para este profissional
      const blockedSlots = professionalBlockedSlots.get(professionalId);
      if (!blockedSlots) continue;
      
      // Calcular quantos slots de 30 minutos o serviço ocupa
      const slotsToBlock = Math.ceil(totalDuration / 30);
      
      // Encontrar o índice do horário de início
      const timeSlots = user.times || [];
      const startIndex = timeSlots.indexOf(startTime);
      
      // Se o horário de início não for encontrado, pular
      if (startIndex === -1) continue;
      
      // Bloquear os slots consecutivos
      for (let i = 0; i < slotsToBlock && startIndex + i < timeSlots.length; i++) {
        const slotTime = timeSlots[startIndex + i];
        blockedSlots.add(slotTime);
      }
    }

    // Determinar horários bloqueados globais (quando todos os profissionais estão ocupados)
    const globalBlockedSlots = new Set<string>();
    const timeSlots = user.times || [];
    
    for (const timeSlot of timeSlots) {
      // Verificar quantos profissionais trabalham neste horário
      const professionalsWorkingInSlot = professionals.filter((prof) =>
        prof.availableTimes.includes(timeSlot)
      );
      
      // Contar profissionais ocupados neste horário (considerando bloqueios por duração)
      let occupiedProfessionalsCount = 0;
      for (const prof of professionalsWorkingInSlot) {
        const profBlockedSlots = professionalBlockedSlots.get(prof.id);
        if (profBlockedSlots && profBlockedSlots.has(timeSlot)) {
          occupiedProfessionalsCount++;
        }
      }
      
      console.log(`Horário ${timeSlot}:`);
      console.log(
        `- Profissionais que trabalham: ${professionalsWorkingInSlot.length}`
      );
      console.log(`- Profissionais ocupados: ${occupiedProfessionalsCount}`);
      
      // Bloquear horário apenas se TODOS os profissionais que trabalham neste horário estiverem ocupados
      if (
        professionalsWorkingInSlot.length > 0 &&
        occupiedProfessionalsCount >= professionalsWorkingInSlot.length
      ) {
        console.log(
          `- BLOQUEANDO horário ${timeSlot} - todos profissionais ocupados`
        );
        globalBlockedSlots.add(timeSlot);
      } else {
        console.log(
          `- Horário ${timeSlot} disponível - há profissionais livres`
        );
      }
    }

    const blockedTimes = Array.from(globalBlockedSlots);
    console.log("blockedTimes final:", blockedTimes);
    console.log(
      "Agendamentos:",
      appointments.map((apt: any) => ({
        id: apt.id,
        time: apt.time,
        appointmentDate: apt.appointmentDate,
        serviceNames: (apt as any).appointmentServices.map((as: any) => as.service.name),
        totalDuration: (apt as any).totalDuration,
        professionalId: apt.professionalId,
      }))
    );

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