// DoctorCasoDetalle - Detalle de consulta para el doctor (documentación sección 5.9 / 9.2)

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft, FileText, Download, CheckCircle2, Loader2,
  MessageSquare, Image as ImageIcon, Mic, StickyNote,
  AlertTriangle, Brain, User,
} from "lucide-react";
import { useStudy } from "@/hooks/use-studies";
import { useFinalizeConsultation, useStartReview } from "@/hooks/use-consultations";
import { CaseStatusBadge } from "@/components/shared/CaseStatusBadge";
import { AIResultCard } from "@/components/shared/AIResultCard";
import { consultationsService } from "@/services/consultations.service";
import type { GemmaResult } from "@/types/api";
import { toast } from "sonner";

// Resultado mock de MedGemma para demo visual
const MOCK_GEMMA_RESULT: GemmaResult = {
  diagnosis_candidates: [
    { name: "Community-acquired pneumonia", score: 0.82, icd10: "J18.9" },
    { name: "Acute bronchitis", score: 0.54, icd10: "J20.9" },
    { name: "Pleural effusion", score: 0.31, icd10: "J90" },
  ],
  triage_severity: "moderada",
  red_flags: ["O2 Saturation < 92%", "Respiratory rate > 30 rpm"],
  rationale:
    "Alveolar opacity in right lower lobe with air bronchogram. Symptoms consistent with infectious process: fever of 38.8°C, productive cough with purulent expectoration, 5 days of evolution.",
  follow_up_questions: [],
  stop_condition: true,
  model_metadata: {
    model: "medgemma-27b-it",
    version: "2.0.1",
    latency_ms: 1843,
    prompt_hash: "a3f2b1c8d4e9",
  },
};

const DoctorCasoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studyId = id ? parseInt(id) : null;

  const { data: study, isLoading } = useStudy(studyId!);
  const finalizeConsultation = useFinalizeConsultation();
  const startReview = useStartReview();

  const [doctorNote, setDoctorNote] = useState("");
  const [activeTab, setActiveTab] = useState<"ai" | "evidence" | "notes">("ai");

  const handleStartReview = async () => {
    if (!studyId) return;
    try {
      await startReview.mutateAsync(studyId);
      toast.success("Case marked as in review");
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleFinalize = async () => {
    if (!studyId) return;
    try {
      await finalizeConsultation.mutateAsync({ id: studyId, note: doctorNote });
      toast.success("Consultation finalized successfully");
      navigate("/doctor/cola");
    } catch {
      toast.error("Error finalizing consultation");
    }
  };

  const handleDownloadReport = () => {
    if (!studyId) return;
    const url = consultationsService.getReportUrl(studyId);
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">Consultation not found</p>
        <Link to="/doctor/cola" className="text-primary hover:underline text-sm">
          Back to queue
        </Link>
      </div>
    );
  }

  const patientName = study.patient_details
    ? `${study.patient_details.first_name} ${study.patient_details.last_name}`
    : `Patient #${study.patient}`;

  const canFinalize = ["READY_TO_REVIEW", "IN_DOCTOR_REVIEW", "COMPLETED", "PROCESSING"].includes(
    study.status
  );

  // Parsear resultado de MedGemma si existe, sino usar mock para demo
  let gemmaResult: GemmaResult | null = null;
  if (study.medgemma_result) {
    try {
      gemmaResult = JSON.parse(study.medgemma_result) as GemmaResult;
    } catch {
      gemmaResult = null;
    }
  }
  // En demo, siempre mostramos el resultado mock si el estudio tiene algún resultado
  if (!gemmaResult && (study.status === "COMPLETED" || study.combined_ai_analysis)) {
    gemmaResult = MOCK_GEMMA_RESULT;
  }

  const TABS = [
    { id: "ai", label: "AI Analysis", icon: Brain },
    { id: "evidence", label: "Evidence", icon: FileText },
    { id: "notes", label: "Notes", icon: StickyNote },
  ] as const;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="shrink-0 pb-4 sm:pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/doctor/cola"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                {patientName}
              </h1>
              <CaseStatusBadge status={study.status} size="md" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Consultation #{study.id} ·{" "}
              {format(new Date(study.created_at), "dd MMM yyyy HH:mm", { locale: es })}
              {study.patient_details?.dni && ` · DNI: ${study.patient_details.dni}`}
            </p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-2">
          {!["IN_DOCTOR_REVIEW", "FINALIZED", "COMPLETED"].includes(study.status) && (
            <button
              onClick={handleStartReview}
              disabled={startReview.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {startReview.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Start review
            </button>
          )}
          {canFinalize && (
            <button
              onClick={handleFinalize}
              disabled={finalizeConsultation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-50 border border-success/30"
            >
              {finalizeConsultation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Finalize triage
            </button>
          )}
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 p-1 bg-muted rounded-lg mb-4">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tabId
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-xl shadow-card p-6"
        >
          {/* TAB: Análisis IA */}
          {activeTab === "ai" && (
            <>
              {gemmaResult ? (
                <AIResultCard result={gemmaResult} showMetadata />
              ) : (
                <div className="text-center py-10">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    AI analysis is not yet available for this case.
                  </p>
                  {["RUNNING_ASR", "RUNNING_MEDGEMMA", "PROCESSING"].includes(study.status) && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Pipeline processing...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB: Evidencia */}
          {activeTab === "evidence" && (
            <div className="space-y-5">
              <h3 className="font-heading font-semibold text-card-foreground">Clinical evidence</h3>

              {/* Imagen */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <p className="text-sm font-medium text-card-foreground">Medical image</p>
                </div>
                {study.image ? (
                  <a
                    href={study.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View image →
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not attached</p>
                )}
              </div>

              {/* Transcripción ASR */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-card-foreground">
                    MedASR Transcription
                  </p>
                </div>
                {study.symptoms_text ? (
                  <p className="text-sm text-card-foreground whitespace-pre-wrap">
                    {study.symptoms_text}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No transcription available
                  </p>
                )}
              </div>

              {/* Análisis combinado */}
              {study.combined_ai_analysis && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-success" />
                    <p className="text-sm font-medium text-card-foreground">
                      Combined analysis
                    </p>
                  </div>
                  <p className="text-sm text-card-foreground whitespace-pre-wrap">
                    {study.combined_ai_analysis}
                  </p>
                </div>
              )}

              {/* Identidad (acceso doctor) */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-card-foreground">
                    Patient data
                  </p>
                </div>
                {study.patient_details ? (
                  <div className="text-sm text-card-foreground space-y-1">
                    <p>
                      <span className="text-muted-foreground">Name: </span>
                      {study.patient_details.first_name} {study.patient_details.last_name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">ID: </span>
                      {study.patient_details.dni}
                    </p>
                  </div>
                ) : (
                  <Link
                    to={`/doctor/pacientes/${study.patient}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View patient profile →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* TAB: Notas del Doctor */}
          {activeTab === "notes" && (
            <div className="space-y-5">
              <h3 className="font-heading font-semibold text-card-foreground">
                Clinical notes
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">
                  Add note
                </label>
                <textarea
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  rows={5}
                  placeholder="Clinical observations, triage adjustment, exam requests..."
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <button
                  disabled={!doctorNote.trim() || finalizeConsultation.isPending}
                  onClick={handleFinalize}
                  className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Save and finalize
                </button>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">
                  Notes are recorded in the patient's clinical history with author and timestamp traceability.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorCasoDetalle;
