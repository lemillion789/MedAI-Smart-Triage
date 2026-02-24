import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardResponse } from "@/types/api";

export const DASHBOARD_QUERY_KEY = ["dashboard-stats"] as const;

export function useDashboardStats() {
  return useQuery<DashboardResponse>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 5000, // Refresco cada 5 segundos para mantener actualizado
  });
}
