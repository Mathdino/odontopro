"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import z from "zod";
import { revalidatePath } from "next/cache";

const formSchema = z.object({
  name: z.string().min(1, "Nome do serviço é obrigatório"),
  description: z.string().optional(),
  image: z.string().optional(),
  price: z.number().min(1, "Preço do serviço é obrigatório"),
  duration: z.number(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
});

type FromSchema = z.infer<typeof formSchema>;

export async function createService(formData: FromSchema) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Falha ao cadastrar serviço",
    };
  }

  const schema = formSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: "Preencha todos os campos",
    };
  }

  try {
    const newService = await prisma.service.create({
      data: {
        name: formData.name,
        description: formData.description || "",
        image: formData.image || "img-generic.png",
        price: formData.price,
        duration: formData.duration,
        categoryId: formData.categoryId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      data: newService,
    };
  } catch (err) {
    return {
      error: "Erro ao cadastrar serviço",
    };
  }
}
