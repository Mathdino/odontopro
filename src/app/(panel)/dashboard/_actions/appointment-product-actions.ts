"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema de validação para adicionar produto
const addProductSchema = z.object({
  appointmentId: z.string().min(1, "ID do agendamento é obrigatório"),
  productId: z.string().min(1, "ID do produto é obrigatório"),
  quantity: z.number().min(1, "Quantidade deve ser pelo menos 1").default(1),
});

// Schema de validação para criar produto
const createProductSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional().default(""),
  price: z.number().min(0, "Preço deve ser positivo"),
});

// Schema de validação para remover produto
const removeProductSchema = z.object({
  appointmentProductId: z.string().min(1, "ID do produto no agendamento é obrigatório"),
});

type AddProductSchema = z.infer<typeof addProductSchema>;
type CreateProductSchema = z.infer<typeof createProductSchema>;
type RemoveProductSchema = z.infer<typeof removeProductSchema>;

export async function addProductToAppointment(formData: AddProductSchema) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado",
    };
  }

  const schema = addProductSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0].message,
    };
  }

  try {
    // Verificar se o agendamento pertence ao usuário
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: formData.appointmentId,
        userId: session.user.id,
      },
    });

    if (!appointment) {
      return {
        error: "Agendamento não encontrado",
      };
    }

    // Verificar se o produto existe e pertence ao usuário
    const product = await prisma.product.findFirst({
      where: {
        id: formData.productId,
        userId: session.user.id,
        status: true,
      },
    });

    if (!product) {
      return {
        error: "Produto não encontrado",
      };
    }

    // Verificar se o produto já foi adicionado ao agendamento
    const existingAppointmentProduct = await prisma.appointmentProduct.findUnique({
      where: {
        appointmentId_productId: {
          appointmentId: formData.appointmentId,
          productId: formData.productId,
        },
      },
    });

    if (existingAppointmentProduct) {
      // Atualizar quantidade
      const totalPrice = product.price * formData.quantity;
      
      await prisma.appointmentProduct.update({
        where: {
          id: existingAppointmentProduct.id,
        },
        data: {
          quantity: formData.quantity,
          totalPrice,
        },
      });
    } else {
      // Criar novo registro
      const totalPrice = product.price * formData.quantity;
      
      await prisma.appointmentProduct.create({
        data: {
          appointmentId: formData.appointmentId,
          productId: formData.productId,
          quantity: formData.quantity,
          unitPrice: product.price,
          totalPrice,
        },
      });
    }

    revalidatePath("/dashboard");

    return {
      data: "Produto adicionado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    return {
      error: "Erro ao adicionar produto ao agendamento",
    };
  }
}

export async function removeProductFromAppointment(formData: RemoveProductSchema) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado",
    };
  }

  const schema = removeProductSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0].message,
    };
  }

  try {
    // Verificar se o produto do agendamento existe e pertence ao usuário
    const appointmentProduct = await prisma.appointmentProduct.findFirst({
      where: {
        id: formData.appointmentProductId,
        appointment: {
          userId: session.user.id,
        },
      },
    });

    if (!appointmentProduct) {
      return {
        error: "Produto do agendamento não encontrado",
      };
    }

    await prisma.appointmentProduct.delete({
      where: {
        id: formData.appointmentProductId,
      },
    });

    revalidatePath("/dashboard");

    return {
      data: "Produto removido com sucesso",
    };
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    return {
      error: "Erro ao remover produto do agendamento",
    };
  }
}

export async function createProduct(formData: CreateProductSchema) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado",
    };
  }

  const schema = createProductSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0].message,
    };
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: formData.name,
        description: formData.description,
        price: Math.round(formData.price * 100), // Converter para centavos
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");

    return {
      data: "Produto criado com sucesso",
      product,
    };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return {
      error: "Erro ao criar produto",
    };
  }
}

export async function getUserProducts() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado",
    };
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        userId: session.user.id,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      data: products,
    };
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return {
      error: "Erro ao buscar produtos",
    };
  }
}