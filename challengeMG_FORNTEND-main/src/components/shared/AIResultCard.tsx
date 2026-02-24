// AIResultCard - Tarjeta de resultados del análisis MedGemma (documentación sección 9.3)

import { AlertTriangle, Brain, Info } from "lucide-react";
import type { GemmaResult } from "@/types/api";
import { SEVERITY_LABELS, SEVERITY_COLORS } from "@/types/api";

interface AIResultCardProps {
  result: GemmaResult;
  showMetadata?: boolean;
}

export function AIResultCard({ result, showMetadata = false }: AIResultCardProps) {
  const severityClass = SEVERITY_COLORS[result.triage_severity] ?? "text-muted-foreground bg-muted";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-card-foreground">AI Result</h3>
          <p className="text-xs text-muted-foreground">MedGemma Analysis (decision support only)</p>
        </div>
        <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${severityClass}`}>
          {SEVERITY_LABELS[result.triage_severity] ?? result.triage_severity}
        </span>
      </div>

      {/* Diagnósticos candidatos */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Candidate diagnoses</p>
        <div className="space-y-2">
          {result.diagnosis_candidates.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                {d.icd10 && <p className="text-xs text-muted-foreground">ICD-10: {d.icd10}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{Math.round(d.score * 100)}%</p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${d.score * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Red Flags */}
      {result.red_flags.length > 0 && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-xs font-semibold text-destructive">Red flags</p>
          </div>
          <ul className="space-y-1">
            {result.red_flags.map((flag, i) => (
              <li key={i} className="text-sm text-destructive/90">• {flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Razonamiento */}
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Clinical rationale</p>
        </div>
        <p className="text-sm text-card-foreground">{result.rationale}</p>
      </div>

      {/* Metadata del modelo */}
      {showMetadata && result.model_metadata && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Model metadata</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>Model: {result.model_metadata.model}</span>
            <span>Version: {result.model_metadata.version}</span>
            <span>Latency: {result.model_metadata.latency_ms}ms</span>
            {result.model_metadata.prompt_hash && (
              <span>Hash: {result.model_metadata.prompt_hash.slice(0, 8)}...</span>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground italic">
        ⚠️ Advisory result. Does not replace clinical judgment or constitute a definitive diagnosis.
      </p>
    </div>
  );
}
