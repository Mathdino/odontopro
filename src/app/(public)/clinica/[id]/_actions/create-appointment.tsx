"use server";

import z, { date } from "zod";
import prisma from "@/lib/prisma";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  date: z.date(),
  serviceId: z.string().min(1, "Serviço é obrigatório"),
  clinicId: z.string().min(1, "Clínica é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
});

type FormSchema = z.infer<typeof formSchema>;

export async function createNewAppointment(formData: FormSchema) {
  const schema = formSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0].message, // Corrigido: 'error' ao invés de 'errors'
    };
  }

  try {
    // Verificar se o serviço existe e está ativo
    const service = await prisma.service.findFirst({
      where: {
        id: formData.serviceId,
        status: true,
      },
    });

    if (!service) {
      return {
        error: "Serviço não encontrado ou inativo",
      };
    }

    // Verificar se a clínica existe e está ativa
    const clinic = await prisma.user.findFirst({
      where: {
        id: formData.clinicId,
        status: true,
      },
    });

    if (!clinic) {
      return {
        error: "Clínica não encontrada ou inativa",
      };
    }

    const selectedDate = new Date(formData.date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const appointmentDate = new Date(year, month, day, 0, 0, 0, 0);

    // Verificar se já existe agendamento no mesmo horário
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: formData.clinicId,
        appointmentDate: appointmentDate,
        time: formData.time,
      },
    });

    if (existingAppointment) {
      return {
        error: "Este horário já está ocupado",
      };
    }

    // Verificar se a data não é no passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return {
        error: "Não é possível agendar para datas passadas",
      };
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        serviceId: formData.serviceId,
        time: formData.time,
        userId: formData.clinicId,
        appointmentDate,
      },
    });

    return {
      data: newAppointment,
    };
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);

    // Tratamento específico para diferentes tipos de erro
    if (err instanceof Error) {
      // Erro de violação de constraint do banco
      if (err.message.includes("Unique constraint")) {
        return {
          error: "Já existe um agendamento para este horário",
        };
      }

      // Erro de foreign key
      if (err.message.includes("Foreign key constraint")) {
        return {
          error: "Dados inválidos fornecidos",
        };
      }
    }

    return {
      error: "Erro interno do servidor. Tente novamente mais tarde.",
    };
  }
}
