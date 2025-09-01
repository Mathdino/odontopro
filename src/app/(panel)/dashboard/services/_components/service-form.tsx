"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome do serviço é obrigatório" }),
  description: z.string().optional(),
  categoryId: z.string().min(1, { message: "Categoria é obrigatória" }),
  image: z.any().optional(),
  price: z.string().min(1, { message: "Preço do serviço é obrigatório" }),
  hours: z.string(),
  minutes: z.string(),
});

export interface UseDialogServiceFormProps {
  initialValues?: {
    name: string;
    description?: string;
    categoryId?: string;
    image?: string;
    price: string;
    hours: string;
    minutes: string;
  };
}

export type DialogServiceFormData = z.infer<typeof formSchema>;

export function useDialogServiceForm({
  initialValues,
}: UseDialogServiceFormProps) {
  return useForm<DialogServiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      name: "",
      description: "",
      categoryId: "",
      image: "",
      price: "",
      hours: "",
      minutes: "",
    },
  });
}
