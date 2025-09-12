import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clinicId = url.searchParams.get("clinicId");
    const date = url.searchParams.get("date");
    const time = url.searchParams.get("time");

    console.log("=== API GET AVAILABLE PROFESSIONALS DEBUG ===");
    console.log("clinicId:", clinicId);
    console.log("date:", date);
    console.log("time:", time);

    if (!clinicId || !date || !time) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: clinicId, date, time" },
        { status: 400 }
      );
    }

    // Validar formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Formato de data inválido (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    console.log("appointmentDate:", appointmentDate);

    // Buscar todos os profissionais da clínica que trabalham neste horário
    const professionals = await prisma.professional.findMany({
      where: {
        userId: clinicId,
        status: true,
        availableTimes: {
          has: time, // Verifica se o profissional trabalha neste horário
        },
      },
    });

    console.log("Profissionais encontrados:", professionals.length);

    // Buscar a configuração da clínica para obter os horários
    const clinic = await prisma.user.findUnique({
      where: {
        id: clinicId,
      },
      select: {
        times: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clínica não encontrada" },
        { status: 404 }
      );
    }

    const timeSlots = clinic.times || [];
    const timeSlotIndex = timeSlots.indexOf(time);

    if (timeSlotIndex === -1) {
      return NextResponse.json(
        { error: "Horário inválido" },
        { status: 400 }
      );
    }

    // Buscar todos os agendamentos para o dia
    // @ts-ignore - Prisma types might not be updated yet
    const allAppointments = await prisma.appointment.findMany({
      where: {
        userId: clinicId,
        appointmentDate: appointmentDate,
      },
      include: {
        // @ts-ignore - Prisma types might not be updated yet
        appointmentServices: {
          include: {
            service: true,
          },
        },
        service: true,
      },
    });

    // Filtrar profissionais disponíveis (sem agendamento conflitante no horário)
    const availableProfessionals = professionals.filter((professional) => {
      // Buscar agendamentos para este profissional
      const professionalAppointments = allAppointments.filter(
        (apt) => apt.professionalId === professional.id
      );

      // Verificar se há conflitos
      let hasConflict = false;
      
      for (const appointment of professionalAppointments) {
        const aptStartIndex = timeSlots.indexOf(appointment.time);
        if (aptStartIndex === -1) continue;
        
        // Calcular quantos slots o agendamento existente ocupa usando totalDuration
        let totalDuration = (appointment as any).totalDuration;
        if (!totalDuration) {
          // Fallback to calculating from appointmentServices or single service
          if ((appointment as any).appointmentServices && (appointment as any).appointmentServices.length > 0) {
            totalDuration = (appointment as any).appointmentServices.reduce(
              (sum: number, as: any) => sum + as.service.duration,
              0
            );
          } else {
            totalDuration = appointment.service.duration;
          }
        }
        const aptSlots = Math.ceil(totalDuration / 30);
        
        // Verificar se há sobreposição
        const aptEndIndex = aptStartIndex + aptSlots - 1;
        
        // Se há interseção entre os intervalos
        if (timeSlotIndex >= aptStartIndex && timeSlotIndex <= aptEndIndex) {
          hasConflict = true;
          break;
        }
      }

      console.log(
        `Profissional ${professional.name}: ${
          hasConflict ? "ocupado" : "disponível"
        }`
      );
      
      return !hasConflict;
    });

    console.log("Profissionais disponíveis:", availableProfessionals.length);

    return NextResponse.json({
      ok: true,
      professionals: availableProfessionals.map((prof) => ({
        id: prof.id,
        name: prof.name,
        profileImage: prof.image,
        specialty: prof.specialty,
        availableTimes: prof.availableTimes,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar profissionais disponíveis:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}