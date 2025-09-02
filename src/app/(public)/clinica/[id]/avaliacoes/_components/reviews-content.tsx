"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import imgTest from "../../../../../../../public/foto1.png";
import { MapPin, ChevronLeft, Heart, Star, Plus } from "lucide-react";
import { Prisma } from "../../../../../../generated/prisma";
import { Button } from "@/components/ui/button";
import { AddReviewForm } from "./add-review-form";
import { toast } from "sonner";

type UserWithServiceAndSubscription = Prisma.UserGetPayload<{
  include: {
    services: {
      include: {
        category: true;
      };
    };
    subscription: true;
    reviews: true;
  };
}>;

interface ReviewsContentProps {
  clinic: UserWithServiceAndSubscription;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export function ReviewsContent({ clinic }: ReviewsContentProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingReview, setIsAddingReview] = useState(false);

  // Carregar avaliações da clínica
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `/api/reviews/get-reviews?clinicId=${clinic.id}`
        );
        const data = await response.json();
        if (data.ok) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
      }
    };

    fetchReviews();
  }, [clinic.id]);

  // Função para recarregar avaliações
  const reloadReviews = async () => {
    try {
      const response = await fetch(
        `/api/reviews/get-reviews?clinicId=${clinic.id}`
      );
      const data = await response.json();
      if (data.ok) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Erro ao recarregar avaliações:", error);
    }
  };

  // Calcular média das avaliações
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  // Função para renderizar estrelas baseada na média
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;

    // Estrelas cheias
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Image
          key={`full-${i}`}
          src="/star-100.svg"
          alt="Estrela cheia"
          width={16}
          height={16}
          className="w-4 h-4"
        />
      );
    }

    // Estrela parcial
    if (decimal > 0) {
      let starType = "star-0.svg";

      if (decimal >= 0.1 && decimal <= 0.3) {
        starType = "star-20.svg";
      } else if (decimal >= 0.4 && decimal <= 0.6) {
        starType = "star-50.svg";
      } else if (decimal >= 0.7 && decimal <= 0.9) {
        starType = "star-80.svg";
      }

      stars.push(
        <Image
          key="partial"
          src={`/${starType}`}
          alt="Estrela parcial"
          width={16}
          height={16}
          className="w-4 h-4"
        />
      );
    }

    // Estrelas vazias
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Image
          key={`empty-${i}`}
          src="/star-0.svg"
          alt="Estrela vazia"
          width={16}
          height={16}
          className="w-4 h-4"
        />
      );
    }

    return stars;
  };

  const handleGoBack = () => {
    router.push(`/clinica/${clinic.id}`);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(
      !isFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos"
    );
  };

  const handleAddReview = () => {
    setIsAddingReview(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`h-32 ${clinic.headerColor || "bg-emerald-500"}`}>
        {/* Header com ícones */}
        <div className="flex justify-between items-center p-4 pt-8">
          <button
            onClick={handleGoBack}
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
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(averageRating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({reviews.length} avaliações)
                  </span>
                </div>
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
              </div>

              {/* Botão para adicionar avaliação */}
              <div className="w-full mt-6">
                <Button
                  onClick={handleAddReview}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Avaliação
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Seção de Avaliações */}
      <section className="max-w-2xl mx-auto w-full mt-6 px-4">
        <div className="bg-white rounded-lg p-6">
          {/* Seção de Resumo das Avaliações */}
          {reviews.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Resumo</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {renderStars(averageRating)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {reviews.length} avaliações
                    </div>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(
                        (r) => r.rating === star
                      ).length;
                      const percentage =
                        reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 mb-1"
                        >
                          <span className="text-sm text-gray-600 w-2">
                            {star}
                          </span>
                          <Image
                            src="/star-100.svg"
                            alt="Estrela"
                            width={12}
                            height={12}
                            className="w-3 h-3"
                          />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gray-800 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-lg font-bold mb-4">Comentários</h2>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ainda não há avaliações para esta clínica.</p>
              <p className="text-sm mt-2">Seja o primeiro a avaliar!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => {
                const daysSince = Math.floor(
                  (new Date().getTime() -
                    new Date(review.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const timeText =
                  daysSince === 0
                    ? "hoje"
                    : daysSince === 1
                    ? "há 1 dia"
                    : `há ${daysSince} dia${daysSince > 1 ? "s" : ""}`;

                return (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-base">
                            {review.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {timeText}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal de Adicionar Avaliação */}
      {isAddingReview && (
        <AddReviewForm
          clinicId={clinic.id}
          clinicName={clinic.name}
          isOpen={isAddingReview}
          onClose={() => setIsAddingReview(false)}
          onReviewAdded={() => {
            setIsAddingReview(false);
            // Recarregar avaliações
            reloadReviews();
          }}
        />
      )}
    </div>
  );
}
