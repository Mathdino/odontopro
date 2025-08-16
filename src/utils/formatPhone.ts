export function formatPhone(value: string) {
  //Remover todos caracteres não numericos
  const cleanedValue = value.replace(/\D/g, "")

  if(cleanedValue.length > 11){
  return value.slice(0, 15)
  }

  //Aplicar mascara
  const formattedValue = cleanedValue.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")

  return formattedValue
}

export function extractPhoneNumber(phone: string){
  //Remover formatação para levar o número "cru" para o banco
  const phoneValue = phone.replace(/[\(\)/s-]/g, "")

  return phoneValue;

}