"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import z from "zod"

const formSchema = z.object({
  name: z.string().min(1, "Nome do serviço é obrigatório"),
  price: z.number().min(1, "Preço do serviço é obrigatório"),
  duration: z.number(),
})

type FromSchema = z.infer<typeof formSchema>

export async function createService(formData: FromSchema) {
  const session = await auth();

  if(!session?.user?.id) {
    return {
      error: "Falha ao cadastrar serviço"
    }
}

  const schema = formSchema.safeParse(formData);

  if(!schema.success) {
    return {
      error: "Preencha todos os campos"
    }
  }

  try{

    const newService = await prisma.service.create({
      data: {
        name: formData.name,
        price: formData.price,
        duration: formData.duration,
        userId: session.user.id,
    }})

    return {
      data: newService

    }
  } catch (err) {
    return {
      error: "Erro ao cadastrar serviço"
    }
  }
}
