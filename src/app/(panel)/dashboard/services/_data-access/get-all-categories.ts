"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getAllCategories({ userId }: { userId: string }) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.id !== userId) {
      return {
        error: "Não autorizado",
        data: null,
      };
    }

    const categories = await prisma.category.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        order: "asc",
      },
    });

    return {
      data: categories,
    };
  } catch (error) {
    return {
      error: "Erro ao buscar categorias",
      data: null,
    };
  }
}
