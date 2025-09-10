"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const appointmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  date: z.date(),
  serviceIds: z.array(z.string()).min(1, "Pelo menos um serviço é obrigatório"),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function useAppointmentForm() {
  return useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceIds: [],
      date: new Date(),
    },
  });
}
