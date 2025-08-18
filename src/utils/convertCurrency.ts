
/**
 * Converte um valor em reais para centavos
 * @param { string } amount - Valor em reais
 * @returns { number } - Valor em centavos
 */
export function convertRealToCents(amount: string) {
  // Remove o símbolo R$ e espaços
  let cleanAmount = amount.replace('R$', '').trim()
  
  // Se tem vírgula, é o separador decimal brasileiro
  if (cleanAmount.includes(',')) {
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.')
  }
  
  const numericPrice = parseFloat(cleanAmount)
  const priceInCents = Math.round(numericPrice * 100)

  return priceInCents
}