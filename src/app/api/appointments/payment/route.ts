import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import getSession from "@/lib/getSession";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId, paymentMethod, action } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    // Verify that the appointment belongs to the authenticated user
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { userId: true, status: true, paymentStatus: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to modify this appointment" }, { status: 403 });
    }

    if (appointment.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Only confirmed appointments can be modified" }, { status: 400 });
    }

    if (action === "mark_paid") {
      if (!paymentMethod) {
        return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: "PAID",
          paymentMethod,
          paidAt: new Date(),
        },
      });

      return NextResponse.json({ message: "Payment registered successfully" });
    } else if (action === "mark_overdue") {
      if (appointment.paymentStatus === "PAID") {
        return NextResponse.json({ error: "Appointment is already paid" }, { status: 400 });
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: "OVERDUE",
        },
      });

      return NextResponse.json({ message: "Appointment marked as overdue" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing payment action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}