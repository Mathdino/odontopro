"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface AddReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
  onReviewAdded: () => void;
}

export function AddReviewForm({
  isOpen,
  onClose,
  clinicId,
  clinicName,
  onReviewAdded,
}: AddReviewFormProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !comment.trim() || rating === 0) {
      toast.error("Preencha todos os campos e selecione uma nota");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews/create-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          rating,
          comment,
          clinicId,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success("Avaliação adicionada com sucesso!");
        setName("");
        setRating(0);
        setComment("");
        onReviewAdded();
        onClose();
      } else {
        toast.error(data.error || "Erro ao adicionar avaliação");
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Erro ao enviar avaliação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className="transition-colors hover:scale-110"
          >
            <Image
              src={star <= rating ? "/star-100.svg" : "/star-0.svg"}
              alt={`${star} estrela${star > 1 ? "s" : ""}`}
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {clinicName}</DialogTitle>
          <DialogDescription>Compartilhe sua experiência</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2" htmlFor="name">
              Seu nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              required
            />
          </div>

          <div>
            <Label className="mb-2">Sua avaliação</Label>
            <div className="mt-2">{renderStarRating()}</div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating} de 5 estrelas
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2" htmlFor="comment">
              Comentário
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte sobre sua experiência..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
