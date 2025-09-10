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
import { ProfessionalCard } from "./professional-card";

// Interface para Professional
interface Professional {
  id: string;
  name: string;
  specialty?: string | null;
  profileImage?: string | null;
  availableTimes: string[];
}

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
  const selectedServiceIds = watch("serviceIds");
  const [selectedTime, setSelectedTime] = useState("");
  const [avaliableTimeSlots, setAvaliableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceWithCategory[]>([]);
  const [showFloatingModal, setShowFloatingModal] = useState(false);
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({ averageRating: 0, totalReviews: 0 });

  // Estados para profissionais
  const [availableProfessionals, setAvailableProfessionals] = useState<
    Professional[]
  >([]);
  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState<string>("");
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);

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

  const fetchAvailableProfessionals = useCallback(
    async (date: Date, time: string): Promise<Professional[]> => {
      try {
        const dateString = date.toISOString().split("T")[0];
        const res = await fetch(
          `/api/schedule/get-available-professionals?clinicId=${clinic.id}&date=${dateString}&time=${time}`
        );
        const json = await res.json();
        return json.professionals || [];
      } catch (err) {
        console.log(err);
        return [];
      }
    },
    [clinic.id]
  );

  useEffect(() => {
    if (selectedDate) {
      // Verificar se a clínica funciona no dia da semana selecionado
      const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const selectedDayName = dayNames[dayOfWeek];

      const workingDays = clinic.workingDays || [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ];

      if (!workingDays.includes(selectedDayName)) {
        // Se a clínica não funciona neste dia, não mostrar horários disponíveis
        setAvaliableTimeSlots([]);
        setBlockedTimes([]);
        setSelectedTime("");
        return;
      }

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
    selectedServiceIds,
    fetchBlockedTimes,
    clinic.times,
    clinic.workingDays,
    selectedTime,
  ]);

  // Efeito para buscar profissionais quando horário é selecionado
  useEffect(() => {
    if (selectedDate && selectedTime) {
      fetchAvailableProfessionals(selectedDate, selectedTime).then(
        (professionals) => {
          setAvailableProfessionals(professionals);
          // Reset seleção se profissional não estiver mais disponível
          if (
            selectedProfessionalId &&
            !professionals.find((p) => p.id === selectedProfessionalId)
          ) {
            setSelectedProfessionalId("");
          }
        }
      );
    } else {
      setAvailableProfessionals([]);
      setSelectedProfessionalId("");
    }
  }, [
    selectedDate,
    selectedTime,
    fetchAvailableProfessionals,
    selectedProfessionalId,
  ]);

  async function handleRegisterAppointment(formData: AppointmentFormData) {
    if (!selectedTime) {
      return;
    }

    if (!selectedProfessionalId) {
      toast.error("Por favor, selecione um profissional.");
      return;
    }

    if (!formData.serviceIds || formData.serviceIds.length === 0) {
      toast.error("Por favor, selecione pelo menos um serviço.");
      return;
    }

    // Create appointments for each selected service
    try {
      const appointmentPromises = formData.serviceIds.map(serviceId => 
        createNewAppointment({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          date: formData.date,
          serviceId: serviceId,
          clinicId: clinic.id,
          time: selectedTime,
          professionalId: selectedProfessionalId,
        })
      );

      const responses = await Promise.all(appointmentPromises);
      
      // Check if any appointment failed
      const failedAppointments = responses.filter(response => response.error);
      
      if (failedAppointments.length > 0) {
        toast.error(`Erro ao criar ${failedAppointments.length} agendamento(s): ${failedAppointments[0].error}`);
        return;
      }

      toast.success(`${formData.serviceIds.length} agendamento(s) realizado(s) com sucesso!`);
      form.reset();
      setSelectedTime("");
      setSelectedProfessionalId("");
      setAvailableProfessionals([]);
      setIsModalOpen(false);
      setSelectedServices([]);
      setShowFloatingModal(false);

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
    } catch (error) {
      toast.error("Erro inesperado ao criar agendamentos");
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
    const currentServices = form.getValues("serviceIds") || [];
    const isServiceSelected = currentServices.includes(service.id);
    
    if (isServiceSelected) {
      // Remove service if already selected
      const updatedServices = currentServices.filter(id => id !== service.id);
      const updatedServiceObjects = selectedServices.filter(s => s.id !== service.id);
      
      form.setValue("serviceIds", updatedServices);
      setSelectedServices(updatedServiceObjects);
      
      if (updatedServices.length === 0) {
        setShowFloatingModal(false);
      }
    } else {
      // Add service if not selected
      const updatedServices = [...currentServices, service.id];
      const updatedServiceObjects = [...selectedServices, service];
      
      form.setValue("serviceIds", updatedServices);
      setSelectedServices(updatedServiceObjects);
      setShowFloatingModal(true);
    }
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
    <div className="min-h-screen flex flex-col pb-32">
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
              <h1 className="text-xl font-bold mb-2 text-left w-full">
                {clinic.name}
              </h1>

              {/* Status da clínica */}
              <div className="w-full mb-4">
                {(() => {
                  const now = new Date();
                  const currentDay = now.getDay();
                  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

                  const dayNames = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ];

                  const currentDayName = dayNames[currentDay];
                  const workingDays = clinic.workingDays || [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                  ];

                  const clinicTimes = clinic.times || [];

                  // Verificar se está em um dia de funcionamento
                  const isWorkingDay = workingDays.includes(currentDayName);

                  // Verificar se está dentro do horário de funcionamento
                  const isWithinWorkingHours =
                    clinicTimes.length > 0 &&
                    currentTime >= clinicTimes[0] &&
                    currentTime <= clinicTimes[clinicTimes.length - 1];

                  const isOpen =
                    clinic.status && isWorkingDay && isWithinWorkingHours;

                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isOpen ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          isOpen ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isOpen ? "Atendendo Agora" : "Fechado"}
                      </span>
                    </div>
                  );
                })()}
              </div>
              {/* Linha divisória */}
              <div className="w-full h-px bg-gray-200 mb-4"></div>

              {/* Avaliações */}
              <Link
                href={`/clinica/${clinic.id}/avaliacoes`}
                className="flex items-center justify-between mb-2 w-full hover:bg-gray-50 transition-colors duration-200 rounded-lg p-2 -m-2"
              >
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-black fill-current" />
                  <span className="text-sm text-gray-600">
                    <b className="font-semibold text-black">
                      {reviewsData.averageRating.toFixed(1)}
                    </b>{" "}
                    ({reviewsData.totalReviews} avaliações)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              {/* Linha divisória */}
              <div className="w-full h-px bg-gray-200 mb-4"></div>

              {/* Endereço */}
              <div className="flex items-center justify-between mb-4 w-full">
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
                                className={`px-6 py-2 rounded-full ${
                                  (form.getValues("serviceIds") || []).includes(service.id)
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                                disabled={!clinic.status}
                              >
                                {(form.getValues("serviceIds") || []).includes(service.id) ? "Remover" : "Adicionar"}
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
            <DialogTitle>Agendar Serviços</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para agendar seus serviços.
            </DialogDescription>
          </DialogHeader>
          {selectedServices.length > 0 && (
            <div className="space-y-3 mt-3">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 shadow-sm">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                    <Image
                      src={getServiceImageUrl(service.image)}
                      alt={`Imagem do serviço ${service.name}`}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-bold text-lg text-emerald-900 mb-1">
                      {service.name}
                    </span>
                    <div className="flex items-center gap-3 text-emerald-700">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold">
                          {formatCurrency(service.price / 100)}
                        </span>
                      </div>
                      <span className="text-emerald-400">•</span>
                      <span className="font-medium">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-emerald-600 italic">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleScheduleService(service)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900">Total:</span>
                  <span className="font-bold text-lg text-blue-900">
                    {formatCurrency(
                      selectedServices.reduce((total, service) => total + service.price, 0) / 100
                    )}
                  </span>
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  Duração total: {formatDuration(
                    selectedServices.reduce((total, service) => total + service.duration, 0)
                  )}
                </div>
              </div>
            </div>
          )}

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

              {selectedServiceIds && selectedServiceIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Horários Disponíveis</Label>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    {loadingSlots ? (
                      <p>Carregando horários...</p>
                    ) : (
                      (() => {
                        // Verificar se a clínica funciona no dia selecionado
                        const dayOfWeek = selectedDate.getDay();
                        const dayNames = [
                          "sunday",
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                        ];
                        const selectedDayName = dayNames[dayOfWeek];
                        const workingDays = clinic.workingDays || [
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                        ];

                        if (!workingDays.includes(selectedDayName)) {
                          const dayNamesPortuguese = {
                            sunday: "domingo",
                            monday: "segunda-feira",
                            tuesday: "terça-feira",
                            wednesday: "quarta-feira",
                            thursday: "quinta-feira",
                            friday: "sexta-feira",
                            saturday: "sábado",
                          };
                          return (
                            <p>
                              A clínica não funciona em{" "}
                              {
                                dayNamesPortuguese[
                                  selectedDayName as keyof typeof dayNamesPortuguese
                                ]
                              }
                              .
                            </p>
                          );
                        }

                        if (avaliableTimeSlots.length === 0) {
                          return <p>Nenhum horário disponível nesse dia.</p>;
                        }

                        // Calculate total duration for all selected services
                        const totalDuration = selectedServices.reduce(
                          (total, service) => total + service.duration,
                          0
                        );

                        return (
                          <ScheduleTimesLista
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            requiredSlots={Math.ceil(totalDuration / 30)}
                            onSelectTime={(time) => setSelectedTime(time)}
                            blockedTimes={blockedTimes}
                            availableTimeSlots={avaliableTimeSlots}
                            clinicTimes={clinic.times}
                          />
                        );
                      })()
                    )}
                  </div>
                </div>
              )}

              {selectedTime && (
                <div className="space-y-2">
                  <Label>Profissionais Disponíveis</Label>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    {loadingProfessionals ? (
                      <p className="text-sm text-gray-600">
                        Carregando profissionais...
                      </p>
                    ) : availableProfessionals.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        Nenhum profissional disponível neste horário.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 mb-3">
                          Selecione um profissional para o atendimento:
                        </p>
                        <div className="grid gap-2">
                          {availableProfessionals.map((professional) => (
                            <ProfessionalCard
                              key={professional.id}
                              professional={professional}
                              isSelected={
                                selectedProfessionalId === professional.id
                              }
                              onSelect={setSelectedProfessionalId}
                            />
                          ))}
                        </div>
                      </div>
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
                    setSelectedServices([]);
                    setShowFloatingModal(false);
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
                    !selectedTime ||
                    !selectedProfessionalId ||
                    !watch("serviceIds") ||
                    watch("serviceIds").length === 0
                  }
                >
                  Confirmar Agendamentos
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Floating Modal at Bottom */}
      {showFloatingModal && selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
          <div className="max-w-2xl mx-auto p-4">
            <div className="space-y-3">
              {selectedServices.map((service, index) => (
                <div 
                  key={service.id}
                  className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-right-5 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                    <Image
                      src={getServiceImageUrl(service.image)}
                      alt={`Imagem do serviço ${service.name}`}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-emerald-900 text-sm">
                      {service.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <span className="font-medium">
                        {formatCurrency(service.price / 100)}
                      </span>
                      <span>•</span>
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleScheduleService(service)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50 h-8 px-2"
                  >
                    ×
                  </Button>
                </div>
              ))}
              
              {/* Total and Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <div>
                  <p className="font-semibold text-emerald-900">
                    Total: {formatCurrency(
                      selectedServices.reduce((total, service) => total + service.price, 0) / 100
                    )}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {selectedServices.length} serviço(s) • {formatDuration(
                      selectedServices.reduce((total, service) => total + service.duration, 0)
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    form.setValue("date", new Date());
                    setSelectedTime("");
                    setShowFloatingModal(false);
                    setIsModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2"
                >
                  {selectedServices.length === 1 ? 'Escolher Data' : 'Finalizar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
