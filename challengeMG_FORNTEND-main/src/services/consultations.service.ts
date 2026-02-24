// Consultations Service - Servicio de consultas/encounters (documentación sección 5.11)

import { apiClient } from "@/lib/api-client";
import type {
  Consultation,
  ConsultationCreate,
  ConsultationInputs,
  AnswerSubmission,
  DoctorNote,
  DoctorNoteCreate,
} from "@/types/api";

export const consultationsService = {
  /**
   * Crear nueva consulta e inicializar triaje (Fase 1)
   * POST /api/consultations/
   */
  async createConsultation(data: { patient: number; image?: File; audio?: File }): Promise<Consultation> {
    const formData = new FormData();
    formData.append("patient_id", String(data.patient));
    if (data.image) {
      formData.append("image", data.image);
    }
    if (data.audio) {
      formData.append("audio", data.audio);
    }
    
    // Si enviamos archivos, usamos postFormData
    if (data.image || data.audio) {
      return apiClient.postFormData<Consultation>("/api/consultations/", formData);
    }
    
    // Fallback para creación simple (DRAFT)
    return apiClient.post<Consultation>("/api/consultations/", { patient: data.patient });
  },

  /**
   * Adjuntar imagen/audio a una consulta existente
   * POST /consultations/:id/inputs
   */
  async submitInputs(id: number, inputs: ConsultationInputs): Promise<Consultation> {
    const formData = new FormData();
    formData.append("image", inputs.image);
    if (inputs.symptoms_audio) {
      formData.append("symptoms_audio", inputs.symptoms_audio);
    }
    if (inputs.symptoms_text) {
      formData.append("symptoms_text", inputs.symptoms_text);
    }
    return apiClient.postFormData<Consultation>(`/api/consultations/${id}/inputs/`, formData);
  },

  /**
   * Disparar pipeline de inferencia (ASR + MedGemma)
   * POST /consultations/:id/run
   */
  async runPipeline(id: number): Promise<Consultation> {
    return apiClient.post<Consultation>(`/api/consultations/${id}/run/`);
  },

  /**
   * Obtener estado y artefactos de una consulta
   * GET /consultations/:id
   */
  async getConsultation(id: number): Promise<Consultation> {
    return apiClient.get<Consultation>(`/api/consultations/${id}/`);
  },

  /**
   * Listar todas las consultas (cola de triaje para el doctor)
   * GET /consultations
   */
  async getConsultations(params?: {
    status?: string;
    severity?: string;
    patient?: number;
    ordering?: string;
  }): Promise<Consultation[]> {
    return apiClient.get<Consultation[]>("/api/consultations/", { params });
  },

  /**
   * Enviar respuestas a las preguntas generadas por MedGemma
   * POST /consultations/:id/answers
   */
  async submitAnswers(id: number, data: AnswerSubmission): Promise<Consultation> {
    return apiClient.post<Consultation>(`/api/consultations/${id}/answers/`, data);
  },

  /**
   * Finalizar consulta por el doctor
   * POST /consultations/:id/finalize
   */
  async finalizeConsultation(id: number, note?: string): Promise<Consultation> {
    return apiClient.post<Consultation>(`/api/consultations/${id}/finalize/`, {
      note: note || "",
    });
  },

  /**
   * Marcar consulta "En revisión médica"
   * POST /consultations/:id/start-review
   */
  async startReview(id: number): Promise<Consultation> {
    return apiClient.post<Consultation>(`/api/consultations/${id}/start-review/`);
  },

  /**
   * Obtener historial de consultas de un paciente
   * GET /patients/:id/history
   */
  async getPatientHistory(patientId: number): Promise<Consultation[]> {
    return apiClient.get<Consultation[]>(`/api/patients/${patientId}/history/`);
  },

  /**
   * Agregar nota del doctor a una consulta
   */
  async addDoctorNote(consultationId: number, data: DoctorNoteCreate): Promise<DoctorNote> {
    return apiClient.post<DoctorNote>(
      `/api/consultations/${consultationId}/notes/`,
      data
    );
  },

  /**
   * Descargar reporte PDF
   * GET /consultations/:id/report.pdf
   */
  getReportUrl(id: number): string {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    return `${base}/api/consultations/${id}/report.pdf`;
  },
};
