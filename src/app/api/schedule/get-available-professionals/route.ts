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
      include: {
        appointments: {
          where: {
            appointmentDate: appointmentDate,
            time: time,
          },
        },
      },
    });

    console.log("Profissionais encontrados:", professionals.length);

    // Filtrar profissionais disponíveis (sem agendamento no horário)
    const availableProfessionals = professionals.filter((professional) => {
      const hasAppointment = professional.appointments.length > 0;
      console.log(
        `Profissional ${professional.name}: ${
          hasAppointment ? "ocupado" : "disponível"
        }`
      );
      return !hasAppointment;
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
