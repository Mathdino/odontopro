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
      errors: schema.error.issues[0].message,
    };
  }

  try {
    const selectedDate = new Date(formData.date);

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();

    const appointmentDate = new Date(year, month, day, 0, 0, 0, 0);

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
    return {
      errors: "Erro ao cadastrar agendamento",
    };
  }
}
