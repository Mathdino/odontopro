import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Buscar avaliações de uma clínica específica
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clinicId = url.searchParams.get("clinicId");

    if (!clinicId || clinicId === "null") {
      return NextResponse.json(
        { error: "ID da clínica é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a clínica existe
    const clinic = await prisma.user.findFirst({
      where: {
        id: clinicId,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clínica não encontrada" },
        { status: 404 }
      );
    }

    // Buscar todas as avaliações da clínica
    const reviews = await prisma.review.findMany({
      where: {
        clinicId: clinicId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calcular média das avaliações
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    return NextResponse.json({
      ok: true,
      reviews,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error("Erro na API de avaliações:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
