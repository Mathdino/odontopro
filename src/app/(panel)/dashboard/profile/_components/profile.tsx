"use client";
import { useState, useEffect } from "react";
import { ProfileFormData, useProfileForm } from "./profile-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import imgTeste from "../../../../../../public/foto1.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  LogOut,
  Plus,
  Star,
  Scissors,
  Clock,
  MoreVertical,
  UserX,
  UserCheck,
  Camera,
  MessageSquare,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  getWhatsappMessages,
  updateWhatsappMessages,
} from "../_actions/whatsapp-actions";
import { cn } from "@/lib/utils";
import { Prisma } from "@/generated/prisma";
import { updateProfile } from "../_actions/update-profile";
import {
  createProfessional,
  updateProfessional as updateProfessionalAction,
  toggleProfessionalStatus as toggleStatusAction,
  deleteProfessional,
  getProfessionals,
} from "../_actions/professional-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageCrop } from "./image-crop";
import { toast } from "sonner";
import { formatPhone } from "@/utils/formatPhone";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type UserWithSubscription = Prisma.UserGetPayload<{
  include: {
    subscription: true;
    professionals: true;
  };
}>;

interface ProfileContentProps {
  user: UserWithSubscription;
}

export function ProfileContent({ user }: ProfileContentProps) {
  const router = useRouter();
  const [selectedHours, setSelectedHours] = useState<string[]>(
    user.times ?? []
  );

  // Estados para mensagens do WhatsApp - iniciar vazio para evitar hidratação
  const [whatsappMessages, setWhatsappMessages] = useState({
    confirmationMessage: "",
    cancellationMessage: "",
  });
  const [isLoadingMessages, setIsLoadingMessages] = useState(true); // Iniciar como true
  const [validationErrors, setValidationErrors] = useState({
    confirmationMessage: [] as string[],
    cancellationMessage: [] as string[],
  });

  // Carregar mensagens do WhatsApp
  useEffect(() => {
    async function loadWhatsappMessages() {
      try {
        const result = await getWhatsappMessages();
        if (result.data) {
          setWhatsappMessages({
            confirmationMessage: result.data.confirmationMessage,
            cancellationMessage: result.data.cancellationMessage,
          });
        } else {
          // Se não há dados salvos, usar valores padrão
          setWhatsappMessages({
            confirmationMessage:
              "Olá, [Nome-cliente]! Seu horário está confirmado para [data] às [hora]. Qualquer imprevisto, é só nos avisar.",
            cancellationMessage:
              "Olá, [Nome-cliente]. Infelizmente não foi possível confirmar/agendar seu horário para [data] às [hora]. Pedimos desculpas pelo transtorno e ficamos à disposição para remarcar em outro dia/horário que seja melhor para você.",
          });
        }
      } catch (error) {
        // Em caso de erro, usar valores padrão
        setWhatsappMessages({
          confirmationMessage:
            "Olá, [Nome]! Seu horário está confirmado para [data] às [hora]. Qualquer imprevisto, é só nos avisar.",
          cancellationMessage:
            "Olá, [Nome]. Infelizmente não foi possível confirmar/agendar seu horário para [data] às [hora]. Pedimos desculpas pelo transtorno e ficamos à disposição para remarcar em outro dia/horário que seja melhor para você.",
        });
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadWhatsappMessages();
  }, []);

  // Função para validar se as caixas obrigatórias estão presentes
  function validateRequiredFields(message: string): string[] {
    const missingFields: string[] = [];

    if (!message.includes("[Nome-cliente]")) {
      missingFields.push("Nome-cliente");
    }

    if (!message.includes("[data]")) {
      missingFields.push("data");
    }

    if (!message.includes("[hora]")) {
      missingFields.push("hora");
    }

    return missingFields;
  }

  // Função para limpar erros quando o usuário digita
  function handleConfirmationMessageChange(value: string) {
    setWhatsappMessages((prev) => ({
      ...prev,
      confirmationMessage: value,
    }));

    // Limpar erros se o campo foi corrigido
    if (validationErrors.confirmationMessage.length > 0) {
      const newErrors = validateRequiredFields(value);
      setValidationErrors((prev) => ({
        ...prev,
        confirmationMessage: newErrors,
      }));
    }
  }

  function handleCancellationMessageChange(value: string) {
    setWhatsappMessages((prev) => ({
      ...prev,
      cancellationMessage: value,
    }));

    // Limpar erros se o campo foi corrigido
    if (validationErrors.cancellationMessage.length > 0) {
      const newErrors = validateRequiredFields(value);
      setValidationErrors((prev) => ({
        ...prev,
        cancellationMessage: newErrors,
      }));
    }
  }

  // Função para salvar mensagens do WhatsApp
  async function saveWhatsappMessages() {
    setIsLoadingMessages(true);

    // Limpar erros anteriores
    setValidationErrors({
      confirmationMessage: [],
      cancellationMessage: [],
    });

    try {
      // Validar mensagem de confirmação
      const confirmationMissing = validateRequiredFields(
        whatsappMessages.confirmationMessage
      );
      const cancellationMissing = validateRequiredFields(
        whatsappMessages.cancellationMessage
      );

      // Se houver erros, definir os estados de erro e parar
      if (confirmationMissing.length > 0 || cancellationMissing.length > 0) {
        setValidationErrors({
          confirmationMessage: confirmationMissing,
          cancellationMessage: cancellationMissing,
        });

        if (confirmationMissing.length > 0) {
          toast.error(
            `Mensagem de confirmação está faltando: ${confirmationMissing.join(
              ", "
            )}`
          );
        }

        if (cancellationMissing.length > 0) {
          toast.error(
            `Mensagem de cancelamento está faltando: ${cancellationMissing.join(
              ", "
            )}`
          );
        }

        setIsLoadingMessages(false);
        return;
      }

      const result = await updateWhatsappMessages(whatsappMessages);
      if (result.data) {
        toast.success("Mensagens salvas com sucesso!");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar mensagens");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [addProfessionalDialogOpen, setAddProfessionalDialogOpen] =
    useState(false);
  const [professionals, setProfessionals] = useState(user.professionals || []);
  const [newProfessional, setNewProfessional] = useState({
    name: "",
    image: null as string | null,
    availableTimes: [] as string[],
  });
  // Corrigir tipos para editingProfessional
  interface Professional {
    id: string;
    name: string;
    image?: string | null;
    availableTimes: string[];
    status: boolean;
    totalCuts: number;
    rating: number;
  }
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [editProfessionalDialogOpen, setEditProfessionalDialogOpen] =
    useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const { update } = useSession();

  // Carregar profissionais do banco
  useEffect(() => {
    loadProfessionals();
  }, []);

  async function loadProfessionals() {
    const result = await getProfessionals();
    if (result.data) {
      setProfessionals(result.data);
    } else if (result.error) {
      toast.error(result.error);
    }
  }

  const form = useProfileForm({
    name: user.name,
    address: user.address,
    phone: user.phone,
    status: user.status,
    timeZone: user.timezone,
  });

  function generateTimeSlots(): string[] {
    const hours: string[] = [];

    for (let i = 6; i <= 24; i++) {
      for (let m = 0; m < 2; m++) {
        const hour = i.toString().padStart(2, "0");
        const minute = (m * 30).toString().padStart(2, "0");
        hours.push(`${hour}:${minute}`);
      }
    }
    return hours;
  }

  const hours = generateTimeSlots();

  function toggleHour(hour: string) {
    setSelectedHours((prev) =>
      prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort()
    );
  }

  const [horariosModalOpen, setHorariosModalOpen] = useState(false);

  const timeZones = Intl.supportedValuesOf("timeZone").filter(
    (zone) =>
      zone.startsWith("America/Sao_Paulo") ||
      zone.startsWith("America/Fortaleza") ||
      zone.startsWith("America/Recife") ||
      zone.startsWith("America/Bahia") ||
      zone.startsWith("America/Belem") ||
      zone.startsWith("America/Manaus") ||
      zone.startsWith("America/Cuiaba") ||
      zone.startsWith("America/Boa_Vista")
  );

  async function onSubmit(values: ProfileFormData) {
    const response = await updateProfile({
      name: values.name,
      address: values.address,
      phone: values.phone,
      status: values.status === "active" ? true : false,
      timeZone: values.timeZone,
      times: selectedHours || [],
    });

    if (response.error) {
      toast.error(response.error);

      return;
    }

    toast.success(response.data);
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  function toggleProfessionalHour(hour: string) {
    setNewProfessional((prev) => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(hour)
        ? prev.availableTimes.filter((h) => h !== hour)
        : [...prev.availableTimes, hour].sort(),
    }));
  }

  function toggleEditProfessionalHour(hour: string) {
    setEditingProfessional((prev: Professional | null) => {
      if (!prev) return null;
      return {
        ...prev,
        availableTimes: prev.availableTimes.includes(hour)
          ? prev.availableTimes.filter((h: string) => h !== hour)
          : [...prev.availableTimes, hour].sort(),
      };
    });
  }

  function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    isEditing = false
  ) {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione apenas arquivos de imagem");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      setSelectedImageFile(file);
      setIsEditingImage(isEditing);
      setCropDialogOpen(true);
    }
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    if (isEditingImage && editingProfessional) {
      setEditingProfessional({
        ...editingProfessional,
        image: croppedImageUrl,
      });
    } else {
      setNewProfessional({
        ...newProfessional,
        image: croppedImageUrl,
      });
    }
    setCropDialogOpen(false);
    setSelectedImageFile(null);
    setIsEditingImage(false);
  };

  async function addProfessional() {
    if (
      newProfessional.name.trim() &&
      newProfessional.availableTimes.length > 0
    ) {
      const result = await createProfessional({
        name: newProfessional.name,
        image: newProfessional.image || undefined,
        availableTimes: newProfessional.availableTimes,
        status: true,
      });

      if (result.data) {
        toast.success(result.data);
        setNewProfessional({ name: "", image: null, availableTimes: [] });
        setAddProfessionalDialogOpen(false);
        loadProfessionals(); // Recarregar lista
      } else if (result.error) {
        toast.error(result.error);
      }
    } else {
      toast.error("Preencha o nome e selecione pelo menos um horário");
    }
  }

  async function updateProfessional() {
    if (
      editingProfessional &&
      editingProfessional.name.trim() &&
      editingProfessional.availableTimes.length > 0
    ) {
      const result = await updateProfessionalAction({
        id: editingProfessional.id,
        name: editingProfessional.name,
        image: editingProfessional.image || undefined,
        availableTimes: editingProfessional.availableTimes,
        status: editingProfessional.status,
      });

      if (result.data) {
        toast.success(result.data);
        setEditProfessionalDialogOpen(false);
        setEditingProfessional(null);
        loadProfessionals(); // Recarregar lista
      } else if (result.error) {
        toast.error(result.error);
      }
    } else {
      toast.error("Preencha o nome e selecione pelo menos um horário");
    }
  }

  // Função para salvar apenas os horários
  async function saveHorarios() {
    if (editingProfessional && editingProfessional.availableTimes.length > 0) {
      const result = await updateProfessionalAction({
        id: editingProfessional.id,
        name: editingProfessional.name,
        image: editingProfessional.image || undefined,
        availableTimes: editingProfessional.availableTimes,
        status: editingProfessional.status,
      });

      if (result.data) {
        toast.success("Horários salvos com sucesso!");
        setHorariosModalOpen(false); // Fecha modal de horários
        setEditProfessionalDialogOpen(false); // Fecha modal de edição
        setEditingProfessional(null); // Limpa profissional em edição
        loadProfessionals(); // Recarregar lista
      } else if (result.error) {
        toast.error(result.error);
      }
    } else {
      toast.error("Selecione pelo menos um horário");
    }
  }

  function editProfessional(professional: any) {
    setEditingProfessional({ ...professional });
    setEditProfessionalDialogOpen(true);
  }

  // Nova função para alternar status do profissional
  async function toggleProfessionalStatus(professionalId: string) {
    const professional = professionals.find((p) => p.id === professionalId);
    if (!professional) return;

    const newStatus = !professional.status;

    // Chama a action do banco de dados
    const result = await toggleStatusAction(professionalId);

    if (result.data) {
      // Atualiza o estado local apenas se a operação no banco foi bem-sucedida
      setProfessionals((prev) =>
        prev.map((prof) =>
          prof.id === professionalId ? { ...prof, status: newStatus } : prof
        )
      );

      toast.success(
        `Profissional ${newStatus ? "ativado" : "desativado"} com sucesso!`
      );
    } else if (result.error) {
      toast.error(result.error);
    }
  }

  // Nova função para remover profissional
  async function removeProfessional(professionalId: string) {
    const result = await deleteProfessional(professionalId);

    if (result.data) {
      toast.success(result.data);
      loadProfessionals(); // Recarregar lista do banco
    } else if (result.error) {
      toast.error(result.error);
    }
  }

  // Função para alternar horários do profissional em edição
  function toggleEditingProfessionalHour(hour: string) {
    setEditingProfessional((prev: Professional | null) => {
      if (!prev) return null;
      return {
        ...prev,
        availableTimes: prev.availableTimes.includes(hour)
          ? prev.availableTimes.filter((h) => h !== hour)
          : [...prev.availableTimes, hour].sort(),
      };
    });
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        )}
      />
    ));
  }

  return (
    <div className="mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Perfil Cliníca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-gray-200 relative h-40 w-40 rounded-full overflow-hidden">
                  <Image
                    src={user.image ? user.image : imgTeste}
                    alt="Foto da clinica"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Nome da Cliníca
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Digite o nome da clinica..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Endereço Completo
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Digite o endereço da clinica..."
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
                    <FormItem>
                      <FormLabel className="font-semibold">Telefone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(xx) xxxxx-xxxx"
                          onChange={(e) =>
                            field.onChange(formatPhone(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Status da clinica
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value ? "active" : "inactive"}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o status da clinica" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              ATIVO (clinica aberta)
                            </SelectItem>
                            <SelectItem value="inactive">
                              INATIVO (clinica fechada)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Configurar Horários da Clinica
                  </Label>

                  <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        Clique aqui para selecionar Horários
                        <ArrowRight />
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Horários da Clincia</DialogTitle>
                        <DialogDescription>
                          Selecione abaixo os horários de funcionamento da
                          clincia:
                        </DialogDescription>
                      </DialogHeader>

                      <section className="py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique nos horários abaixo para marcar ou desmarcar:
                        </p>

                        <div className="grid grid-cols-5 gap-2">
                          {hours.map((hour) => (
                            <Button
                              key={hour}
                              variant="outline"
                              className={cn(
                                "h-10",
                                selectedHours.includes(hour) &&
                                  "border-2 border-emerald-500 text-primary bg-emerald-200"
                              )}
                              onClick={() => toggleHour(hour)}
                            >
                              {hour}
                            </Button>
                          ))}
                        </div>
                      </section>

                      <Button
                        className="w-full bg-emerald-500"
                        onClick={() => setDialogIsOpen(false)}
                      >
                        Salvar Horários
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>

                <FormField
                  control={form.control}
                  name="timeZone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Selecione o fuso horário
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione seu fuso horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeZones.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400"
                >
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Card de Profissionais com Upload de Foto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Layout responsivo: vertical no mobile, horizontal no desktop */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-sm text-muted-foreground order-1 sm:order-none">
                Gerencie os profissionais da sua clinica
              </p>

              {/* Status dos profissionais ativos - visível apenas no mobile */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>
                    {professionals.filter((p) => p.status).length} Ativos
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>
                    {professionals.filter((p) => !p.status).length} Inativos
                  </span>
                </div>
              </div>
            </div>

            <Dialog
              open={addProfessionalDialogOpen}
              onOpenChange={setAddProfessionalDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-400 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 w-full sm:w-auto"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Adicionar </span>
                  Profissional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Profissional</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo profissional para sua clinica
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Upload de Foto */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      <div className="bg-gray-200 h-24 w-24 rounded-full overflow-hidden">
                        <Image
                          src={newProfessional.image || imgTeste}
                          alt="Foto do profissional"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <label
                        htmlFor="professional-photo"
                        className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1 cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                      <input
                        id="professional-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, false)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Clique na câmera para adicionar uma foto
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="professionalName">Nome Completo</Label>
                    <Input
                      id="professionalName"
                      value={newProfessional.name}
                      onChange={(e) =>
                        setNewProfessional((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Digite o nome completo do profissional"
                    />
                  </div>
                  <div>
                    <Label>Horários Disponíveis</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Selecione os horários que este profissional estará
                      disponível:
                    </p>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {hours.map((hour) => (
                        <Button
                          key={hour}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 text-xs",
                            newProfessional.availableTimes.includes(hour) &&
                              "border-2 border-emerald-500 text-primary bg-emerald-200"
                          )}
                          onClick={() => toggleProfessionalHour(hour)}
                        >
                          {hour}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setAddProfessionalDialogOpen(false);
                        setNewProfessional({
                          name: "",
                          image: null,
                          availableTimes: [],
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400"
                      onClick={addProfessional}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Dialog de Edição */}
          <Dialog
            open={editProfessionalDialogOpen}
            onOpenChange={setEditProfessionalDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Profissional</DialogTitle>
                <DialogDescription>
                  Atualize as informações do profissional
                </DialogDescription>
              </DialogHeader>
              {editingProfessional && (
                <div className="space-y-4">
                  {/* Upload de Foto para Edição */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      <div className="bg-gray-200 h-24 w-24 rounded-full overflow-hidden">
                        <Image
                          src={editingProfessional.image || imgTeste}
                          alt="Foto do profissional"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <label
                        htmlFor="edit-professional-photo"
                        className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1 cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                      <input
                        id="edit-professional-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, true)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Clique na câmera para alterar a foto
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="editProfessionalName">Nome Completo</Label>
                    <Input
                      id="editProfessionalName"
                      value={editingProfessional?.name || ""}
                      onChange={(e) =>
                        setEditingProfessional((prev) =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
                      }
                      placeholder="Digite o nome completo do profissional"
                    />
                  </div>

                  {/* Input clicável para horários */}
                  <div>
                    <Label>Horários Disponíveis</Label>
                    <Input
                      readOnly
                      value={`${editingProfessional.availableTimes.length} horários selecionados`}
                      onClick={() => setHorariosModalOpen(true)}
                      className="cursor-pointer"
                      placeholder="Clique para selecionar horários"
                    />
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditProfessionalDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => updateProfessional()}
                      className="flex-1"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal de seleção de horários - MOVIDO PARA FORA */}
          <Dialog open={horariosModalOpen} onOpenChange={setHorariosModalOpen}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Selecionar Horários</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 p-4">
                {hours.map((hour) => (
                  <span
                    key={hour}
                    onClick={() => toggleEditingProfessionalHour(hour)}
                    className={cn(
                      "px-3 py-2 text-sm rounded cursor-pointer transition-colors text-center",
                      editingProfessional?.availableTimes.includes(hour)
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    )}
                  >
                    {hour}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 p-4">
                <Button
                  onClick={saveHorarios}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {/* Lista de Profissionais */}
          <div className="space-y-3">
            {professionals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scissors className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum profissional cadastrado</p>
                <p className="text-sm">Adicione profissionais para começar</p>
              </div>
            ) : (
              professionals.map((professional) => (
                <div
                  key={professional.id}
                  className={cn(
                    "border rounded-lg p-3 sm:p-4 space-y-3 transition-opacity w-full max-w-full overflow-hidden",
                    !professional.status && "opacity-60 bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-2 sm:gap-3 w-full">
                    <div className="bg-gray-200 h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={professional.image || imgTeste}
                        alt={professional.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3
                        className={cn(
                          "font-semibold text-base sm:text-lg truncate",
                          !professional.status && "text-gray-500"
                        )}
                      >
                        {professional.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{professional.totalCuts} cortes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(professional.rating)}
                          <span className="ml-1">
                            {professional.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                          professional.status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {professional.status ? "Ativo" : "Inativo"}
                      </div>

                      {/* Menu de ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProfessional({ ...professional });
                              setEditProfessionalDialogOpen(true);
                            }}
                          >
                            Editar Profissional
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleProfessionalStatus(professional.id)
                            }
                          >
                            {professional.status ? (
                              <>
                                <UserX className="h-4 w-4" />
                                Deixar Inativo
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeProfessional(professional.id)}
                            className="text-red-600"
                          >
                            Remover Profissional
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">
                        Horários:
                      </span>
                    </div>
                    <Input
                      readOnly
                      value={`${professional.availableTimes.length} horários configurados`}
                      className="cursor-pointer text-xs sm:text-sm h-8 w-full"
                      onClick={() => {
                        setEditingProfessional({ ...professional });
                        setHorariosModalOpen(true);
                      }}
                      placeholder="Clique para ver horários"
                    />
                  </div>

                  {!professional.status && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ⚠️ Este profissional está inativo e não aparecerá nos
                      agendamentos
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Mensagens do WhatsApp */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens Automáticas do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando mensagens...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure as mensagens automáticas que serão enviadas via
                WhatsApp para confirmação e cancelamento de agendamentos.
              </p>

              <div>
                <Label htmlFor="confirmationMessage" className="font-semibold">
                  Mensagem de Confirmação
                </Label>
                <Textarea
                  id="confirmationMessage"
                  value={whatsappMessages.confirmationMessage}
                  onChange={(e) =>
                    handleConfirmationMessageChange(e.target.value)
                  }
                  placeholder="Digite a mensagem de confirmação... (Obrigatório incluir: [Nome-cliente], [data] e [hora])"
                  className={`mt-2 min-h-[100px] ${
                    validationErrors.confirmationMessage.length > 0
                      ? "border-red-500 border-2 focus:border-red-500"
                      : ""
                  }`}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Variáveis disponíveis:
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    [Nome-cliente]
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    [data]
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    [hora]
                  </span>
                </div>
                {validationErrors.confirmationMessage.length > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm font-medium mb-2">
                      ⚠️ Campos obrigatórios faltando:{" "}
                      {validationErrors.confirmationMessage.join(", ")}
                    </p>
                    <p className="text-red-600 text-xs">
                      <strong>Como resolver:</strong> Adicione as seguintes
                      caixas na sua mensagem:
                    </p>
                    <ul className="text-red-600 text-xs mt-1 ml-4">
                      {validationErrors.confirmationMessage.includes(
                        "Nome-cliente"
                      ) && (
                        <li>
                          •{" "}
                          <code className="bg-red-100 px-1 rounded">
                            [Nome-cliente]
                          </code>{" "}
                          - será substituído pelo nome do cliente
                        </li>
                      )}
                      {validationErrors.confirmationMessage.includes(
                        "data"
                      ) && (
                        <li>
                          •{" "}
                          <code className="bg-red-100 px-1 rounded">
                            [data]
                          </code>{" "}
                          - será substituído pela data do agendamento
                        </li>
                      )}
                      {validationErrors.confirmationMessage.includes(
                        "hora"
                      ) && (
                        <li>
                          •{" "}
                          <code className="bg-red-100 px-1 rounded">
                            [hora]
                          </code>{" "}
                          - será substituído pela hora do agendamento
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="cancellationMessage" className="font-semibold">
                  Mensagem de Cancelamento
                </Label>
                <Textarea
                  id="cancellationMessage"
                  value={whatsappMessages.cancellationMessage}
                  onChange={(e) =>
                    handleCancellationMessageChange(e.target.value)
                  }
                  placeholder="Digite a mensagem de cancelamento... (Obrigatório incluir: [Nome-cliente])"
                  className={`mt-2 min-h-[100px] ${
                    validationErrors.cancellationMessage.length > 0
                      ? "border-red-500 border-2 focus:border-red-500"
                      : ""
                  }`}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Variáveis disponíveis:
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    [Nome-cliente]
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    [data]
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    [hora]
                  </span>
                </div>
                {validationErrors.cancellationMessage.length > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm font-medium mb-2">
                      ⚠️ Campos obrigatórios faltando:{" "}
                      {validationErrors.cancellationMessage.join(", ")}
                    </p>
                    <p className="text-red-600 text-xs">
                      <strong>Como resolver:</strong> Adicione as seguintes
                      caixas na sua mensagem:
                    </p>
                    <ul className="text-red-600 text-xs mt-1 ml-4">
                      {validationErrors.cancellationMessage.includes(
                        "Nome-cliente"
                      ) && (
                        <li>
                          •{" "}
                          <code className="bg-red-100 px-1 rounded">
                            [Nome-cliente]
                          </code>{" "}
                          - será substituído pelo nome do cliente
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                onClick={saveWhatsappMessages}
                disabled={isLoadingMessages}
                className="w-full bg-emerald-500 hover:bg-emerald-400"
              >
                {isLoadingMessages ? "Salvando..." : "Salvar Mensagens"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="mt-4">
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="align-center"
        >
          Sair da Conta <LogOut className="h-4 w-4" />
        </Button>
      </section>

      {/* Componente ImageCrop */}
      <ImageCrop
        isOpen={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        onCropComplete={handleCropComplete}
        imageFile={selectedImageFile}
      />
    </div>
  );
}
