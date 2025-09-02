"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Banknote,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  formatCurrencyWithSmallCents,
} from "@/utils/formatCurrency";
import { getServiceImageUrl } from "@/utils/getServiceImage";

type UserWithServiceAndSubscription = Prisma.UserGetPayload<{
  include: {
    services: {
      include: {
        category: true;
      };
    };
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

// Tipo para Service com Category
type ServiceWithCategory = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image: string | null;
  category: {
    id: string;
    name: string;
    order: number;
  } | null;
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ServiceWithCategory | null>(null);
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({ averageRating: 0, totalReviews: 0 });

  // Agrupar serviços por categoria
  const servicesByCategory = useMemo(() => {
    const grouped = new Map<
      string,
      {
        category: { id: string; name: string; order: number } | null;
        services: ServiceWithCategory[];
      }
    >();

    clinic.services.forEach((service) => {
      const categoryKey = service.category?.id || "no-category";

      if (!grouped.has(categoryKey)) {
        grouped.set(categoryKey, {
          category: service.category,
          services: [],
        });
      }

      grouped.get(categoryKey)!.services.push(service as ServiceWithCategory);
    });

    // Converter para array e ordenar por ordem da categoria
    return Array.from(grouped.values()).sort((a, b) => {
      if (!a.category && !b.category) return 0;
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.category.order - b.category.order;
    });
  }, [clinic.services]);

  // Buscar dados das avaliações
  useEffect(() => {
    const fetchReviewsData = async () => {
      try {
        const response = await fetch(
          `/api/reviews/get-reviews?clinicId=${clinic.id}`
        );
        const data = await response.json();

        if (data.ok) {
          setReviewsData({
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      }
    };

    fetchReviewsData();
  }, [clinic.id]);

  // Buscar dados das avaliações
  useEffect(() => {
    const fetchReviewsData = async () => {
      try {
        const response = await fetch(
          `/api/reviews/get-reviews?clinicId=${clinic.id}`
        );
        const data = await response.json();

        if (data.ok) {
          setReviewsData({
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      }
    };

    fetchReviewsData();
  }, [clinic.id]);

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
    setIsModalOpen(false);
    setSelectedService(null);

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

  const handleCopyPix = async () => {
    const pix = clinic.pix || "PIX não informado";
    try {
      await navigator.clipboard.writeText(pix);
      toast.success("PIX copiado para a área de transferência!");
    } catch (err) {
      toast.error("Erro ao copiar PIX");
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(
      isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos"
    );
  };

  const handleScheduleService = (service: ServiceWithCategory) => {
    setSelectedService(service);
    form.setValue("serviceId", service.id);
    form.setValue("date", new Date());
    setSelectedTime("");
    setIsModalOpen(true);
  };

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

      <section className="md:mx-40 px-4 -mt-8">
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
              <Link
                href={`/clinica/${clinic.id}/avaliacoes`}
                className="flex items-center justify-between mb-4 w-full hover:bg-gray-50 transition-colors duration-200 rounded-lg p-2 -m-2"
              >
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-emerald-400 fill-current" />
                  <span className="text-sm text-gray-600">
                    {reviewsData.averageRating.toFixed(1)} (
                    {reviewsData.totalReviews} avaliações)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
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

              {/* Linha divisória */}
              <div className="w-full h-px bg-gray-200 mb-4"></div>

              {/* PIX da Clínica */}
              {clinic.pix && (
                <div className="flex items-center justify-between mb-2 w-full">
                  <div className="flex items-center gap-1">
                    <Banknote className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      PIX: {clinic.pix}
                    </span>
                  </div>
                  <button onClick={handleCopyPix}>
                    <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </button>
                </div>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* Seção de Serviços */}
      <section className="max-w-2xl mx-auto w-full mt-6 px-4">
        <div className="bg-white rounded-lg p-6">
          {servicesByCategory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum serviço disponível
            </div>
          ) : (
            <div className="space-y-12">
              {servicesByCategory.map((group, groupIndex) => (
                <div key={group.category?.id || "no-category"}>
                  {/* Nome da Categoria com linha */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1">
                      {group.category?.name || "Sem Categoria"}
                    </h3>
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>

                  {/* Lista de Serviços da Categoria */}
                  <div className="space-y-0">
                    {group.services.map((service, serviceIndex) => (
                      <div key={service.id}>
                        {/* Div do serviço */}
                        <div className="flex items-start gap-4 py-4">
                          {/* Lado esquerdo - Foto do serviço */}
                          <div className="w-25 h-25 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            <Image
                              src={getServiceImageUrl(service.image)}
                              alt={`Imagem do serviço ${service.name}`}
                              width={100}
                              height={100}
                              className="object-cover"
                            />
                          </div>

                          {/* Lado direito - Conteúdo */}
                          <div className="flex-1">
                            {/* Nome do serviço */}
                            <h4 className="font-semibold text-lg text-gray-900 mb-2">
                              {service.name}
                            </h4>

                            {/* Descrição */}
                            <p className="text-sm text-gray-600">
                              {service.description || "Descrição do serviço"}
                            </p>

                            {/* Duração */}
                            <p className="text-sm text-gray-500">
                              Duração: {service.duration} minutos
                            </p>

                            {/* Div com space-between: preço e botão */}
                            <div className="flex items-center justify-between">
                              {/* Preço em destaque */}
                              <div className="text-lg font-bold text-emerald-600">
                                {(() => {
                                  const price = formatCurrencyWithSmallCents(
                                    service.price / 100
                                  );
                                  return (
                                    <span>
                                      {price.main}
                                      <span className="text-sm">
                                        ,{price.cents}
                                      </span>
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Botão agendar */}
                              <Button
                                onClick={() => handleScheduleService(service)}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2 rounded-full"
                                disabled={!clinic.status}
                              >
                                Agendar
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Linha inferior */}
                        <div className="w-full h-px bg-gray-100"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!clinic.status && (
            <div className="mt-6">
              <p className="bg-red-500 text-white text-center px-4 py-2 rounded-md">
                A Clínica está fechada no momento.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Modal de Agendamento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agendar Serviço</DialogTitle>
            <DialogDescription>
              {selectedService && (
                <div className="flex items-center gap-4 mt-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 shadow-sm">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                    <Image
                      src={getServiceImageUrl(selectedService.image)}
                      alt={`Imagem do serviço ${selectedService.name}`}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-bold text-lg text-emerald-900 mb-1">
                      {selectedService.name}
                    </span>
                    <div className="flex items-center gap-3 text-emerald-700">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold">
                          {formatCurrency(selectedService.price / 100)}
                        </span>
                      </div>
                      <span className="text-emerald-400">•</span>
                      <span className="font-medium">
                        {formatDuration(selectedService.duration)}
                      </span>
                    </div>
                    {selectedService.description && (
                      <p className="text-sm text-emerald-600 italic">
                        {selectedService.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleRegisterAppointment)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="my-2">
                    <FormLabel className="font-semibold">
                      Nome Completo
                    </FormLabel>
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedService(null);
                    form.reset();
                    setSelectedTime("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400"
                  disabled={
                    !watch("date") ||
                    !watch("name") ||
                    !watch("phone") ||
                    !selectedTime
                  }
                >
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
