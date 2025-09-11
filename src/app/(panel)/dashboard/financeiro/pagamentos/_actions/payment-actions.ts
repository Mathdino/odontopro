interface MarkAppointmentAsPaidParams {
  appointmentId: string;
  paymentMethod: "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER";
}

interface MarkAppointmentOverdueParams {
  appointmentId: string;
}

export async function markAppointmentAsPaid({
  appointmentId,
  paymentMethod,
}: MarkAppointmentAsPaidParams) {
  try {
    const response = await fetch('/api/appointments/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        paymentMethod,
        action: 'mark_paid',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Failed to register payment' };
    }

    return { data: result.message };
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    return { error: "Erro ao registrar pagamento" };
  }
}

export async function markAppointmentOverdue({
  appointmentId,
}: MarkAppointmentOverdueParams) {
  try {
    const response = await fetch('/api/appointments/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        action: 'mark_overdue',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Failed to mark as overdue' };
    }

    return { data: result.message };
  } catch (error) {
    console.error("Erro ao marcar como atrasado:", error);
    return { error: "Erro ao marcar como atrasado" };
  }
}