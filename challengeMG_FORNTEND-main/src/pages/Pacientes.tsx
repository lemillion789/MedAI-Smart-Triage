import { useState, useMemo } from "react";
import { Search, Plus, Loader2, FileText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { usePatients, useCreatePatient } from "@/hooks/use-patients";
import { usePatientHistory } from "@/hooks/use-history";
import type { Patient, HistoryEntry } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const Pacientes = () => {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  
  // Modal de nuevo paciente
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    birth_date: "",
  });

  const { data: patients = [], isLoading, error } = usePatients();
  const { data: history = [], isLoading: loadingHistory } = usePatientHistory(selectedPatient?.id || 0);
  const createPatient = useCreatePatient();

  const handleCreatePatient = async () => {
    try {
      await createPatient.mutateAsync(newPatient);
      toast.success("Patient created successfully");
      setIsNewPatientModalOpen(false);
      setNewPatient({ first_name: "", last_name: "", dni: "", birth_date: "" });
    } catch (err) {
      toast.error("Error creating patient");
    }
  };

  const isFormValid =
    newPatient.first_name.trim() !== "" &&
    newPatient.last_name.trim() !== "" &&
    newPatient.dni.trim() !== "" &&
    newPatient.birth_date !== "";

  // Transformar datos de API a formato del componente y filtrar por búsqueda
  const filtered = useMemo(() => {
    return patients
      .map((p: Patient) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        age: p.age,
        dni: p.dni,
        // Nota: La API actual no retorna lastVisit ni consultations
        // Se pueden agregar estos campos al backend o calcularlos desde estudios
        lastVisit: "-",
        consultations: 0,
        status: "Active",
      }))
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [patients, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Patients</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? "Loading..." : `${patients.length} registered patients`}
            </p>
          </div>
          <button 
            onClick={() => setIsNewPatientModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-primary hover:opacity-90 transition-opacity self-start"
          >
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
            Error loading patients: {error.message}
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && !error && (
          <div className="hidden md:block bg-card rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Age</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Last Visit</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Consultations</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p: any) => (
                <tr key={p.id} onClick={() => setSelectedPatient(p)} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{p.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{p.age} years</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{p.lastVisit}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{p.consultations}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}


        {/* Mobile cards */}
        {!isLoading && !error && (
          <div className="md:hidden space-y-3">
          {filtered.map((p: any, i) => (
            <motion.div key={p.id} onClick={() => setSelectedPatient(p)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl shadow-card p-4 cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{p.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age} years</p>
                </div>
                <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${p.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Last visit: {p.lastVisit}</span>
                <span>{p.consultations} consultations</span>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
            <DialogTitle>Clinical Timeline</DialogTitle>
            <DialogDescription>
              Care history for {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No records in the clinical history.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {history.map((entry: HistoryEntry) => (
                  <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-xl shadow border border-border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <time className="text-xs font-semibold text-primary uppercase">
                          {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                        </time>
                      </div>
                      <h3 className="font-semibold text-card-foreground text-sm">{entry.title}</h3>
                      <p className="text-muted-foreground text-xs mt-1 mb-3">{entry.description}</p>
                      {entry.attachments_url && (
                        <a
                          href={entry.attachments_url.startsWith("http") ? entry.attachments_url : `${API_BASE_URL}${entry.attachments_url.startsWith('/') ? '' : '/'}${entry.attachments_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                        >
                          View PDF <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nuevo Paciente */}
      <Dialog open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
            <DialogDescription>
              Enter the new patient's data to register them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-card-foreground block mb-1.5">First Name *</label>
                <input
                  value={newPatient.first_name}
                  onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                  placeholder="e.g., Maria"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground block mb-1.5">Last Name *</label>
                <input
                  value={newPatient.last_name}
                  onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                  placeholder="e.g., Smith"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-1.5">ID *</label>
              <input
                value={newPatient.dni}
                onChange={(e) => setNewPatient({ ...newPatient, dni: e.target.value })}
                placeholder="e.g., 12345678"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-1.5">Date of Birth *</label>
              <input
                type="date"
                value={newPatient.birth_date}
                onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewPatientModalOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePatient}
              disabled={!isFormValid || createPatient.isPending}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-primary text-primary-foreground shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {createPatient.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Patient"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pacientes;
