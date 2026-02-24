// useAudioRecorder - Grabación de audio en tiempo real vía MediaRecorder API

import { useState, useRef, useCallback } from "react";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped"
  | "error";

interface UseAudioRecorderReturn {
  status: RecorderStatus;
  audioFile: File | null;
  audioUrl: string | null;
  durationMs: number;
  errorMsg: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

/** Selecciona el MIME type disponible en el navegador */
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        clearTimer();
        stopStream();

        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        // Limpiar URL anterior si existía
        if (audioUrl) URL.revokeObjectURL(audioUrl);

        const url = URL.createObjectURL(blob);
        const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `sintomas_${Date.now()}.${ext}`, {
          type: blob.type,
        });

        setAudioUrl(url);
        setAudioFile(file);
        setStatus("stopped");
        setDurationMs(Date.now() - startTimeRef.current);
      };

      recorder.onerror = () => {
        clearTimer();
        stopStream();
        setStatus("error");
        setErrorMsg("Error durante la grabación.");
      };

      recorder.start(250); // Chunks cada 250ms
      startTimeRef.current = Date.now();
      setStatus("recording");

      // Actualizar contador de duración
      intervalRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 200);
    } catch (err: unknown) {
      stopStream();
      setStatus("error");
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMsg("Permiso de micrófono denegado. Habilítelo en la configuración del navegador.");
        } else if (err.name === "NotFoundError") {
          setErrorMsg("No se encontró micrófono en este dispositivo.");
        } else {
          setErrorMsg(`Error de dispositivo: ${err.message}`);
        }
      } else {
        setErrorMsg("No se pudo acceder al micrófono.");
      }
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearTimer();
      setStatus("paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - durationMs;
      intervalRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 200);
      setStatus("recording");
    }
  }, [durationMs]);

  const resetRecording = useCallback(() => {
    stopRecording();
    clearTimer();
    stopStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    chunksRef.current = [];
    setAudioFile(null);
    setAudioUrl(null);
    setDurationMs(0);
    setErrorMsg(null);
    setStatus("idle");
  }, [audioUrl, stopRecording]);

  return {
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
  };
}

/** Formatea milisegundos a MM:SS */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
