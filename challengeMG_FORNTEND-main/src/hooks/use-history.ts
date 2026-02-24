// useHistory Hook - React Query hooks para gestión de historia clínica

import { useQuery } from "@tanstack/react-query";
import { historyService } from "@/services";

const HISTORY_KEY = "history";

/**
 * Hook para obtener la historia clínica de un paciente
 * @param patientId - ID del paciente
 * @returns Lista cronológica de atenciones (estudios AI, reportes médicos, diagnósticos)
 */
export function usePatientHistory(patientId: number) {
  return useQuery({
    queryKey: [HISTORY_KEY, patientId],
    queryFn: () => historyService.getPatientHistory(patientId),
    enabled: !!patientId,
  });
}
