import prisma from "@/lib/prisma";
import { createNewAppointment } from "@/app/(public)/clinica/[id]/_actions/create-appointment";

// Função para testar a criação de agendamentos
export async function testAppointmentCreation() {
  try {
    // 1. Buscar uma clínica ativa para teste
    const clinic = await prisma.user.findFirst({
      where: { status: true },
      include: { services: true }
    });

    if (!clinic || clinic.services.length === 0) {
      console.log("❌ Nenhuma clínica ativa com serviços encontrada");
      return;
    }

    console.log(`✅ Clínica encontrada: ${clinic.name}`);

    // 2. Contar agendamentos antes da criação
    const appointmentsBefore = await prisma.appointment.count({
      where: { userId: clinic.id }
    });
    console.log(`📊 Agendamentos antes: ${appointmentsBefore}`);

    // 3. Criar um agendamento de teste
    const testData = {
      name: "Teste Database",
      email: "teste@database.com",
      phone: "(11) 99999-9999",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      serviceId: clinic.services[0].id,
      clinicId: clinic.id,
      time: "10:00"
    };

    const result = await createNewAppointment(testData);

    if (result.error) {
      console.log(`❌ Erro ao criar agendamento: ${result.error}`);
      return;
    }

    console.log(`✅ Agendamento criado com sucesso!`);
    console.log(`📝 ID do agendamento: ${result.data?.id}`);

    // 4. Verificar se foi salvo no banco
    const appointmentsAfter = await prisma.appointment.count({
      where: { userId: clinic.id }
    });
    console.log(`📊 Agendamentos depois: ${appointmentsAfter}`);

    // 5. Buscar o agendamento específico
    const createdAppointment = await prisma.appointment.findUnique({
      where: { id: result.data?.id },
      include: { service: true, user: true }
    });

    if (createdAppointment) {
      console.log(`✅ Agendamento confirmado no banco:`);
      console.log(`   - Nome: ${createdAppointment.name}`);
      console.log(`   - Email: ${createdAppointment.email}`);
      console.log(`   - Serviço: ${createdAppointment.service.name}`);
      console.log(`   - Data: ${createdAppointment.appointmentDate.