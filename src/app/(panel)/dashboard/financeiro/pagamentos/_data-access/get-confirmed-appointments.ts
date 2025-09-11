export async function getAllAppointments(userId: string) {
  console.log("Fetching all appointments via API for user:", userId);
  
  try {
    const response = await fetch('/api/appointments/confirmed', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const appointments = await response.json();
    
    console.log("Found appointments:", appointments.length);
    console.log("Appointments:", appointments);
    return appointments;
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return [];
  }
}