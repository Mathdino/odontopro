//Backend

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

//Buscar agendamentos em uma data específica
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const dateParam = searchParams.get("date");

  if(!userId || userId === "null" || !dateParam || dateParam === "null") {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  try {
    const [year, mounth, day] = dateParam.split("-").map(Number)
    const startDate = new Date(year, mounth - 1, day, 0, 0, 0)
    const endDate = new Date(year, mounth - 1, day, 23, 59, 59, 999)


  }catch(err){
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
}
