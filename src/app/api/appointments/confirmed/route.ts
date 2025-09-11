import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        // Fetch all appointments, not just CONFIRMED ones
        // This will allow us to identify overdue appointments correctly
      },
      include: {
        service: true,
        professional: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        appointmentProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          appointmentDate: "desc",
        },
        {
          time: "desc",
        },
      ],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching confirmed appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}