// ConsultaFin - Pantalla final del kiosko (documentación sección 3.1 paso 5)

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useRole } from "@/context/RoleContext";

const KIOSK_RESET_SECONDS = 60;

const ConsultaFin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const studyId = searchParams.get("study");
  const [countdown, setCountdown] = useState(KIOSK_RESET_SECONDS);

  // Timer de inactividad: resetear kiosko automáticamente
  useEffect(() => {
    if (countdown <= 0) {
      handleReset();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleReset = () => {
    clearRole();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center gap-8 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="w-14 h-14 text-success" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Consultation registered!
          </h1>
          <p className="text-muted-foreground">
            Your consultation has been successfully sent to the triage system.
          </p>
          {studyId && (
            <p className="text-sm text-muted-foreground">
              Consultation number:{" "}
              <span className="font-mono font-semibold text-foreground">#{studyId}</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Instrucciones no clínicas */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full p-6 rounded-xl bg-card shadow-card space-y-4"
      >
        <h2 className="font-heading font-semibold text-card-foreground">Next steps</h2>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">→</span>
            Wait to be called by medical staff.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">→</span>
            Remain in the assigned waiting room.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">→</span>
            If your symptoms worsen, inform the staff immediately.
          </li>
        </ul>
      </motion.div>

      {/* Countdown y reset */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-3 w-full"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            This screen will restart in{" "}
            <span className="font-semibold text-foreground">{countdown}s</span>
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-sm shadow-primary hover:opacity-90 transition-opacity w-full justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          New consultation
        </button>
      </motion.div>
    </div>
  );
};

export default ConsultaFin;
