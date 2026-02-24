import { FileText, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useReports } from "@/hooks/use-reports";
import type { Report } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const statusColor: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  PROCESSING: "bg-warning/10 text-warning",
  PENDING: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "Completed",
  PROCESSING: "Processing",
  PENDING: "Pending",
  FAILED: "Failed",
};

const Historial = () => {
  const { data: reports = [], isLoading, error } = useReports();

  // Transformar reportes a formato de registros
  const records = useMemo(() => {
    return [...reports]
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((report: any) => {
        const rawUrl = report.pdf_url || `/api/reports/${report.study}/pdf/`;
        const absoluteUrl = rawUrl.startsWith("http") ? rawUrl : `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        return {
          id: report.id,
          patient: report.patient_name || report.study_details?.patient_details?.first_name 
            ? `${report.study_details?.patient_details?.first_name} ${report.study_details?.patient_details?.last_name}`
            : `Study #${report.study}`,
          date: format(new Date(report.created_at || new Date()), "dd/MM/yyyy", { locale: es }),
          diagnosis: report.final_diagnosis || "Medical Report",
          status: "COMPLETED", // Los reportes generados implican que el flujo terminó
          pipeline: "Clinical Report",
          pdf_url: absoluteUrl,
        };
      });
  }, [reports]);
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Clinical History</h1>
        <p className="text-muted-foreground mt-1">Records of diagnoses and consultations performed</p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
            Error loading history: {error.message}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No records in history
          </div>
        ) : (
          records.map((r, i) => (
          <motion.div
            key={r.id}
            onClick={() => r.pdf_url && window.open(r.pdf_url, '_blank')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 mt-0.5">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="text-sm font-semibold text-card-foreground">{r.patient}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </div>
                </div>
                <p className="text-sm text-card-foreground mt-1 line-clamp-2">{r.diagnosis}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.date}</span>
                  <span className="px-2 py-0.5 rounded bg-muted">{r.pipeline}</span>
                </div>
              </div>
            </div>
          </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Historial;
