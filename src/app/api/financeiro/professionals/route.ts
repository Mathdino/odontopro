import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const professionals = await prisma.professional.findMany({
      where: {
        userId: session.user.id,
        status: true,
      },
      select: {
        id: true,
        name: true,
        specialty: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(professionals);
  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json([], { status: 500 });
  }
}