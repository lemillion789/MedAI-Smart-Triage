// History Service - Servicio para gestión de historia clínica

import { apiClient } from "@/lib/api-client";
import type { HistoryEntry } from "@/types/api";

export const historyService = {
  /**
   * Obtener la historia clínica completa de un paciente
   * @param patientId - ID del paciente
   * @returns Lista cronológica de atenciones (estudios AI, reportes médicos, diagnósticos)
   */
  async getPatientHistory(patientId: number): Promise<HistoryEntry[]> {
    return apiClient.get<HistoryEntry[]>(`/api/patients/${patientId}/history/`);
  },
};
