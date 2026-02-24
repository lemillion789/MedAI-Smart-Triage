// Hooks de consultas - React Query (documentación sección 5.11)

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { consultationsService } from "@/services/consultations.service";
import type { ConsultationCreate, ConsultationInputs, AnswerSubmission, DoctorNoteCreate } from "@/types/api";

const QUERY_KEYS = {
  all: ["consultations"] as const,
  list: (params?: object) => ["consultations", "list", params] as const,
  detail: (id: number) => ["consultations", id] as const,
  patientHistory: (patientId: number) => ["consultations", "history", patientId] as const,
};

/** Lista de consultas (cola de triaje para doctor) */
export function useConsultations(params?: {
  status?: string;
  severity?: string;
  patient?: number;
  ordering?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => consultationsService.getConsultations(params),
    staleTime: 30_000, // 30s - cola de triaje debe refrescarse frecuentemente
    refetchInterval: 60_000, // Auto-refresh cada 60s
  });
}

/** Consulta individual por ID */
export function useConsultation(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => consultationsService.getConsultation(id!),
    enabled: id != null,
    staleTime: 10_000,
    refetchInterval: (query) => {
      // Refrescar automáticamente mientras el pipeline está corriendo
      const status = query.state.data?.status;
      const activeStatuses = ["RUNNING_ASR", "RUNNING_MEDGEMMA", "WAITING_INPUTS"];
      return activeStatuses.includes(status ?? "") ? 5_000 : false;
    },
  });
}

/** Historial de consultas de un paciente */
export function usePatientConsultationHistory(patientId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.patientHistory(patientId!),
    queryFn: () => consultationsService.getPatientHistory(patientId!),
    enabled: patientId != null,
    staleTime: 5 * 60_000,
  });
}

/** Crear consulta DRAFT o inicializar Triaje (Fase 1) */
export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { patient: number; image?: File; audio?: File }) => 
      consultationsService.createConsultation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.all });
      qc.invalidateQueries({ queryKey: ["studies"] });
    },
  });
}

/** Adjuntar inputs (imagen/audio) */
export function useSubmitInputs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, inputs }: { id: number; inputs: ConsultationInputs }) =>
      consultationsService.submitInputs(id, inputs),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

/** Disparar pipeline de inferencia */
export function useRunPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => consultationsService.runPipeline(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

/** Enviar respuestas al Q&A de MedGemma */
export function useSubmitAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AnswerSubmission }) =>
      consultationsService.submitAnswers(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

/** Finalizar consulta (doctor) */
export function useFinalizeConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      consultationsService.finalizeConsultation(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/** Iniciar revisión médica */
export function useStartReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => consultationsService.startReview(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/** Agregar nota del doctor */
export function useAddDoctorNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ consultationId, data }: { consultationId: number; data: DoctorNoteCreate }) =>
      consultationsService.addDoctorNote(consultationId, data),
    onSuccess: (_, { consultationId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.detail(consultationId) });
    },
  });
}
