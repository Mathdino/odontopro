"use client";

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
import { Check, Eye, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelAppointment, cancelMultipleAppointments } from "../../_actions/cancel-appointment";
import { confirmAppointment, confirmMultipleAppointments } from "../../_actions/confirm-appointment";
import { toast } from "sonner";

type AppointmentWithService = Prisma.AppointmentGetPayload<{
  include: {
    service: true;
    professional: true;
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

  const occupantMap: Record<string, AppointmentWithService[]> = {};
  const clientGroupMap: Record<string, AppointmentWithService[]> = {};

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
    Object.values(clientGroupMap).forEach(clientAppointments => {
      // Use the first appointment to determine time slots
      const primaryAppointment = clientAppointments[0];
      const totalDuration = clientAppointments.reduce((sum, apt) => sum + apt.service.duration, 0);
      const requiredSlots = Math.ceil(totalDuration / 30);

      const startIndex = times.indexOf(primaryAppointment.time);

      if (startIndex !== -1) {
        for (let i = 0; i < requiredSlots; i++) {
          const slotIndex = startIndex + i;

          if (slotIndex < times.length) {
            const timeSlot = times[slotIndex];
            if (!occupantMap[timeSlot]) {
              occupantMap[timeSlot] = [];
            }
            // Only add to the first slot to avoid duplicates
            if (i === 0) {
              occupantMap[timeSlot].push(...clientAppointments);
            }
          }
        }
      }
    });
  }

  async function handleCancelAppointement(appointmentId: string) {
    // Find all appointments for the same client group
    const appointmentToCancel = data?.find(apt => apt.id === appointmentId);
    if (!appointmentToCancel) return;

    const clientKey = `${appointmentToCancel.name}-${appointmentToCancel.phone}-${appointmentToCancel.time}`;
    const clientAppointments = data?.filter(apt => 
      `${apt.name}-${apt.phone}-${apt.time}` === clientKey
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
          window.open(response.whatsappUrl, '_blank');
        }
      } else {
        // Multiple appointments - use new function
        const appointmentIds = clientAppointments.map(apt => apt.id);
        const response = await cancelMultipleAppointments({ appointmentIds });
        
        if (response.error) {
          toast.error(response.error);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["get-appointments"] });
        await refetch();
        toast.success(response.data);

        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, '_blank');
        }
      }
    } catch (error) {
      toast.error("Erro inesperado ao cancelar agendamentos");
    }
  }

  async function handleConfirmAppointment(appointmentId: string) {
    // Find all appointments for the same client group
    const appointmentToConfirm = data?.find(apt => apt.id === appointmentId);
    if (!appointmentToConfirm) return;

    const clientKey = `${appointmentToConfirm.name}-${appointmentToConfirm.phone}-${appointmentToConfirm.time}`;
    const clientAppointments = data?.filter(apt => 
      `${apt.name}-${apt.phone}-${apt.time}` === clientKey
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
          window.open(response.whatsappUrl, '_blank');
        }
      } else {
        // Multiple appointments - use new function
        const appointmentIds = clientAppointments.map(apt => apt.id);
        const response = await confirmMultipleAppointments({ appointmentIds });
        
        if (response.error) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);

        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, '_blank');
        }
      }
    } catch (error) {
      toast.error("Erro inesperado ao confirmar agendamentos");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl md:text-2xl font-bold">
          Agendamentos
        </CardTitle>

        <button>DATA</button>
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
                    <div className="w-16 text-sm font-semibold py-2">{slot}</div>
                    {(() => {
                      // Group appointments by client (name + phone + time)
                      const clientGroups: Record<string, AppointmentWithService[]> = {};
                      
                      occupants.forEach(occupant => {
                        if (occupant.time === slot) { // Only show appointments that start at this time slot
                          const clientKey = `${occupant.name}-${occupant.phone}-${occupant.time}`;
                          if (!clientGroups[clientKey]) {
                            clientGroups[clientKey] = [];
                          }
                          clientGroups[clientKey].push(occupant);
                        }
                      });

                      return Object.values(clientGroups).map((clientAppointments) => {
                        const primaryAppointment = clientAppointments[0];
                        const allServices = clientAppointments.map(apt => apt.service.name);
                        const servicesText = allServices.length > 1 
                          ? allServices.join(' + ')
                          : allServices[0];
                        
                        return (
                          <div
                            key={primaryAppointment.id}
                            className="flex justify-between border border-gray-300 bg-gray-100 py-4 px-4 mb-2 last:mb-0 items-center"
                          >
                            <div className="flex-1 text-sm">
                              <div className="font-semibold mb-3">{primaryAppointment.name}</div>
                              <div className="text-sm text-gray-600 mb-1">
                                <strong>Telefone:</strong> 
                                {primaryAppointment.phone || 'Não informado'}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                <strong>Profissional:</strong> {primaryAppointment.professional?.name || 'Não informado'}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                <strong>{clientAppointments.length > 1 ? 'Serviços' : 'Serviço'}:</strong> {servicesText}
                              </div>
                              <div className="text-sm text-gray-600">
                                <strong>Horário:</strong> {primaryAppointment.time}
                              </div>
                            </div>

                            <div className="ml-auto">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                  <Eye className="w-4 h-4" />
                                </Button>

                                <Button
                                  className="bg-emerald-500 text-white hover:bg-emerald-400"
                                  onClick={() => handleConfirmAppointment(primaryAppointment.id)}
                                  size="icon"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>

                                <Button
                                  className="bg-red-500 text-white hover:bg-red-400"
                                  onClick={() => handleCancelAppointement(primaryAppointment.id)}
                                  size="icon"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      });
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
                  <div className="flex-1 text-sm text-gray-500">Disponível</div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
