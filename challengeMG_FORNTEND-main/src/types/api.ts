// API Types - Basados en documentación MedAI Triage (MedGemma Challenge 2026)

// ============================================================================
// ROLES
// ============================================================================

export type UserRole = "patient" | "doctor";

// ============================================================================
// PACIENTES
// ============================================================================

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  age: number;
  birth_date?: string;
  sexo?: "M" | "F" | "otro";
  telefono?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  sexo?: "M" | "F" | "otro";
  telefono?: string;
}

export type PatientStatus = "ACTIVE" | "INACTIVE";

// ============================================================================
// CONSULTAS / ENCOUNTERS
// ============================================================================

/**
 * Estados de la máquina de estados de una consulta (documentación sección 4.2)
 */
export type ConsultationStatus =
  | "DRAFT"
  | "WAITING_INPUTS"
  | "RUNNING_ASR"
  | "RUNNING_MEDGEMMA"
  | "QUESTION_LOOP"
  | "READY_TO_REVIEW"
  | "IN_DOCTOR_REVIEW"
  | "FINALIZED"
  | "FAILED";

export interface Consultation {
  id: number;
  patient: number;
  patient_details?: {
    first_name: string;
    last_name: string;
    dni: string;
  };
  status: ConsultationStatus;
  created_at: string;
  updated_at?: string;
  // Artefactos
  image_url?: string;
  audio_url?: string;
  // Resultados
  asr_result?: ASRResult;
  gemma_result?: GemmaResult;
  // Metadatos de modelo
  model_metadata?: ModelMetadata;
  // Triage interactivo
  combined_ai_analysis?: string;
  triage_completed?: boolean;
  triage_history?: any;
}

export interface ConsultationCreate {
  patient: number;
}

export interface ConsultationInputs {
  image: File;
  symptoms_audio?: File;
  symptoms_text?: string;
}

// ============================================================================
// ESTUDIOS (ANÁLISIS AI) - Compatibilidad con backend actual
// ============================================================================

export type StudyStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | ConsultationStatus;

export interface Study {
  id: number;
  patient: number;
  patient_details?: {
    first_name: string;
    last_name: string;
    dni: string;
  };
  status: StudyStatus;
  image?: string;
  symptoms_audio?: string;
  medgemma_result?: string;
  symptoms_text?: string;
  combined_ai_analysis?: string;
  triage_completed?: boolean;
  triage_history?: any;
  created_at: string;
}

export interface StudyCreate {
  patient: number;
  image: File;
  symptoms_audio?: File;
}

// ============================================================================
// MedASR - Transcripción de síntomas
// ============================================================================

export interface ASRResult {
  transcript_text: string;
  confidence?: number;
  timestamps?: Array<{ word: string; start: number; end: number }>;
  asr_metadata?: {
    model: string;
    version: string;
    latency_ms: number;
    language: string;
  };
}

// ============================================================================
// MedGemma - Análisis multimodal
// ============================================================================

export type Severity = "leve" | "moderada" | "severa";

export type QuestionType = "single_select" | "multi_select" | "numeric" | "text";

export interface DiagnosisCandidate {
  name: string;
  score: number; // 0-1
  icd10?: string;
}

export interface FollowUpQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
  required?: boolean;
}

export interface GemmaResult {
  diagnosis_candidates: DiagnosisCandidate[];
  triage_severity: Severity;
  red_flags: string[];
  rationale: string;
  follow_up_questions: FollowUpQuestion[];
  stop_condition: boolean;
  model_metadata?: ModelMetadata;
}

export interface ModelMetadata {
  model: string;
  version: string;
  latency_ms: number;
  prompt_hash?: string;
}

// ============================================================================
// QUESTION TURNS - Turnos de preguntas del bucle Q&A
// ============================================================================

export interface QuestionTurn {
  id: number;
  consultation_id: number;
  question_json: FollowUpQuestion[];
  answer_json: Record<string, string | string[] | number>;
  created_at: string;
}

export interface AnswerSubmission {
  answers: Record<string, string | string[] | number>;
}

// ============================================================================
// DOCTOR NOTES
// ============================================================================

export interface DoctorNote {
  id: number;
  consultation_id: number;
  author_id: number;
  text: string;
  created_at: string;
}

export interface DoctorNoteCreate {
  text: string;
}

// ============================================================================
// REPORTES CLÍNICOS
// ============================================================================

export interface Report {
  id: number;
  study: number;
  doctor: number;
  final_diagnosis: string;
  recommendations: string;
  created_at?: string;
}

export interface ReportCreate {
  study: number;
  doctor: number;
  final_diagnosis: string;
  recommendations: string;
}

// ============================================================================
// HISTORIA CLÍNICA
// ============================================================================

export interface HistoryEntry {
  id: number;
  title: string;
  description: string;
  attachments_url?: string;
  created_at: string;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLog {
  event_id: number;
  actor_role: UserRole;
  actor_id: number;
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardStats {
  waiting: number;
  processing: number;
  completed_today: number;
  errors: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  active_cases: Study[];
}


// ============================================================================
// HELPERS DE UI
// ============================================================================

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  DRAFT: "Draft",
  WAITING_INPUTS: "Waiting for inputs",
  RUNNING_ASR: "Transcribing audio",
  RUNNING_MEDGEMMA: "Analyzing with AI",
  QUESTION_LOOP: "Pending questions",
  READY_TO_REVIEW: "Ready for review",
  IN_DOCTOR_REVIEW: "In medical review",
  FINALIZED: "Finalized",
  FAILED: "Error",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  leve: "Mild",
  moderada: "Moderate",
  severa: "Severe",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  leve: "text-success bg-success/10",
  moderada: "text-warning bg-warning/10",
  severa: "text-destructive bg-destructive/10",
};
