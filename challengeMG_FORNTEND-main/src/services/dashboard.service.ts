import { apiClient } from "@/lib/api-client";
import type { DashboardResponse } from "@/types/api";

export const dashboardService = {
  /**
   * Obtener las estadísticas y casos activos para el dashboard
   */
  async getStats(): Promise<DashboardResponse> {
    return apiClient.get<DashboardResponse>("/api/dashboard/stats/");
  },
};
