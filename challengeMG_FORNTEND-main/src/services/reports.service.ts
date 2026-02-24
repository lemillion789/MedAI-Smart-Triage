// Reports Service - Servicio para gestión de reportes clínicos

import { apiClient } from "@/lib/api-client";
import type { Report, ReportCreate } from "@/types/api";

export const reportsService = {
  /**
   * Crear un nuevo reporte clínico
   * @param data - Datos del reporte (study ID, doctor ID, diagnosis, recommendations)
   */
  async createReport(data: ReportCreate): Promise<Report> {
    return apiClient.post<Report>("/api/reports/", data);
  },

  /**
   * Obtener un reporte específico por ID
   */
  async getReport(id: number): Promise<Report> {
    return apiClient.get<Report>(`/api/reports/${id}/`);
  },

  /**
   * Obtener lista de todos los reportes
   */
  async getReports(): Promise<Report[]> {
    return apiClient.get<Report[]>("/api/reports/");
  },

  /**
   * Obtener reportes de un estudio específico
   * @param studyId - ID del estudio
   */
  async getReportsByStudy(studyId: number): Promise<Report[]> {
    return apiClient.get<Report[]>("/api/reports/", {
      params: { study: studyId },
    });
  },

  /**
   * Actualizar un reporte existente
   */
  async updateReport(id: number, data: Partial<ReportCreate>): Promise<Report> {
    return apiClient.patch<Report>(`/api/reports/${id}/`, data);
  },
};
