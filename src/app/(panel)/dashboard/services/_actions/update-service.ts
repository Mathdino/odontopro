"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import z from "zod"
import { revalidatePath } from "next/cache"

const formSchema = z.object({
  serviceId: z.string().min(1, "O Id do serviço é obrigatório"),
  name: z.string().min(1, "O nome do serviço é obrigatório"),
  price: z.number().min(1, "O preço do serviço é obrigatório"),
  duration: z.number(),
})

type FromSchema = z.infer<typeof formSchema>

export async function updateService(formData: FromSchema) {
  const session = await auth();

  if(!session?.user?.id) {
    return {
      error: "Falha ao atualizar serviço"

    }
}

  const schema = formSchema.safeParse(formData);

  if(!schema.success) {
    return {
      error: "Atulize os campos corretos"
    }
  }

  try {
    await prisma.service.update({
      where: {
        id: formData.serviceId,
        userId: session?.user?.id,
      },
      data: {
        name: formData.name,
        price: formData.price,
        duration: formData.duration,
      }
    })
    revalidatePath("/dashboard/services")
    
    return {
      data: "Serviço atualizado com sucesso"
    }

  } catch (err) {
    return {
      error: "Erro ao atualizar serviço"
    }
  }


}
