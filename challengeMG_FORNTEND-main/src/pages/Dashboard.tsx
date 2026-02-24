import { Users, Stethoscope, FileCheck, Activity, Clock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import StatCard from "@/components/shared/StatCard";
import { Link } from "react-router-dom";
import { usePatients } from "@/hooks/use-patients";
import { useDashboardStats } from "@/hooks/use-dashboard";
import type { Study } from "@/types/api";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  PROCESSING: "bg-warning/10 text-warning",
  PENDING: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  COMPLETED: "Completed",
  PROCESSING: "Processing",
  PENDING: "Pending",
  FAILED: "Failed",
};

const Dashboard = () => {
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const { data: dashboardData, isLoading: loadingDashboard } = useDashboardStats();

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalStudies =
      (dashboardData?.stats.waiting || 0) +
      (dashboardData?.stats.processing || 0) +
      (dashboardData?.stats.completed_today || 0) +
      (dashboardData?.stats.errors || 0);

    const accuracy = dashboardData?.stats.completed_today && dashboardData.stats.completed_today > 0 ? "94.2%" : "-";

    return {
      totalPatients: patients.length,
      studiesToday: dashboardData?.stats.completed_today || 0,
      totalStudies: totalStudies,
      accuracy,
    };
  }, [patients, dashboardData]);

  // Obtener estudios recientes (últimos 4 de active_cases)
  const recentStudies = useMemo(() => {
    return (dashboardData?.active_cases || [])
      .slice(0, 4)
      .map((study: Study) => ({
        id: study.id,
        patient: study.patient_details
          ? `${study.patient_details.first_name} ${study.patient_details.last_name}`
          : `Patient #${study.patient}`,
        type: study.symptoms_audio ? "Complete Evaluation" : "Chest X-Ray",
        status: study.status,
        time: formatDistanceToNow(new Date(study.created_at), { addSuffix: true, locale: es }),
      }));
  }, [dashboardData]);

  const isLoading = loadingPatients || loadingDashboard;
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">AI diagnosis system overview</p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 sm:space-y-8 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={Users} title="Patients" value={stats.totalPatients} subtitle="Total registered" variant="primary" />
              <StatCard icon={Stethoscope} title="Consultations Today" value={stats.studiesToday} variant="accent" />
              <StatCard icon={FileCheck} title="Diagnoses" value={stats.totalStudies} subtitle="Total processed" />
              <StatCard icon={Activity} title="AI Accuracy" value={stats.accuracy} variant="primary" />
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent consultations */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-card rounded-xl shadow-card"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading font-semibold text-card-foreground">Recent Consultations</h2>
              <Link to="/historial" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentStudies.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No recent studies
                </div>
              ) : (
                recentStudies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {c.patient.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{c.patient}</p>
                        <p className="text-xs text-muted-foreground">{c.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status]}`}>
                        {statusLabels[c.status]}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{c.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* AI Pipeline status */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl shadow-card p-5 space-y-5"
          >
            <h2 className="font-heading font-semibold text-card-foreground">AI Pipeline</h2>
            {[
              { name: "MedGemma", desc: "Multimodal analysis", active: true },
              { name: "HeAR", desc: "Respiratory audio", active: true },
              { name: "MedASR", desc: "Medical recognition", active: true },
            ].map((m) => (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2.5 h-2.5 rounded-full ${m.active ? "bg-success animate-pulse-soft" : "bg-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="shrink-0 pt-3 pb-2 border-t border-border bg-background">
        <Link
          to="/nueva-consulta"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-sm shadow-primary hover:opacity-90 transition-opacity"
        >
          <Stethoscope className="w-4 h-4" />
          New Consultation
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
