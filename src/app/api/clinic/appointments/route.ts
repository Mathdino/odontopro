import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/*
  Rota para buscar todos os agendamentos de uma clinica

  > Preciso ter a Data
  > Preciso ter o ID da Clinica
*/

export const GET = auth(async function GET(request) {
  if (!request.auth) {
    return NextResponse.json(
      {
        error: "Acesso não autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const dateString = searchParams.get("date") as string;
  const clinicId = request.auth?.user?.id;

  if (!dateString) {
    return NextResponse.json(
      {
        error: "Nenhuma data foi informada",
      },
      {
        status: 400,
      }
    );
  }

  if (!clinicId) {
    return NextResponse.json(
      {
        error: "Nenhum ID de clinica foi informado",
      },
      {
        status: 400,
      }
    );
  }

  try {
    //criar data formatada
    const [year, month, day] = dateString.split("-").map(Number);

    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    //buscar agendamentos
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: clinicId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
        professional: true,
        appointmentProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(appointments);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Erro ao buscar agendamentos",
      },
      {
        status: 400,
      }
    );
  }
});
