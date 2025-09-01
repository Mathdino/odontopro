"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import z from "zod";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  order: z.number().optional(),
});

const updateCategorySchema = z.object({
  categoryId: z.string().min(1, "ID da categoria é obrigatório"),
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  order: z.number().optional(),
});

type CategorySchema = z.infer<typeof categorySchema>;
type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;

export async function createCategory(formData: CategorySchema) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Falha ao criar categoria",
    };
  }

  console.log("Dados recebidos:", formData);

  const schema = categorySchema.safeParse(formData);

  if (!schema.success) {
    console.log("Erro de validação:", schema.error.issues);
    return {
      error: `Erro de validação: ${schema.error.issues
        .map((i) => i.message)
        .join(", ")}`,
    };
  }

  try {
    // Buscar a maior ordem atual
    const maxOrder = await prisma.category.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    console.log("Ordem máxima encontrada:", maxOrder);

    const newCategory = await prisma.category.create({
      data: {
        name: formData.name,
        order: formData.order ?? (maxOrder?.order ?? 0) + 1,
        userId: session.user.id,
      },
    });

    console.log("Categoria criada com sucesso:", newCategory);

    revalidatePath("/dashboard/services");

    return {
      data: newCategory,
    };
  } catch (err) {
    console.error("Erro detalhado ao criar categoria:", err);
    return {
      error: `Erro ao criar categoria: ${
        err instanceof Error ? err.message : "Erro desconhecido"
      }`,
    };
  }
}

export async function updateCategory(formData: UpdateCategorySchema) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Falha ao atualizar categoria",
    };
  }

  const schema = updateCategorySchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: "Dados inválidos",
    };
  }

  try {
    await prisma.category.update({
      where: {
        id: formData.categoryId,
        userId: session.user.id,
      },
      data: {
        name: formData.name,
        order: formData.order,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      data: "Categoria atualizada com sucesso",
    };
  } catch (err) {
    return {
      error: "Erro ao atualizar categoria",
    };
  }
}

export async function deleteCategory(categoryId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Falha ao deletar categoria",
    };
  }

  try {
    // Verificar se a categoria tem serviços associados
    const servicesCount = await prisma.service.count({
      where: {
        categoryId: categoryId,
        userId: session.user.id,
      },
    });

    if (servicesCount > 0) {
      return {
        error:
          "Não é possível deletar uma categoria que possui serviços associados",
      };
    }

    await prisma.category.delete({
      where: {
        id: categoryId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      data: "Categoria deletada com sucesso",
    };
  } catch (err) {
    return {
      error: "Erro ao deletar categoria",
    };
  }
}

// Função para criar categoria padrão "Promoções"
export async function createDefaultCategory(userId: string) {
  try {
    // Verificar se já existe uma categoria "Promoções"
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: userId,
        name: "Promoções",
      },
    });

    if (existingCategory) {
      return { data: existingCategory };
    }

    // Criar categoria "Promoções" com ordem 0 (primeira)
    const defaultCategory = await prisma.category.create({
      data: {
        name: "Promoções",
        order: 0,
        userId: userId,
      },
    });

    return { data: defaultCategory };
  } catch (err) {
    return {
      error: "Erro ao criar categoria padrão",
    };
  }
}
