// RoleSelect - Pantalla de selección de rol (Paciente kiosko / Doctor)

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Stethoscope, UserCog, Shield } from "lucide-react";
import { useRole } from "@/context/RoleContext";

const RoleSelect = () => {
  const { setRole } = useRole();
  const navigate = useNavigate();

  const selectPatient = () => {
    setRole("patient");
    navigate("/nueva-consulta");
  };

  const selectDoctor = () => {
    setRole("doctor");
    navigate("/doctor/dashboard");
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 gap-8">
      {/* Logo / Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MedAI" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">MedAI</h1>
            <p className="text-sm text-muted-foreground">Clinical Triage System</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-sm">
          Select your access mode to continue
        </p>
      </motion.div>

      {/* Cards de selección */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {/* Paciente (Kiosko) */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={selectPatient}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border hover:border-primary/50 bg-card shadow-card hover:shadow-primary/10 hover:shadow-lg transition-all group text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-heading font-bold text-lg text-card-foreground">Patient</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kiosk mode · New triage consultation
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5 w-full text-center">
            ID Identification
          </div>
        </motion.button>

        {/* Doctor */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          onClick={selectDoctor}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border hover:border-accent/50 bg-card shadow-card hover:shadow-accent/10 hover:shadow-lg transition-all group text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <UserCog className="w-8 h-8 text-accent" />
          </div>
          <div className="text-center">
            <h2 className="font-heading font-bold text-lg text-card-foreground">Doctor</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Full access · Triage queue and validation
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5 w-full text-center">
            Professional credentials
          </div>
        </motion.button>
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-2 max-w-lg text-center"
      >
        <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          MedAI provides clinical decision support. It does not replace medical criteria nor
          constitute a definitive diagnosis. Data is processed with strict privacy.
        </p>
      </motion.div>
    </div>
  );
};

export default RoleSelect;
