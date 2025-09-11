import { FilterType } from "../_components/financeiro-content";

export async function getFinancialMetrics(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined },
  professionalId?: string
) {
  try {
    const params = new URLSearchParams({
      filter,
      ...(professionalId && professionalId !== "all" && { professionalId }),
      ...(customRange?.from && { customFrom: customRange.from.toISOString() }),
      ...(customRange?.to && { customTo: customRange.to.toISOString() }),
    });

    const response = await fetch(`/api/financeiro/metrics?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar métricas financeiras:", error);
    return {
      grossRevenue: 0,
      completedServices: 0,
      uniqueClients: 0,
    };
  }
}

export async function getFinancialChartData(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined },
  professionalId?: string
) {
  try {
    const params = new URLSearchParams({
      filter,
      ...(professionalId && professionalId !== "all" && { professionalId }),
      ...(customRange?.from && { customFrom: customRange.from.toISOString() }),
      ...(customRange?.to && { customTo: customRange.to.toISOString() }),
    });

    const response = await fetch(`/api/financeiro/chart-data?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico:", error);
    return [];
  }
}

export async function getServicesRankingData(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined },
  professionalId?: string
) {
  try {
    const params = new URLSearchParams({
      filter,
      ...(professionalId && professionalId !== "all" && { professionalId }),
      ...(customRange?.from && { customFrom: customRange.from.toISOString() }),
      ...(customRange?.to && { customTo: customRange.to.toISOString() }),
    });

    const response = await fetch(`/api/financeiro/services-ranking?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar ranking de serviços:", error);
    return [];
  }
}

export async function getRevenueChartData(
  userId: string,
  filter: FilterType,
  customRange?: { from: Date | undefined; to: Date | undefined },
  professionalId?: string
) {
  try {
    const params = new URLSearchParams({
      filter,
      ...(professionalId && professionalId !== "all" && { professionalId }),
      ...(customRange?.from && { customFrom: customRange.from.toISOString() }),
      ...(customRange?.to && { customTo: customRange.to.toISOString() }),
    });

    const response = await fetch(`/api/financeiro/revenue-chart?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de receita:", error);
    return [];
  }
}

// Function to get all professionals for the filter
export async function getProfessionals(userId: string) {
  try {
    const response = await fetch('/api/financeiro/professionals', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const professionals = await response.json();
    return professionals;
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return [];
  }
}
