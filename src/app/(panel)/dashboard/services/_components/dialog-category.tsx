"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCategory, updateCategory } from "../_actions/category-actions";
import { toast } from "sonner";

const categorySchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  order: z.number().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DialogCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess: () => void;
}

export function DialogCategory({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DialogCategoryProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      order: 0,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        order: category.order,
      });
    } else {
      form.reset({
        name: "",
        order: 0,
      });
    }
  }, [category, form]);

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);
    console.log("Dados do formulário:", data);
    try {
      let result;

      if (isEditing && category) {
        result = await updateCategory({
          categoryId: category.id,
          name: data.name,
          order: data.order,
        });
      } else {
        result = await createCategory({
          name: data.name,
          order: data.order,
        });
      }

      console.log("Resultado da ação:", result);

      if (result.data) {
        toast.success(
          isEditing
            ? "Categoria atualizada com sucesso!"
            : "Categoria criada com sucesso!"
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      console.error("Erro no componente:", error);
      toast.error("Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite as informações da categoria."
              : "Crie uma nova categoria para organizar seus serviços."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Promoções, Limpeza, Estética..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : Number(value)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
