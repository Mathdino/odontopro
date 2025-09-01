"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { DialogService } from "./dialog-service";
import { ServiceImage } from "./service-image";
import { Service } from "@/generated/prisma";
import { formatCurrency } from "@/utils/formatCurrency";
import { deleteService } from "../_actions/delete-service";
import { toast } from "sonner";
import { getAllCategories } from "../_data-access/get-all-categories";
import { useEffect } from "react";

// Tipo para Service com Category
type ServiceWithCategory = Service & {
  category: {
    id: string;
    name: string;
    order: number;
  } | null;
};

interface ServiceListProps {
  services: ServiceWithCategory[];
  userId: string;
}

// Função para formatar duração em minutos para horas e minutos
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

export function ServicesList({ services, userId }: ServiceListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<null | ServiceWithCategory>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Carregar categorias para o dialog
  useEffect(() => {
    async function loadCategories() {
      const result = await getAllCategories({ userId });
      if (result.data) {
        setCategories(result.data);
      }
    }
    loadCategories();
  }, [userId]);

  // Agrupar serviços por categoria
  const servicesByCategory = useMemo(() => {
    const grouped = new Map<
      string,
      {
        category: { id: string; name: string; order: number } | null;
        services: ServiceWithCategory[];
      }
    >();

    services.forEach((service) => {
      const categoryKey = service.category?.id || "no-category";

      if (!grouped.has(categoryKey)) {
        grouped.set(categoryKey, {
          category: service.category,
          services: [],
        });
      }

      grouped.get(categoryKey)!.services.push(service);
    });

    // Converter para array e ordenar por ordem da categoria
    return Array.from(grouped.values()).sort((a, b) => {
      if (!a.category && !b.category) return 0;
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.category.order - b.category.order;
    });
  }, [services]);

  async function handleDeleteService(serviceId: string) {
    const response = await deleteService({
      serviceId,
    });
    if (response.error) {
      toast(response.error);
      return;
    }
    toast.success(response.data);
  }

  function handleEditService(service: ServiceWithCategory) {
    setEditingService(service);
    setIsDialogOpen(true);
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <section className="mx-auto">
        <Card>
          <CardHeader className="flex justify-between items-center space-y-0 pb-2">
            <CardTitle className="text-xl md:text-2xl font-bold">
              Serviços
            </CardTitle>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[90vh] overflow-y-auto"
              onInteractOutside={(e) => {
                e.preventDefault();
                setIsDialogOpen(false);
                setEditingService(null);
              }}
            >
              <DialogService
                closeModal={() => {
                  setIsDialogOpen(false);
                  setEditingService(null);
                }}
                categories={categories}
                serviceId={editingService ? editingService.id : undefined}
                initialValues={
                  editingService
                    ? {
                        name: editingService.name,
                        description: editingService.description || "",
                        categoryId: editingService.categoryId || "",
                        image: editingService.image || "",
                        price: (editingService.price / 100)
                          .toFixed(2)
                          .replace(".", ","),
                        hours: Math.floor(
                          editingService.duration / 60
                        ).toString(),
                        minutes: (editingService.duration % 60).toString(),
                      }
                    : undefined
                }
              />
            </DialogContent>
          </CardHeader>

          <CardContent>
            <div className="space-y-6 mt-5">
              {servicesByCategory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado
                </div>
              ) : (
                servicesByCategory.map((group) => (
                  <div
                    key={group.category?.id || "no-category"}
                    className="space-y-4"
                  >
                    {/* Título da Categoria */}
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {group.category?.name || "Sem Categoria"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {group.services.length}{" "}
                        {group.services.length === 1 ? "serviço" : "serviços"}
                      </p>
                    </div>

                    {/* Lista de Serviços da Categoria */}
                    <div className="space-y-3">
                      {group.services.map((service) => (
                        <article
                          key={service.id}
                          className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <ServiceImage
                              src={service.image}
                              alt={`Imagem do serviço ${service.name}`}
                              width={60}
                              height={60}
                              className="flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-lg">
                                {service.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {formatCurrency(service.price / 100)}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  {formatDuration(service.duration)}
                                </span>
                              </div>
                              {service.description && (
                                <span className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {service.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => {
                                handleEditService(service);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              className="bg-red-500 hover:bg-red-400"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                handleDeleteService(service.id);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </Dialog>
  );
}
