const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatCurrency(number: number) {
  return CURRENCY_FORMATTER.format(number);
}

// Nova função para formatar preço com centavos menores
export function formatCurrencyWithSmallCents(number: number) {
  const formatted = CURRENCY_FORMATTER.format(number);
  const parts = formatted.split(",");

  if (parts.length === 2) {
    return {
      main: parts[0],
      cents: parts[1],
    };
  }

  return {
    main: formatted,
    cents: "00",
  };
}
