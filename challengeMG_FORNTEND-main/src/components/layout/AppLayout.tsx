import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import AppSidebar from "./AppSidebar";
import BottomNav from "./BottomNav";
import { useRole } from "@/context/RoleContext";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inactividad

const AppLayout = () => {
  const { isPatient, clearRole } = useRole();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer de inactividad para kiosko (documentación sección 5.14)
  useEffect(() => {
    const resetTimer = () => {
      setShowInactivityWarning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
 
      // Aviso 1 minuto antes (a los 29 min)
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, SESSION_TIMEOUT_MS - 60_000);
 
      // Reset completo a los 30 min
      timerRef.current = setTimeout(() => {
        clearRole();
        navigate("/", { replace: true });
      }, SESSION_TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isPatient, clearRole, navigate]);

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <AppSidebar />

      {/* Warning de inactividad (kiosko) */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4 mx-4">
            <div className="text-4xl">⏱️</div>
            <h2 className="font-heading font-bold text-lg text-foreground">
              Are you still there?
            </h2>
            <p className="text-sm text-muted-foreground">
              Session will restart due to inactivity in{" "}
              <strong>1 minute</strong>.
            </p>
            <button
              onClick={() => setShowInactivityWarning(false)}
              className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <main
        className={`flex-1 overflow-hidden pb-[60px] lg:pb-0 ${
          !isPatient ? "lg:pl-[260px]" : ""
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
