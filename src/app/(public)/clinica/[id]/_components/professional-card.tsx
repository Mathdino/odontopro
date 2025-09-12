"use client";

import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import Image from "next/image";

interface Professional {
  id: string;
  name: string;
  specialty?: string | null;
  profileImage?: string | null;
  availableTimes: string[];
}

interface ProfessionalCardProps {
  professional: Professional;
  isSelected: boolean;
  onSelect: (professionalId: string) => void;
  isAvailable?: boolean; // Add availability status
}

export function ProfessionalCard({
  professional,
  isSelected,
  onSelect,
  isAvailable = true, // Default to available
}: ProfessionalCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-emerald-500 bg-emerald-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onSelect(professional.id)}
    >
      <div className="flex items-center gap-3">
        {/* Foto do profissional */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {professional.profileImage ? (
            <Image
              src={professional.profileImage}
              alt={professional.name}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Informações do profissional */}
        <div className="flex-1">
          <h4 className="font-medium text-sm">{professional.name}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className={isAvailable ? "text-green-600" : "text-red-600"}>
              {isAvailable ? "Disponível" : "Ocupado"}
            </span>
          </div>
        </div>

        {/* Indicador de seleção */}
        {isSelected && (
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}