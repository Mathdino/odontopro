"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface UseProfileFormProps {
  name: string | null;
  address: string | null;
  phone: string | null;
  status: boolean;
  timeZone: string | null;
  headerColor: string | null;
  pix: string | null;
}

const profileSchema = z.object({
  name: z.string().min(1, { message: "O Nome é Obrigatório" }),
  address: z.string().optional(),
  phone: z.string().optional(),
  pix: z.string().optional(),
  status: z.string(),
  timeZone: z.string().min(1, { message: "O Fuso Horário é Obrigatório" }),
  headerColor: z
    .string()
    .min(1, { message: "A cor do cabeçalho é obrigatória" }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export function useProfileForm({
  name,
  address,
  phone,
  status,
  timeZone,
  headerColor,
  pix,
}: UseProfileFormProps) {
  return useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: name || "",
      address: address || "",
      phone: phone || "",
      pix: pix || "",
      status: status ? "active" : "inactive",
      timeZone: timeZone || "",
      headerColor: headerColor || "bg-emerald-500",
    },
  });
}
