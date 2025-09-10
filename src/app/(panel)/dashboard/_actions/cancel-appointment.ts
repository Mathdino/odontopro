"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

const formSchema = z.object({
  appointmentId: z.string().min(1, "Você precisa fornecer um agendamento"),
});

type FormSchema = z.infer<typeof formSchema>;

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
