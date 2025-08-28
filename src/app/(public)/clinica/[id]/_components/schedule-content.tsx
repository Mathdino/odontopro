"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import imgTest from "../../../../../../public/foto1.png";
import { MapPin } from "lucide-react";
import { Prisma } from "../../../../../generated/prisma";
import { useAppointmentForm, AppointmentFormData } from "./schedule-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/utils/formatPhone";
import { DatePickerComponent } from "./date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleTimesLista } from "./schedule-times-list";
import { createNewAppointment } from "../_actions/create-appointment";
import { toast, ToastT } from "sonner";

type UserWithServiceAndSubscription = Prisma.UserGetPayload<{
  include: {
    services: true;
    subscription: true;
  };
}>;

interface ScheduleContentProps {
  clinic: UserWithServiceAndSubscription;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export function ScheduleContent({ clinic }: ScheduleContentProps) {
  const form = useAppointmentForm();
  const { watch } = form;

  const selectedDate = watch("date");
  const selectedServiceId = watch("serviceId");
  const [selectedTime, setSelectedTime] = useState("");
  const [avaliableTimeSlots, setAvaliableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);

  const fetchBlockedTimes = useCallback(
    async (date: Date): Promise<string[]> => {
      setLoadingSlots(true);
      try {
        const dateString = date.toISOString().split("T")[0];
        const res = await fetch(
          `${process.env.NEXTAUTH_URL}/api/schedule/get-appointments?userId=${clinic.id}&date=${dateString}`
        );
        const json = await res.json();
        setLoadingSlots(false);
        return json; // Rertona array com horários bloqueados do dia e clinica
      } catch (err) {
        console.log(err);
        setLoadingSlots(false);
        return [];
      }
    },
    [clinic.id]
  );

  useEffect(() => {
    if (selectedDate) {
      fetchBlockedTimes(selectedDate).then((blocked) => {
        setBlockedTimes(blocked);

        const times = clinic.times || [];

        const finalSlots = times.map((time) => ({
          time,
          avaliable: !blockedTimes.includes(time),
        }));

        setAvaliableTimeSlots(finalSlots);
      });
    }
  }, [
    selectedDate,
    selectedServiceId,
    fetchBlockedTimes,
    clinic.times,
    selectedTime,
  ]);

  async function handleRegisterAppointment(formData: AppointmentFormData) {
    if (!selectedTime) {
      return;
    }

    const response = await createNewAppointment({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      date: formData.date,
      serviceId: formData.serviceId,
      clinicId: clinic.id,
      time: selectedTime,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }

    toast.success("Agendamento realizado com sucesso!");
    form.reset();
    setSelectedTime("");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`h-32 ${clinic.headerColor || "bg-emerald-500"}`}></div>

      <section className="mx-auto px-4 -mt-16">
        <div className="max-w-2xl mx-auto">
          <article className="flex flex-col items-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white mb-5">
              <Image
                src={clinic.image ? clinic.image : imgTest}
                alt="Foto de perfil"
                className="object-cover bg-white"
                fill
              />
            </div>

            <h1 className="text-2xl font-bold mb-2">{clinic.name}</h1>
            <div className="flex items-center gap-1">
              <MapPin className="w-5 h-5" />
              <span>
                {clinic.address ? clinic.address : "Endereço não informado"}
              </span>
            </div>
          </article>
        </div>
      </section>

      <section className="max-w-2xl mx-auto w-full mt-6">
        <Form {...form}>
          <form
            className="mx-2 space-y-6 bg-white p-6 border rounded-md shadow-sm"
            onSubmit={form.handleSubmit(handleRegisterAppointment)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="my-2">
                  <FormLabel className="font-semibold">Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      placeholder="Digite seu nome completo..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="my-2">
                  <FormLabel className="font-semibold">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="Digite seu e-mail..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="my-2">
                  <FormLabel className="font-semibold">Telefone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        const formatvalue = formatPhone(e.target.value);
                        field.onChange(formatvalue);
                      }}
                      id="phone"
                      placeholder="(xx) xxxxx-xxxx"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-1">
                  <FormLabel className="font-semibold">
                    Data do agendamento:
                  </FormLabel>
                  <FormControl>
                    <DatePickerComponent
                      minDate={new Date()}
                      className="w-full rounded border p-2"
                      initialDate={new Date()}
                      onChange={(date) => {
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Selecione o Serviço
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o serviço..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinic.services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedServiceId && (
              <div className="space-y-2">
                <Label>Horários Disponíveis</Label>
                <div className="bg-gray-100 p-4 rounded-lg">
                  {loadingSlots ? (
                    <p>Carregando horários...</p>
                  ) : avaliableTimeSlots.length === 0 ? (
                    <p>Nenhum horário disponível nesse dia.</p>
                  ) : (
                    <ScheduleTimesLista
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      requiredSlots={
                        clinic.services.find(
                          (service) => service.id === selectedServiceId
                        )
                          ? Math.ceil(
                              clinic.services.find(
                                (service) => service.id === selectedServiceId
                              )!.duration / 30
                            )
                          : 1
                      }
                      onSelectTime={(time) => setSelectedTime(time)}
                      blockedTimes={blockedTimes}
                      availableTimeSlots={avaliableTimeSlots}
                      clinicTimes={clinic.times}
                    />
                  )}
                </div>
              </div>
            )}

            {clinic.status ? (
              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400"
                disabled={!watch("date") || !watch("name") || !watch("phone")}
              >
                Realizar Agendamento
              </Button>
            ) : (
              <p className="bg-red-500 text-white text-center px-4 py-2 rounded-md">
                A Cliníca esta fechada no momento.
              </p>
            )}
          </form>
        </Form>
      </section>
    </div>
  );
}
