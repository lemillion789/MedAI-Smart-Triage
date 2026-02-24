// DoctorDashboard - Cola de triaje y KPIs (documentación sección 5.8 / 9.2)

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ClipboardList, Clock, AlertTriangle, CheckCircle2,
  ArrowRight, Loader2, RefreshCw,
} from "lucide-react";
import { useConsultations } from "@/hooks/use-consultations";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { CaseStatusBadge } from "@/components/shared/CaseStatusBadge";
import StatCard from "@/components/shared/StatCard";
import type { Study } from "@/types/api";

const DoctorDashboard = () => {
  const { data: dashboardData, isLoading, refetch, isFetching } = useDashboardStats();

  const stats = useMemo(() => {
    return {
      pendingCount: dashboardData?.stats.waiting || 0,
      inReviewCount: dashboardData?.stats.processing || 0,
      finalizedCount: dashboardData?.stats.completed_today || 0,
      failedCount: dashboardData?.stats.errors || 0,
    };
  }, [dashboardData]);

  // Cola de casos activos
  const triageQueue = useMemo(() => {
    return dashboardData?.active_cases || [];
  }, [dashboardData]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-4 sm:pb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Triage Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Doctor Panel · Clinical review and validation
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={ClipboardList}
                title="Waiting"
                value={stats.pendingCount}
                subtitle="Require attention"
                variant="primary"
              />
              <StatCard
                icon={Clock}
                title="In Review"
                value={stats.inReviewCount}
                subtitle="Being evaluated"
                variant="accent"
              />
              <StatCard
                icon={CheckCircle2}
                title="Finalized"
                value={stats.finalizedCount}
                subtitle="Completed today"
              />
              <StatCard
                icon={AlertTriangle}
                title="Errors"
                value={stats.failedCount}
                subtitle="Require retry"
              />
            </div>

            {/* Cola de triaje */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-card"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-heading font-semibold text-card-foreground">
                  Active cases
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({triageQueue.length})
                  </span>
                </h2>
              </div>

              {triageQueue.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3 opacity-60" />
                  <p className="text-sm text-muted-foreground">No pending cases</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {triageQueue.map((study: Study) => {
                    const patientName = study.patient_details
                      ? `${study.patient_details.first_name} ${study.patient_details.last_name}`
                      : `Patient #${study.patient}`;

                    const timeAgo = formatDistanceToNow(new Date(study.created_at), {
                      addSuffix: true,
                      locale: es,
                    });

                    return (
                      <Link
                        key={study.id}
                        to={`/doctor/consultas/${study.id}`}
                        className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                            {patientName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {patientName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #{study.id} · {timeAgo}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <CaseStatusBadge status={study.status} />
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Alertas */}
            {stats.failedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {stats.failedCount} failed consultation{stats.failedCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-destructive/70 mt-0.5">
                    Review cases marked as ERROR and retry the pipeline.
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
