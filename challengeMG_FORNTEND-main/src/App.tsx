import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "@/context/RoleContext";
import AppLayout from "@/components/layout/AppLayout";

// Páginas compartidas / generales
import RoleSelect from "./pages/RoleSelect";
import NotFound from "./pages/NotFound";

// Páginas Paciente (kiosko)
import NuevaConsulta from "./pages/NuevaConsulta";
import ConsultaFin from "./pages/kiosk/ConsultaFin";

// Páginas Doctor
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorCasoDetalle from "./pages/doctor/DoctorCasoDetalle";
import Pacientes from "./pages/Pacientes";
import Historial from "./pages/Historial";
import Diagnostico from "./pages/Diagnostico";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Guard de rutas: redirige al selector de rol si no hay sesión.
 * Para Doctor: redirige a /doctor/dashboard si intenta ir a rutas de paciente.
 */
function RoleGuard({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: "patient" | "doctor";
}) {
  const { role } = useRole();

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (required && role !== required) {
    if (role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/nueva-consulta" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RoleProvider>
          <Routes>
            {/* ── Pantalla de selección de rol (entrada del sistema) ── */}
            <Route path="/" element={<RoleSelectOrRedirect />} />

            {/* ── Layout principal (sidebar + bottom nav) ── */}
            <Route element={<AppLayout />}>

              {/* ── Rutas Paciente (kiosko) ── */}
              <Route
                path="/nueva-consulta"
                element={
                  <RoleGuard required="patient">
                    <NuevaConsulta />
                  </RoleGuard>
                }
              />
              <Route
                path="/nueva-consulta/fin"
                element={
                  <RoleGuard required="patient">
                    <ConsultaFin />
                  </RoleGuard>
                }
              />

              {/* ── Rutas Doctor ── */}
              <Route
                path="/doctor/dashboard"
                element={
                  <RoleGuard required="doctor">
                    <DoctorDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/doctor/consultas/:id"
                element={
                  <RoleGuard required="doctor">
                    <DoctorCasoDetalle />
                  </RoleGuard>
                }
              />
              <Route
                path="/doctor/pacientes"
                element={
                  <RoleGuard required="doctor">
                    <Pacientes />
                  </RoleGuard>
                }
              />
              <Route
                path="/doctor/historial"
                element={
                  <RoleGuard required="doctor">
                    <Historial />
                  </RoleGuard>
                }
              />

              {/* ── Compatibilidad con rutas legacy ── */}
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/historial" element={<Historial />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

/**
 * Si ya hay un rol en sesión, redirige directamente al área correspondiente.
 * Si no, muestra el selector de rol.
 */
function RoleSelectOrRedirect() {
  const { role } = useRole();
  if (role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
  if (role === "patient") return <Navigate to="/nueva-consulta" replace />;
  return <RoleSelect />;
}

export default App;
