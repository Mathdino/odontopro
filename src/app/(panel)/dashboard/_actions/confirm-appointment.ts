"use server";

import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

interface ConfirmAppointmentParams {
  appointmentId: string;
}

interface ConfirmMultipleAppointmentsParams {
  appointmentIds: string[];
}

export async function confirmMultipleAppointments({ appointmentIds }: ConfirmMultipleAppointmentsParams) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Usuário não autenticado" };
    }

    // Get all appointment details
    const appointments = await prisma.appointment.findMany({
      where: { 
        id: { in: appointmentIds },
        userId: session.user.id 
      },
      include: {
        service: true,
        user: true,
        professional: true,
      },
    });

    if (appointments.length === 0) {
      return { error: "Nenhum agendamento encontrado" };
    }

    // Update appointments status to CONFIRMED
    await prisma.appointment.updateMany({
      where: {
        id: { in: appointmentIds },
        userId: session.user.id,
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // Get the clinic's confirmation message
    const whatsappMessage = await prisma.whatsappMessage.findUnique({
      where: { userId: session.user.id },
    });

    if (!whatsappMessage?.confirmationMessage) {
      return { error: "Mensagem de confirmação não cadastrada. Configure nas configurações do perfil." };
    }

    // Use the first appointment for client details
    const primaryAppointment = appointments[0];
    
    // Build services list and calculate total value
    const servicesList = appointments.map(apt => apt.service.name).join(', ');
    const totalValue = appointments.reduce((sum, apt) => sum + apt.service.price, 0);

    // Replace placeholders in the message
    const personalizedMessage = whatsappMessage.confirmationMessage
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
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`;

    return { 
      data: "Agendamentos confirmados com sucesso",
      whatsappUrl,
      message: personalizedMessage
    };

  } catch (error) {
    console.error("Erro ao confirmar agendamentos:", error);
    return { error: "Erro ao confirmar agendamentos" };
  }
}

export async function confirmAppointment({ appointmentId }: ConfirmAppointmentParams) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Usuário não autenticado" };
    }

    // Get the appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
        user: true,
        professional: true,
      },
    });

    if (!appointment) {
      return { error: "Agendamento não encontrado" };
    }

    // Check if the appointment belongs to the authenticated user
    if (appointment.userId !== session.user.id) {
      return { error: "Não autorizado a confirmar este agendamento" };
    }

    // Update appointment status to CONFIRMED
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // Get the clinic's confirmation message
    const whatsappMessage = await prisma.whatsappMessage.findUnique({
      where: { userId: session.user.id },
    });

    if (!whatsappMessage?.confirmationMessage) {
      return { error: "Mensagem de confirmação não cadastrada. Configure nas configurações do perfil." };
    }

    // Replace placeholders in the message
    const personalizedMessage = whatsappMessage.confirmationMessage
      .replace(/\[Nome-cliente\]/g, appointment.name)
      .replace(/\[servico\]/g, appointment.service.name)
      .replace(/\[profissional\]/g, appointment.professional?.name || 'Não informado')
      .replace(/\[data\]/g, new Date(appointment.appointmentDate).toLocaleDateString('pt-BR'))
      .replace(/\[hora\]/g, appointment.time)
      .replace(/\[valor\]/g, (appointment.service.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    // Format phone number for WhatsApp (remove special characters and add country code if needed)
    const phoneNumber = appointment.phone.replace(/\D/g, '');
    const formattedPhone = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`;

    // Open WhatsApp in a new window (this will be handled on the client side)
    return { 
      data: "Agendamento confirmado com sucesso",
      whatsappUrl,
      message: personalizedMessage
    };

  } catch (error) {
    console.error("Erro ao confirmar agendamento:", error);
    return { error: "Erro ao confirmar agendamento" };
  }
}