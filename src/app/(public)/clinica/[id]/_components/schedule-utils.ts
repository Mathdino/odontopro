/**
 *  Verificar se o slot já passou
 */
export function isSlotInThePast(slotTime: string) {
  const [slotHour, slotMinute] = slotTime.split(":").map(Number);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (slotHour < currentHour) {
    return true;
  } else if (slotHour === currentHour && slotMinute <= currentMinute) {
    return true;
  }
  return false;
}

/**
 * Verificar se o dia já passou
 */
export function isToday(date: Date) {
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Verificar se o slot está bloqueado considerando a duração dos serviços
 */
export function isSlotSequenceAvailable(
  slotStart: string, // Primeiro horario disponivel
  requiredSlots: number, // Quantidade de slots necessarios
  allSlots: string[], // Todos os slots disponiveis
  blockedSlots: string[] // Todos os slots bloqueados
) {
  const startIndex = allSlots.indexOf(slotStart);
  if (startIndex === -1) {
    return false;
  }
  
  // Verificar se há slots suficientes disponíveis
  if (startIndex + requiredSlots > allSlots.length) {
    return false;
  }

  // Verificar se todos os slots necessários estão disponíveis
  for (let i = startIndex; i < startIndex + requiredSlots; i++) {
    const slotTime = allSlots[i];

    //Verificar se o slot está bloqueado
    if (blockedSlots.includes(slotTime)) {
      return false;
    }
  }

  return true;
}