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
import { cancelAppointment } from "../../_actions/cancel-appointment";
import { toast } from "sonner";

type AppointmentWithService = Prisma.AppointmentGetPayload<{
  include: {
    service: true;
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

  if (data && data.length > 0) {
    for (const appointment of data) {
      const requiredSlots = Math.ceil(appointment.service.duration / 30);

      const startIndex = times.indexOf(appointment.time);

      if (startIndex !== -1) {
        for (let i = 0; i < requiredSlots; i++) {
          const slotIndex = startIndex + i;

          if (slotIndex < times.length) {
            occupantMap[times[slotIndex]] = appointment;
          }
        }
      }
    }
  }

  async function handleCancelAppointement(appointmentId: string) {
    const response = await cancelAppointment({
      appointmentId,
    });

    if (response.error) {
      toast.error(response.error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["get-appointments"] });
    await refetch();
    toast.success(response.data);
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
              const occupant = occupantMap[slot];

              if (occupant) {
                return (
                  <div
                    key={slot}
                    className="flex items-center py-2 border-t last:border-b"
                  >
                    <div className="w-16 text-sm font-semibold">{slot}</div>
                    <div className="flex justify-between border border-gray-300 bg-gray-100 py-4 px-4 w-full">
                    <div className="flex-1 text-sm">
                      <div className="font-semibold mb-1">{occupant.name}</div>
                      <div className="text-sm flex items-center text-gray-500">
                        <Phone className="w-4 h-4 mr-2" />
                        {occupant.phone}
                      </div>
                    </div>

                    <div className="ml-auto">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          className="bg-emerald-500 text-white hover:bg-emerald-400"
                          size="icon"
                        >
                          <Check className="w-4 h-4" />
                        </Button>

                        <Button
                          className="bg-red-500 text-white hover:bg-red-400"
                          onClick={() => handleCancelAppointement(occupant.id)}
                          size="icon"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    </div>
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
