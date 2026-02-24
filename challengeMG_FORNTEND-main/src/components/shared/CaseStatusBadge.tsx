// CaseStatusBadge - Badge de estado de consulta (documentación sección 9.3)

import type { ConsultationStatus, StudyStatus } from "@/types/api";
import { CONSULTATION_STATUS_LABELS } from "@/types/api";

type AnyStatus = ConsultationStatus | StudyStatus | string;

const STATUS_STYLES: Record<string, string> = {
  // Estados del pipeline de documentación
  DRAFT: "bg-muted text-muted-foreground",
  WAITING_INPUTS: "bg-muted text-muted-foreground",
  RUNNING_ASR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RUNNING_MEDGEMMA: "bg-primary/10 text-primary animate-pulse",
  QUESTION_LOOP: "bg-warning/10 text-warning",
  READY_TO_REVIEW: "bg-success/10 text-success",
  IN_DOCTOR_REVIEW: "bg-accent/10 text-accent",
  FINALIZED: "bg-success/15 text-success",
  FAILED: "bg-destructive/10 text-destructive",
  // Compatibilidad con estados legacy del backend
  PENDING: "bg-muted text-muted-foreground",
  PROCESSING: "bg-primary/10 text-primary animate-pulse",
  COMPLETED: "bg-success/10 text-success",
};

const STATUS_LABELS: Record<string, string> = {
  ...CONSULTATION_STATUS_LABELS,
  // Legacy
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

interface CaseStatusBadgeProps {
  status: AnyStatus;
  className?: string;
  size?: "sm" | "md";
}

export function CaseStatusBadge({ status, className = "", size = "sm" }: CaseStatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  const label = STATUS_LABELS[status] ?? status;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
