"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

const formSchema = z.object({
  appointmentId: z.string().min(1, "Você precisa fornecer um agendamento"),
});

const multipleFormSchema = z.object({
  appointmentIds: z.array(z.string()).min(1, "Você precisa fornecer pelo menos um agendamento"),
});

type FormSchema = z.infer<typeof formSchema>;
type MultipleFormSchema = z.infer<typeof multipleFormSchema>;

export async function cancelMultipleAppointments(formData: MultipleFormSchema) {
  const schema = multipleFormSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0]?.message,
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado",
    };
  }

  try {
    // Get all appointment details before deleting
    const appointments = await prisma.appointment.findMany({
      where: {
        id: { in: formData.appointmentIds },
        userId: session.user?.id,
      },
      include: {
        service: true,
        professional: true,
      },
    });

    if (appointments.length === 0) {
      return {
        error: "Nenhum agendamento encontrado",
      };
    }

    // Get the clinic's cancellation message
    const whatsappMessage = await prisma.whatsappMessage.findUnique({
      where: { userId: session.user.id },
    });

    let whatsappUrl = null;
    let personalizedMessage = null;

    if (whatsappMessage?.cancellationMessage) {
      // Use the first appointment for client details
      const primaryAppointment = appointments[0];
      
      // Build services list and calculate total value
      const servicesList = appointments.map(apt => apt.service.name).join(', ');
      const totalValue = appointments.reduce((sum, apt) => sum + apt.service.price, 0);

      // Replace placeholders in the message
      personalizedMessage = whatsappMessage.cancellationMessage
        .replace(/\[Nome-cliente\]/g, primaryAppointment.name)
        .replace(/\[servico\]/g, servicesList)
        .replace(/\[profissional\]/g, primaryAppointment.professional?.name || 'Não informado')
        .replace(/\[data\]/g, new Date(primaryAppointment.appointmentDate).toLocaleDateString('pt-BR'))
        .replace(/\[hora\]/g, primaryAppointment.time)
        .replace(/\[valor\]/g, (totalValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

      // Format phone number for WhatsApp
      const phoneNumber = primaryAppointment.phone.replace(/\D/g, '');
      const formattedPhone = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
      
      // Create WhatsApp URL
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`;
    }

    // Delete all appointments
    await prisma.appointment.deleteMany({
      where: {
        id: { in: formData.appointmentIds },
        userId: session.user?.id,
      },
    });
    
    revalidatePath("/dashboard");

    return {
      data: `${appointments.length} agendamento(s) cancelado(s) com sucesso!`,
      whatsappUrl,
      message: personalizedMessage,
    };
  } catch (err) {
    return {
      error: "Erro ao cancelar agendamentos",
    };
  }
}

export async function cancelAppointment(formData: FormSchema) {
  const schema = formSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0]?.message,
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado",
    };
  }

  try {
    // Get the appointment details before deleting
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: formData.appointmentId,
        userId: session.user?.id,
      },
      include: {
        service: true,
        professional: true,
      },
    });

    if (!appointment) {
      return {
        error: "Agendamento não encontrado",
      };
    }

    // Get the clinic's cancellation message
    const whatsappMessage = await prisma.whatsappMessage.findUnique({
      where: { userId: session.user.id },
    });

    let whatsappUrl = null;
    let personalizedMessage = null;

    if (whatsappMessage?.cancellationMessage) {
      // Replace placeholders in the message
      personalizedMessage = whatsappMessage.cancellationMessage
        .replace(/\[Nome-cliente\]/g, appointment.name)
        .replace(/\[servico\]/g, appointment.service.name)
        .replace(/\[profissional\]/g, appointment.professional?.name || 'Não informado')
        .replace(/\[data\]/g, new Date(appointment.appointmentDate).toLocaleDateString('pt-BR'))
        .replace(/\[hora\]/g, appointment.time)
        .replace(/\[valor\]/g, (appointment.service.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

      // Format phone number for WhatsApp
      const phoneNumber = appointment.phone.replace(/\D/g, '');
      const formattedPhone = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
      
      // Create WhatsApp URL
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`;
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: {
        id: formData.appointmentId,
        userId: session.user?.id,
      },
    });
    
    revalidatePath("/dashboard");

    return {
      data: "Agendamento cancelado com sucesso !",
      whatsappUrl,
      message: personalizedMessage,
    };
  } catch (err) {
    return {
      error: "Erro ao cancelar agendamento",
    };
  }
}
