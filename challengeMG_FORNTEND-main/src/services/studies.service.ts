// Studies Service - Servicio para gestión de estudios (Análisis AI)

import { apiClient } from "@/lib/api-client";
import type { Study, StudyCreate } from "@/types/api";

export const studiesService = {
  /**
   * Crear un nuevo estudio con análisis AI
   * @param data - Datos del estudio (patient ID, image, symptoms_audio opcional)
   * @returns Estudio creado con análisis AI completo
   */
  async createStudy(data: StudyCreate): Promise<Study> {
    const formData = new FormData();
    formData.append("patient", String(data.patient));
    formData.append("image", data.image);

    if (data.symptoms_audio) {
      formData.append("symptoms_audio", data.symptoms_audio);
    }

    return apiClient.postFormData<Study>("/api/studies/", formData);
  },

  /**
   * Obtener un estudio específico por ID
   * @param id - ID del estudio
   */
  async getStudy(id: number): Promise<Study> {
    return apiClient.get<Study>(`/api/studies/${id}/`);
  },

  /**
   * Obtener lista de todos los estudios
   */
  async getStudies(): Promise<Study[]> {
    return apiClient.get<Study[]>("/api/studies/");
  },

  /**
   * Obtener estudios de un paciente específico
   * @param patientId - ID del paciente
   */
  async getStudiesByPatient(patientId: number): Promise<Study[]> {
    return apiClient.get<Study[]>("/api/studies/", {
      params: { patient: patientId },
    });
  },
  /**
   * Enviar respuesta de triaje iterativo (Fase 2)
   * POST /api/studies/:id/triage/
   */
  async submitTriageAnswer(studyId: number, answer: string): Promise<Study> {
    return apiClient.post<Study>(`/api/studies/${studyId}/triage/`, { answer });
  },
};
