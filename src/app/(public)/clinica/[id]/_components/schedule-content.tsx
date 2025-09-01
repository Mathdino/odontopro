"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import imgTest from "../../../../../../public/foto1.png";
import {
  MapPin,
  ChevronLeft,
  Heart,
  Search,
  Star,
  ChevronRight,
  Copy,
} from "lucide-react";
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
  const router = useRouter();

  const selectedDate = watch("date");
  const selectedServiceId = watch("serviceId");
  const [selectedTime, setSelectedTime] = useState("");
  const [avaliableTimeSlots, setAvaliableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchBlockedTimes = useCallback(
    async (date: Date): Promise<string[]> => {
      setLoadingSlots(true);
      try {
        const dateString = date.toISOString().split("T")[0];
        const res = await fetch(
          `/api/schedule/get-appointments?userId=${clinic.id}&date=${dateString}`
        );
        const json = await res.json();
        setLoadingSlots(false);

        // Corrigido: extrair blockedTimes do objeto retornado
        return json.blockedTimes || [];
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
        console.log("=== FETCH BLOCKED TIMES ===");
        console.log("API retornou blocked:", blocked);

        setBlockedTimes(blocked);

        const times = clinic.times || [];
        console.log("clinic.times:", times);

        const finalSlots = times.map((time) => ({
          time,
          available: !blocked.includes(time),
        }));

        console.log("finalSlots criados:", finalSlots);
        setAvaliableTimeSlots(finalSlots);

        //Veriifcar se o slot atual esta disponivel
        const stillAvailable = finalSlots.find(
          (slot) => slot.time === selectedTime && slot.available
        );

        if (!stillAvailable) {
          setSelectedTime("");
        }
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

    // Adicionar: atualizar lista de horários bloqueados
    if (selectedDate) {
      fetchBlockedTimes(selectedDate).then((blocked) => {
        setBlockedTimes(blocked);
        const times = clinic.times || [];
        const finalSlots = times.map((time) => ({
          time,
          available: !blocked.includes(time),
        }));
        setAvaliableTimeSlots(finalSlots);
      });
    }
  }

  const handleGoHome = () => {
    router.push("/");
  };

  const handleCopyAddress = async () => {
    const address = clinic.address || "Endereço não informado";
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Endereço copiado para a área de transferência!");
    } catch (err) {
      toast.error("Erro ao copiar endereço");
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(
      isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos"
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`h-32 ${clinic.headerColor || "bg-emerald-500"}`}>
        {/* Header com ícones */}
        <div className="flex justify-between items-center p-4 pt-8">
          <button
            onClick={handleGoHome}
            className="w-9 h-9 rounded-full bg-black bg-opacity-80 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleToggleFavorite}
              className="w-9 h-9 rounded-full bg-black bg-opacity-80 flex items-center justify-center"
            >
              <Heart
                className={`w-5 h-5 text-white ${
                  isFavorite ? "fill-white" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <section className="md:mx-auto px-4 -mt-8">
        <div className="w-full">
          {/* Card principal */}
          <div className="bg-white rounded-lg shadow-lg p-6 pt-2">
            <article className="flex flex-col items-center">
              {/* Imagem circular da clínica */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white mb-6 -mt-12">
                <Image
                  src={clinic.image ? clinic.image : imgTest}
                  alt="Foto de perfil"
                  className="object-cover bg-white"
                  fill
                />
              </div>

              {/* Nome da clínica */}
              <h1 className="text-xl font-bold mb-4 text-left w-full">
                {clinic.name}
              </h1>

              {/* Linha divisória */}
              <div className="w-full h-px bg-gray-200 mb-4"></div>

              {/* Avaliações */}
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">
                    4,8 (total de avaliações)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Linha divisória */}
              <div className="w-full h-px bg-gray-200 mb-4"></div>

              {/* Endereço */}
              <div className="flex items-center justify-between mb-2 w-full">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {clinic.address ? clinic.address : "Endereço não informado"}
                  </span>
                </div>
                <button onClick={handleCopyAddress}>
                  <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              </div>
            </article>
          </div>
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
                      placeholder="Digite seu nome completo"
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
                      placeholder="Digite seu e-mail"
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
                        setSelectedTime("");
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
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTime("");
                      }}
                    >
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
