import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rating, comment, clinicId } = body;

    // Validações
    if (!name || !rating || !comment || !clinicId) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: "A nota deve estar entre 0 e 5" },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nome deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: "Comentário deve ter pelo menos 10 caracteres" },
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

    // Criar a avaliação
    const review = await prisma.review.create({
      data: {
        name: name.trim(),
        rating: parseInt(rating),
        comment: comment.trim(),
        clinicId,
      },
    });

    return NextResponse.json({
      ok: true,
      review,
      message: "Avaliação criada com sucesso!",
    });
  } catch (err) {
    console.error("Erro ao criar avaliação:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
