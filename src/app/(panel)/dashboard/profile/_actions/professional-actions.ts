"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

// Schema de validação para profissional
const professionalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  image: z.string().optional(),
  availableTimes: z.array(z.string()).default([]),
  status: z.boolean().default(true),
});

const updateProfessionalSchema = professionalSchema.extend({
  id: z.string(),
});

// Criar profissional
export async function createProfessional(
  data: z.infer<typeof professionalSchema>
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const validatedData = professionalSchema.parse(data);

    const professional = await prisma.professional.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/profile");
    return {
      success: true,
      data: "Profissional criado com sucesso!",
      professional,
    };
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    return { success: false, error: "Erro ao criar profissional" };
  }
}

// Atualizar profissional
export async function updateProfessional(
  data: z.infer<typeof updateProfessionalSchema>
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const validatedData = updateProfessionalSchema.parse(data);

    // Verificar se o profissional pertence ao usuário
    const existingProfessional = await prisma.professional.findFirst({
      where: {
        id: validatedData.id,
        userId: session.user.id,
      },
    });

    if (!existingProfessional) {
      return { success: false, error: "Profissional não encontrado" };
    }

    const professional = await prisma.professional.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        image: validatedData.image,
        availableTimes: validatedData.availableTimes,
        status: validatedData.status,
      },
    });

    revalidatePath("/dashboard/profile");
    return {
      success: true,
      data: "Profissional atualizado com sucesso!",
      professional,
    };
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    return { success: false, error: "Erro ao atualizar profissional" };
  }
}

// Alternar status do profissional
export async function toggleProfessionalStatus(professionalId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o profissional pertence ao usuário
    const existingProfessional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        userId: session.user.id,
      },
    });

    if (!existingProfessional) {
      return { success: false, error: "Profissional não encontrado" };
    }

    const newStatus = !existingProfessional.status;

    const professional = await prisma.professional.update({
      where: { id: professionalId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/profile");
    return {
      success: true,
      data: `Profissional ${newStatus ? "ativado" : "desativado"} com sucesso!`,
      professional,
    };
  } catch (error) {
    console.error("Erro ao alterar status do profissional:", error);
    return { success: false, error: "Erro ao alterar status do profissional" };
  }
}

// Deletar profissional
export async function deleteProfessional(professionalId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o profissional pertence ao usuário
    const existingProfessional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        userId: session.user.id,
      },
    });

    if (!existingProfessional) {
      return { success: false, error: "Profissional não encontrado" };
    }

    await prisma.professional.delete({
      where: { id: professionalId },
    });

    revalidatePath("/dashboard/profile");
    return { success: true, data: "Profissional removido com sucesso!" };
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
    return { success: false, error: "Erro ao deletar profissional" };
  }
}

// Buscar profissionais do usuário
export async function getProfessionals() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado", data: [] };
    }

    const professionals = await prisma.professional.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: professionals };
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return {
      success: false,
      error: "Erro ao buscar profissionais",
      data: [],
    };
  }
}
