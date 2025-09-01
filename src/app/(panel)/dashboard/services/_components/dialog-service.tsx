"use client";

import { useState, useRef } from "react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDialogServiceForm, DialogServiceFormData } from "./service-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { convertRealToCents } from "@/utils/convertCurrency";
import { createService } from "../_actions/create-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateService } from "../_actions/update-service";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { ImageCrop } from "./image-crop";

interface DialogServiceProps {
  closeModal: () => void;
  serviceId?: string;
  categories: Array<{ id: string; name: string }>;
  initialValues?: {
    name: string;
    description?: string;
    categoryId?: string;
    image?: string;
    price: string;
    hours: string;
    minutes: string;
  };
}

export function DialogService({
  closeModal,
  serviceId,
  categories,
  initialValues,
}: DialogServiceProps) {
  const form = useDialogServiceForm({ initialValues });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialValues?.image || null
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onSubmit(values: DialogServiceFormData) {
    setLoading(true);
    const priceInCents = convertRealToCents(values.price);
    const hours = parseInt(values.hours) || 0;
    const minutes = parseInt(values.minutes) || 0;
    const duration = hours * 60 + minutes;

    // Usar a imagem do preview se disponível, senão usar a genérica
    let imageUrl = "img-generic.png";
    if (imagePreview) {
      imageUrl = imagePreview;
    }

    if (serviceId) {
      await editServiceById({
        serviceId,
        name: values.name,
        description: values.description || "",
        categoryId: values.categoryId,
        image: imageUrl,
        priceInCents,
        duration: duration,
      });

      setLoading(false);
      return;
    }

    const response = await createService({
      name: values.name,
      description: values.description || "",
      categoryId: values.categoryId,
      image: imageUrl,
      price: priceInCents,
      duration: duration,
    });

    setLoading(false);

    if (response.error) {
      toast.error(response.error);
      return;
    }

    toast.success("Serviço cadastrado com sucesso");
    router.refresh();
    handleCloseModal();
  }

  async function editServiceById({
    serviceId,
    name,
    description,
    categoryId,
    image,
    priceInCents,
    duration,
  }: {
    serviceId: string;
    name: string;
    description: string;
    categoryId: string;
    image: string;
    priceInCents: number;
    duration: number;
  }) {
    const response = await updateService({
      serviceId,
      name,
      description,
      categoryId,
      image,
      price: priceInCents,
      duration,
    });

    setLoading(false);

    if (response?.error) {
      toast.error(response.error);
      return;
    }

    if (response?.data) {
      toast.success(response.data);
      router.refresh();
      handleCloseModal();
    }
  }

  function handleCloseModal() {
    form.reset();
    setImagePreview(null);
    setSelectedImage(null);
    closeModal();
  }

  function changeCurrency(event: React.ChangeEvent<HTMLInputElement>) {
    let { value } = event.target;
    value = value.replace(/\D/g, "");

    if (value) {
      value = (parseInt(value, 10) / 100).toFixed(2);
      value = value.replace(".", ",");
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      value = `R$ ${value}`;
    }

    event.target.value = value;
    form.setValue("price", value);
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempImageSrc(result);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempImageSrc(result);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setImagePreview(croppedImageUrl);
    form.setValue("image", croppedImageUrl);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {serviceId ? "Editar Serviço" : "Novo Serviço"}
        </DialogTitle>
        <DialogDescription>
          {serviceId
            ? "Edite as informações do serviço"
            : "Adicione um novo serviço"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Nome do Serviço */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nome do serviço</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Digite o nome do serviço..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descreva o serviço..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload de Imagem */}
          <div className="space-y-2">
            <label className="font-semibold text-sm">Imagem do serviço</label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={150}
                    className="rounded-lg object-cover mx-auto"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Imagem
              </Button>
            </div>
          </div>

          {/* Preço */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  Valor do serviço
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={changeCurrency}
                    placeholder="Ex: 100,00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duração */}
          <div className="space-y-2">
            <p className="font-semibold text-sm">Tempo de duração do serviço</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Horas</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: 1"
                        min="0"
                        max="24"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Minutos</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: 20"
                        min="0"
                        max="59"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-semibold text-white bg-emerald-500 hover:bg-emerald-400"
            disabled={loading}
          >
            {loading
              ? "Salvando..."
              : `${serviceId ? "Atualizar Serviço" : "Cadastrar Serviço"}`}
          </Button>
        </form>
      </Form>

      <ImageCrop
        isOpen={showImageCrop}
        onClose={() => setShowImageCrop(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
