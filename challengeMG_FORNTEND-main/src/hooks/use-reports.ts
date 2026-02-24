// useReports Hook - React Query hooks para gestión de reportes clínicos

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService } from "@/services";
import type { Report, ReportCreate } from "@/types/api";

const REPORTS_KEY = "reports";

/**
 * Hook para obtener lista de reportes
 */
export function useReports() {
  return useQuery({
    queryKey: [REPORTS_KEY],
    queryFn: () => reportsService.getReports(),
  });
}

/**
 * Hook para obtener un reporte específico
 */
export function useReport(id: number) {
  return useQuery({
    queryKey: [REPORTS_KEY, id],
    queryFn: () => reportsService.getReport(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener reportes de un estudio
 */
export function useReportsByStudy(studyId: number) {
  return useQuery({
    queryKey: [REPORTS_KEY, "study", studyId],
    queryFn: () => reportsService.getReportsByStudy(studyId),
    enabled: !!studyId,
  });
}

/**
 * Hook para crear un nuevo reporte clínico
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReportCreate) => reportsService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REPORTS_KEY] });
    },
  });
}

/**
 * Hook para actualizar un reporte
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ReportCreate> }) =>
      reportsService.updateReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [REPORTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORTS_KEY, variables.id] });
    },
  });
}
