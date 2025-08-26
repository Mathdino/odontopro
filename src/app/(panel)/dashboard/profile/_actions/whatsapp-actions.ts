"use server";

import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

interface WhatsappMessageData {
  confirmationMessage: string;
  cancellationMessage: string;
}

export async function getWhatsappMessages() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Usuário não autenticado" };
    }

    const whatsappMessage = await prisma.whatsappMessage.findUnique({
      where: { userId: session.user.id },
    });

    return { data: whatsappMessage };
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return { error: "Erro ao buscar mensagens" };
  }
}

export async function updateWhatsappMessages(data: WhatsappMessageData) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Usuário não autenticado" };
    }

    const whatsappMessage = await prisma.whatsappMessage.upsert({
      where: { userId: session.user.id },
      update: {
        confirmationMessage: data.confirmationMessage,
        cancellationMessage: data.cancellationMessage,
      },
      create: {
        userId: session.user.id,
        confirmationMessage: data.confirmationMessage,
        cancellationMessage: data.cancellationMessage,
      },
    });

    return { data: whatsappMessage };
  } catch (error) {
    console.error("Erro ao salvar mensagens:", error);
    return { error: "Erro ao salvar mensagens" };
  }
}
