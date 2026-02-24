// AudioRecorder - Componente de grabación de audio en tiempo real

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Square, Pause, Play, Trash2, CheckCircle2,
  AlertCircle, MicOff, Upload,
} from "lucide-react";
import { useAudioRecorder, formatDuration } from "@/hooks/use-audio-recorder";

interface AudioRecorderProps {
  /** Archivo de audio aceptado (controlado por el padre) */
  value: File | null;
  /** Se llama cuando el usuario acepta o elimina el audio */
  onAudioChange: (file: File | null) => void;
}

export function AudioRecorder({ value, onAudioChange }: AudioRecorderProps) {
  const {
    status,
    audioFile,
    audioUrl,
    durationMs,
    errorMsg,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder();

  const isIdle = status === "idle";
  const isRequesting = status === "requesting";
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isStopped = status === "stopped";
  const isError = status === "error";
  const isActive = isRequesting || isRecording || isPaused;

  // Cuando el padre limpia el valor, reseteamos el recorder interno
  useEffect(() => {
    if (!value && isStopped) resetRecording();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CASO 1: Ya hay un audio aceptado por el padre ──
  if (value) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
      >
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground truncate">{value.name}</p>
          <p className="text-xs text-muted-foreground">
            {value.size > 0
              ? `${(value.size / 1024).toFixed(0)} KB`
              : `Recorded audio · ${formatDuration(durationMs)}`}
          </p>
        </div>
        <button
          onClick={() => {
            onAudioChange(null);
            resetRecording();
          }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          title="Remove audio"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── CASO 2: Grabación parada — revisar antes de aceptar ── */}
      {isStopped && audioUrl && audioFile && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 p-4 rounded-xl bg-success/5 border border-success/20"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-sm font-medium text-success">
              Recording ready · {formatDuration(durationMs)}
            </p>
          </div>
          <audio src={audioUrl} controls className="w-full h-10" />
          <div className="flex gap-2">
            <button
              onClick={() => onAudioChange(audioFile)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors border border-success/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              Use this recording
            </button>
            <button
              onClick={resetRecording}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Re-record
            </button>
          </div>
        </motion.div>
      )}

      {/* ── CASO 3: Grabando / Pausado / Solicitando micrófono ── */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4"
        >
          {/* Indicador visual */}
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isRecording ? "bg-destructive/15" : "bg-muted"
                }`}
              >
                <Mic
                  className={`w-7 h-7 ${isRecording ? "text-destructive" : "text-muted-foreground"}`}
                />
              </div>
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-destructive"
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </div>

            <div className="text-center">
              <p className="text-3xl font-mono font-bold text-foreground tabular-nums">
                {formatDuration(durationMs)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRequesting
                  ? "Requesting microphone..."
                  : isRecording
                  ? "Recording..."
                  : "Paused"}
              </p>
            </div>
          </div>

          {/* Ondas animadas durante grabación */}
          {isRecording && (
            <div className="flex items-center justify-center gap-0.5 h-8 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-primary/70"
                  animate={{ height: [4, 8 + ((i * 7) % 20), 4] }}
                  transition={{
                    duration: 0.5 + (i % 3) * 0.2,
                    repeat: Infinity,
                    delay: i * 0.04,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Controles de grabación */}
          <div className="flex items-center justify-center gap-2">
            {isRecording && (
              <button
                onClick={pauseRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {isPaused && (
              <button
                onClick={resumeRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
            <button
              onClick={resetRecording}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── CASO 4: Error de micrófono ── */}
      <AnimatePresence>
        {isError && errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 overflow-hidden"
          >
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">Microphone unavailable</p>
              <p className="text-xs text-destructive/80 mt-0.5">{errorMsg}</p>
            </div>
            <button
              onClick={resetRecording}
              className="text-xs text-destructive underline flex-shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CASO 5: Idle — botones de acción ── */}
      {isIdle && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Grabar con micrófono */}
          <button
            onClick={startRecording}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-all"
          >
            <Mic className="w-5 h-5" />
            Record with microphone
          </button>

          {/* Subir archivo */}
          <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-card-foreground text-sm font-medium transition-all cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload file
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAudioChange(f);
              }}
            />
          </label>
        </div>
      )}

      {/* Nota de compatibilidad HTTPS */}
      {typeof window !== "undefined" && !window.navigator.mediaDevices && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MicOff className="w-3.5 h-3.5" />
          Recording requires HTTPS. Use the upload file option.
        </div>
      )}
    </div>
  );
}
