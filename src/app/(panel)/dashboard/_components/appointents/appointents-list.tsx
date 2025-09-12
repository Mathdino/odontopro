"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Prisma } from "@prisma/client";
import { Check, PackagePlus, X, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancelAppointment,
  cancelMultipleAppointments,
} from "../../_actions/cancel-appointment";
import {
  confirmAppointment,
  confirmMultipleAppointments,
} from "../../_actions/confirm-appointment";
import { toast } from "sonner";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DialogAppointment } from "./dialog-appointment";
import { ButtonDate } from "./button-date";

export type AppointmentWithService = Prisma.AppointmentGetPayload<{
  include: {
    service: true;
    professional: true;
    // @ts-ignore - Prisma types might not be updated yet
    appointmentServices: {
      include: {
        service: true;
      };
    };
    appointmentProducts: {
      include: {
        product: true;
      };
    };
  };
}>;

interface AppointentsListProps {
  times: string[];
}

export function AppointentsList({ times }: AppointentsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] =
    useState<AppointmentWithService | null>(null);

  // Function to get status indicator
  const getStatusIndicator = (appointment: AppointmentWithService) => {
    switch (appointment.status) {
      case "CONFIRMED":
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Confirmado</span>
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pendente</span>
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-1 text-red-600">
            <X className="w-4 h-4" />
            <span className="text-xs font-medium">Cancelado</span>
          </div>
        );
      case "COMPLETED":
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Concluído</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Indefinido</span>
          </div>
        );
    }
  };

  // Fetch appointments
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["get-appointments", date],
    queryFn: async () => {
      let activeDate = date;

      if (!activeDate) {
        const today = format(new Date(), "yyyy-MM-dd");
        activeDate = today;
      }

      const url = `${process.env.NEXT_PUBLIC_URL}/api/clinic/appointments?date=${activeDate}`;

      const response = await fetch(url);

      const json = (await response.json()) as AppointmentWithService[];

      if (!response.ok) {
        return [];
      }
      return json;
    },

    staleTime: 20000,
    refetchInterval: 25000,
  });

  // Fetch professionals
  const { data: professionalsData, isLoading: professionalsLoading } = useQuery({
    queryKey: ["get-professionals"],
    queryFn: async () => {
      const response = await fetch("/api/financeiro/professionals");
      const json = (await response.json());
      
      if (!response.ok) {
        return [];
      }
      return json;
    },
    staleTime: 60000,
  });

  // Create a map of occupied slots by professional
  const professionalOccupancyMap: Record<string, Set<string>> = {};
  const occupantMap: Record<string, AppointmentWithService[]> = {};
  const clientGroupMap: Record<string, AppointmentWithService[]> = {};

  // Initialize professional occupancy map
  if (professionalsData && professionalsData.length > 0) {
    professionalsData.forEach((professional: any) => {
      professionalOccupancyMap[professional.id] = new Set<string>();
    });
  }

  if (data && data.length > 0) {
    // First, group appointments by client (name + phone + time)
    for (const appointment of data) {
      const clientKey = `${appointment.name}-${appointment.phone}-${appointment.time}`;
      if (!clientGroupMap[clientKey]) {
        clientGroupMap[clientKey] = [];
      }
      clientGroupMap[clientKey].push(appointment);
    }

    // Then, process each client group for time slot mapping
    Object.values(clientGroupMap).forEach((clientAppointments) => {
      // Use the first appointment to determine time slots
      const primaryAppointment = clientAppointments[0];
      // Calculate total duration from all services in the appointment
      const totalDuration = clientAppointments.reduce(
        (sum, apt) => {
          // Check if appointment has appointmentServices relation
          if ((apt as any).appointmentServices && (apt as any).appointmentServices.length > 0) {
            // Sum duration from all services in appointmentServices
            return sum + (apt as any).appointmentServices.reduce(
              (serviceSum: number, as: any) => serviceSum + as.service.duration,
              0
            );
          }
          // Fallback to totalDuration or single service duration
          return sum + (apt as any).totalDuration || apt.service.duration;
        },
        0
      );
      const requiredSlots = Math.ceil(totalDuration / 30);

      const startIndex = times.indexOf(primaryAppointment.time);

      if (startIndex !== -1) {
        // Mark all slots as occupied for the professional
        for (let i = 0; i < requiredSlots; i++) {
          const slotIndex = startIndex + i;
          if (slotIndex < times.length) {
            const timeSlot = times[slotIndex];
          
            // Add appointment to occupantMap for the first slot only
            if (i === 0) {
              if (!occupantMap[timeSlot]) {
                occupantMap[timeSlot] = [];
              }
              occupantMap[timeSlot].push(...clientAppointments);
            }
            
            // Mark this slot as occupied by this professional (if available)
            if (primaryAppointment.professionalId && professionalOccupancyMap[primaryAppointment.professionalId]) {
              professionalOccupancyMap[primaryAppointment.professionalId].add(timeSlot);
            }
          }
        }
      }
    });
  }

  async function handleCancelAppointement(appointmentId: string) {
    // Find all appointments for the same client group
    const appointmentToCancel = data?.find((apt) => apt.id === appointmentId);
    if (!appointmentToCancel) return;

    const clientKey = `${appointmentToCancel.name}-${appointmentToCancel.phone}-${appointmentToCancel.time}`;
    const clientAppointments =
      data?.filter(
        (apt) => `${apt.name}-${apt.phone}-${apt.time}` === clientKey
      ) || [];

    // Use different functions based on number of appointments
    try {
      if (clientAppointments.length === 1) {
        // Single appointment - use original function
        const response = await cancelAppointment({ appointmentId });

        if (response.error) {
          toast.error(response.error);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["get-appointments"] });
        await refetch();
        toast.success(response.data);

        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, "_blank");
        }
      } else {
        // Multiple appointments - use new function
        const appointmentIds = clientAppointments.map((apt) => apt.id);
        const response = await cancelMultipleAppointments({ appointmentIds });

        if (response.error) {
          toast.error(response.error);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["get-appointments"] });
        await refetch();
        toast.success(response.data);

        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, "_blank");
        }
      }
    } catch (error) {
      toast.error("Erro inesperado ao cancelar agendamentos");
    }
  }

  async function handleConfirmAppointment(appointmentId: string) {
    // Find all appointments for the same client group
    const appointmentToConfirm = data?.find((apt) => apt.id === appointmentId);
    if (!appointmentToConfirm) return;

    const clientKey = `${appointmentToConfirm.name}-${appointmentToConfirm.phone}-${appointmentToConfirm.time}`;
    const clientAppointments =
      data?.filter(
        (apt) => `${apt.name}-${apt.phone}-${apt.time}` === clientKey
      ) || [];

    // Use different functions based on number of appointments
    try {
      if (clientAppointments.length === 1) {
        // Single appointment - use original function
        const response = await confirmAppointment({ appointmentId });

        if (response.error) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);

        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, "_blank");
        }
      } else {
        // Multiple appointments - use new function
        const appointmentIds = clientAppointments.map((apt) => apt.id);
        const response = await confirmMultipleAppointments({ appointmentIds });

        if (response.error) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);

        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, "_blank");
        }
      }
    } catch (error) {
      toast.error("Erro inesperado ao confirmar agendamentos");
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl md:text-2xl font-bold">
            Agendamentos
          </CardTitle>

          <ButtonDate />
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)] lg:h-[calc(100vh-15rem)] pr-4">
            {isLoading ? (
              <p>Carregando Agenda...</p>
            ) : (
              times.map((slot) => {
                const occupants = occupantMap[slot];

                if (occupants && occupants.length > 0) {
                  return (
                    <div key={slot} className="border-t last:border-b">
                      <div className="w-16 text-sm font-semibold py-2">
                        {slot}
                      </div>
                      {(() => {
                        // Group appointments by client (name + phone + time)
                        const clientGroups: Record<
                          string,
                          AppointmentWithService[]
                        > = {};

                        occupants.forEach((occupant: AppointmentWithService) => {
                          if (occupant.time === slot) {
                            // Only show appointments that start at this time slot
                            const clientKey = `${occupant.name}-${occupant.phone}-${occupant.time}`;
                            if (!clientGroups[clientKey]) {
                              clientGroups[clientKey] = [];
                            }
                            clientGroups[clientKey].push(occupant);
                          }
                        });

                        return Object.values(clientGroups).map(
                          (clientAppointments) => {
                            const primaryAppointment = clientAppointments[0];
                            
                            // Get all service names for this client
                            let allServices: string[] = [];
                            let totalDuration = 0;
                            let totalPrice = 0;
                            
                            // Process each appointment for this client
                            clientAppointments.forEach(apt => {
                              // Check if appointment has appointmentServices relation
                              if ((apt as any).appointmentServices && (apt as any).appointmentServices.length > 0) {
                                // Get services from appointmentServices
                                (apt as any).appointmentServices.forEach((as: any) => {
                                  allServices.push(as.service.name);
                                  totalDuration += as.service.duration;
                                  totalPrice += as.service.price;
                                });
                              } else {
                                // Fallback to single service
                                allServices.push(apt.service.name);
                                totalDuration += (apt as any).totalDuration || apt.service.duration;
                                totalPrice += (apt as any).totalPrice || apt.service.price;
                              }
                            });
                            
                            const servicesText =
                              allServices.length > 1
                                ? allServices.join(" + ")
                                : allServices[0];

                            return (
                              <div
                                key={primaryAppointment.id}
                                className="flex justify-between border border-gray-300 bg-gray-100 py-4 px-4 mb-2 last:mb-0 items-center"
                              >
                                <div className="flex-1 text-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold">
                                      {primaryAppointment.name}
                                    </div>
                                    {getStatusIndicator(primaryAppointment)}
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">
                                    <strong>Telefone:</strong>
                                    {primaryAppointment.phone ||
                                      "Não informado"}
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">
                                    <strong>Profissional:</strong>{" "}
                                    {primaryAppointment.professional?.name ||
                                      "Não informado"}
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">
                                    <strong>
                                      {allServices.length > 1
                                        ? "Serviços"
                                        : "Serviço"}
                                      :
                                    </strong>{" "}
                                    {servicesText}
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">
                                    <strong>Duração Total:</strong>{" "}
                                    {totalDuration} minutos
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">
                                    <strong>Valor Total:</strong>{" "}
                                    R$ {(totalPrice / 100).toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <strong>Horário:</strong>{" "}
                                    {(() => {
                                      // Calculate end time based on total duration
                                      const requiredSlots = Math.ceil(totalDuration / 30);
                                    
                                      if (requiredSlots > 1 && times.includes(primaryAppointment.time)) {
                                        const startIndex = times.indexOf(primaryAppointment.time);
                                        const endIndex = Math.min(
                                          startIndex + requiredSlots - 1,
                                          times.length - 1
                                        );
                                        const endTime = times[endIndex];
                                        return `${primaryAppointment.time} - ${endTime}`;
                                      }
                                      return primaryAppointment.time;
                                    })()}
                                  </div>
                                </div>

                                <div className="ml-auto">
                                  <div className="flex gap-2">
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setDetailAppointment(
                                            primaryAppointment
                                          );
                                        }}
                                      >
                                        <PackagePlus className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>

                                    <Button
                                      className="bg-emerald-500 text-white hover:bg-emerald-400"
                                      onClick={() =>
                                        handleConfirmAppointment(
                                          primaryAppointment.id
                                        )
                                      }
                                      size="icon"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      className="bg-red-500 text-white hover:bg-red-400"
                                      onClick={() =>
                                        handleCancelAppointement(
                                          primaryAppointment.id
                                        )
                                      }
                                      size="icon"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        );
                      })()}
                    </div>
                  );
                }

                return (
                  <div
                    key={slot}
                    className="flex items-center py-2 border-t last:border-b"
                  >
                    <div className="w-16 text-sm font-semibold">{slot}</div>
                    <div className="flex-1 text-sm">
                      {professionalsLoading ? (
                        <span className="text-gray-500">Carregando profissionais...</span>
                      ) : professionalsData && professionalsData.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {professionalsData.map((professional: any) => {
                            const isOccupied = professionalOccupancyMap[professional.id]?.has(slot);
                            return (
                              <span 
                                key={professional.id}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isOccupied 
                                    ? "bg-red-100 text-red-800" 
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {professional.name}
                                <span className="ml-1">
                                  {isOccupied ? "(Ocupado)" : "(Disponível)"}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-500">Nenhum profissional cadastrado</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <DialogAppointment appointment={detailAppointment} />
    </Dialog>
  );
}
