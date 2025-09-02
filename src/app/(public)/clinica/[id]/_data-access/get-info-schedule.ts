"use server";

import prisma from "@/lib/prisma";

export async function getInfoSchedule({ userId }: { userId: string }) {
  try {
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
        services: {
          where: {
            status: true,
          },
          include: {
            category: true,
          },
          orderBy: {
            category: {
              order: "asc",
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("Erro ao buscar informações da clínica:", err);
    return null;
  }
}

export async function getClinicInfo(userId: string) {
  try {
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
        services: {
          where: {
            status: true,
          },
          include: {
            category: true,
          },
          orderBy: {
            category: {
              order: "asc",
            },
          },
        },
        reviews: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("Erro ao buscar informações da clínica:", err);
    return null;
  }
}
