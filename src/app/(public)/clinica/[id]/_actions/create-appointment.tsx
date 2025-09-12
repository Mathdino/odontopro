"use server";

import z, { date } from "zod";
import prisma from "@/lib/prisma";

// Schema for creating multiple services in one appointment
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Pelo menos um serviço é obrigatório"),
  clinicId: z.string().min(1, "Clínica é obrigatória"),
  date: z.date(),
  time: z.string().min(1, "Horário é obrigatório"),
  professionalId: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

// Updated function to handle multiple services in one appointment
export async function createNewAppointment(formData: FormSchema) {
  const schema = formSchema.safeParse(formData);

  if (!schema.success) {
    return {
      error: schema.error.issues[0].message,
    };
  }

  try {
    // Verificar se os serviços existem e estão ativos
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: formData.serviceIds,
        },
        status: true,
      },
    });

    if (services.length !== formData.serviceIds.length) {
      return {
        error: "Um ou mais serviços não foram encontrados ou estão inativos",
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

    // Verificar se a clínica funciona no dia da semana selecionado
    const dayOfWeek = formData.date.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const selectedDayName = dayNames[dayOfWeek];

    const workingDays = clinic.workingDays || [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];

    if (!workingDays.includes(selectedDayName)) {
      return {
        error: "A clínica não funciona neste dia da semana",
      };
    }

    const selectedDate = new Date(formData.date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const appointmentDate = new Date(year, month, day, 0, 0, 0, 0);

    // Verificar se já existe agendamento no mesmo horário para o mesmo profissional
    // Considerando a duração total dos serviços
    const timeSlots = clinic.times || [];
    const startIndex = timeSlots.indexOf(formData.time);
    
    if (startIndex === -1) {
      return {
        error: "Horário inválido",
      };
    }
    
    // Calculate total duration and price for all services
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    
    // Calcular quantos slots de 30 minutos os serviços ocupam
    const slotsToCheck = Math.ceil(totalDuration / 30);
    
    // Verificar se há conflitos com agendamentos existentes
    // @ts-ignore - Prisma types might not be updated yet
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        userId: formData.clinicId,
        appointmentDate: appointmentDate,
        professionalId: formData.professionalId || null,
      },
      include: {
        // @ts-ignore - Prisma types might not be updated yet
        appointmentServices: {
          include: {
            service: true,
          },
        },
        service: true,
      }
    });
    
    // Verificar se algum agendamento existente conflita com o novo
    let hasConflict = false;
    for (const appointment of conflictingAppointments) {
      const aptStartIndex = timeSlots.indexOf(appointment.time);
      if (aptStartIndex === -1) continue;
      
      // Calculate total duration for existing appointment
      let aptTotalDuration = (appointment as any).totalDuration;
      if (!aptTotalDuration) {
        // Fallback to calculating from appointmentServices or single service
        if ((appointment as any).appointmentServices && (appointment as any).appointmentServices.length > 0) {
          aptTotalDuration = (appointment as any).appointmentServices.reduce(
            (sum: number, as: any) => sum + as.service.duration,
            0
          );
        } else {
          // @ts-ignore - Prisma types might not be updated yet
          aptTotalDuration = appointment.service.duration;
        }
      }
      
      // Calcular quantos slots o agendamento existente ocupa
      const aptSlots = Math.ceil(aptTotalDuration / 30);
      
      // Verificar se há sobreposição
      const aptEndIndex = aptStartIndex + aptSlots - 1;
      const newEndIndex = startIndex + slotsToCheck - 1;
      
      // Se há interseção entre os intervalos
      if (startIndex <= aptEndIndex && newEndIndex >= aptStartIndex) {
        hasConflict = true;
        break;
      }
    }
    
    if (hasConflict) {
      return {
        error: "Já existe um agendamento para este horário e profissional",
      };
    }

    // Criar o novo agendamento:
    // @ts-ignore - Prisma types might not be updated yet
    const newAppointment = await prisma.appointment.create({
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        // Use the first service as the main service for backward compatibility
        serviceId: formData.serviceIds[0],
        time: formData.time,
        userId: formData.clinicId,
        professionalId: formData.professionalId || null,
        appointmentDate,
        // @ts-ignore - Prisma types might not be updated yet
        totalPrice,
        // @ts-ignore - Prisma types might not be updated yet
        totalDuration,
      },
    });

    // Create the AppointmentService relationships for all services
    // @ts-ignore - Prisma types might not be updated yet
    const appointmentServices = await Promise.all(
      formData.serviceIds.map(serviceId =>
        prisma.appointmentService.create({
          data: {
            appointmentId: newAppointment.id,
            serviceId: serviceId,
          },
        })
      )
    );

    return {
      data: {
        ...newAppointment,
        appointmentServices,
      },
    };
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);

    // Tratamento específico para diferentes tipos de erro
    if (err instanceof Error) {
      // Erro de violação de constraint do banco
      if (err.message.includes("Unique constraint") || err.message.includes("P2002")) {
        console.error("Unique constraint violation:", err.message);
        return {
          error: "Já existe um agendamento para este horário e profissional",
        };
      }

      // Erro de foreign key
      if (err.message.includes("Foreign key constraint")) {
        console.error("Foreign key constraint error:", err.message);
        return {
          error: "Dados inválidos fornecidos",
        };
      }
      
      // Handle other Prisma errors
      console.error("Database error:", err.message);
      return {
        error: `Erro de banco de dados: ${err.message}`,
      };
    }

    console.error("Unexpected error:", err);
    return {
      error: "Erro interno do servidor. Tente novamente mais tarde.",
    };
  }
}