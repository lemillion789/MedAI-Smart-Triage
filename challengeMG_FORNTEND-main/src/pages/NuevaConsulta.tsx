import { useState, useEffect } from "react";
import {
  Upload, Image, Send, User, ChevronRight, Loader2,
  Search, HelpCircle, CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePatients, useCreatePatient } from "@/hooks/use-patients";
import { 
  useCreateConsultation, 
} from "@/hooks/use-consultations";
import { useSubmitTriageAnswer, useStudy } from "@/hooks/use-studies";
import { TriageChatRenderer } from "@/components/shared/TriageChatRenderer";
import { AudioRecorder } from "@/components/shared/AudioRecorder";
import type { Patient, Consultation, Study } from "@/types/api";

const steps = ["Patient", "Inputs", "Questions", "Confirm"];

const NuevaConsulta = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // Paciente
  const [useExistingPatient, setUseExistingPatient] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    birth_date: "",
  });

  // Archivos
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [symptomsText, setSymptomsText] = useState("");

  useEffect(() => {
    if (imageFile && imageFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  // Consulta y triaje
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [tempConsultation, setTempConsultation] = useState<Consultation | Study | null>(null);
  const [isProcessingStep1, setIsProcessingStep1] = useState(false);

  // Hooks
  // Hooks
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const createPatient = useCreatePatient();
  const createConsultation = useCreateConsultation();
  const submitTriageAnswer = useSubmitTriageAnswer();
  
  // Estudio (Polling para obtener actualizaciones del estado)
  const { data: consultation } = useStudy(consultationId);

  // Cargar preguntas cuando el pipeline termine
  // No necesitamos el useEffect para cargar preguntas ya que content viene en combined_ai_analysis
  useEffect(() => {
    if (consultation?.triage_completed) {
      setIsProcessingStep1(false);
    }
  }, [consultation]);

  const filteredPatients = patients.filter((p: Patient) =>
    `${p.first_name} ${p.last_name} ${p.dni}`.toLowerCase().includes(searchPatient.toLowerCase())
  );

  // Validaciones por paso
  const isStep0Valid =
    useExistingPatient
      ? selectedPatientId !== null
      : newPatient.first_name.trim() !== "" &&
        newPatient.last_name.trim() !== "" &&
        newPatient.dni.trim() !== "" &&
        newPatient.birth_date !== "";

  const isStep1Valid = true; // Los archivos son opcionales

  const isStep2Valid = consultation?.triage_completed || false;

  const canGoNext = () => {
    if (step === 0) return isStep0Valid;
    if (step === 1) return isStep1Valid && !isProcessingStep1;
    if (step === 2) return isStep2Valid;
    return true;
  };

  /**
   * Avanzar al siguiente paso
   * En el paso 1→2, se realiza la primera evaluación del backend
   */
  const nextStep = async () => {
    if (!canGoNext()) return;

    // Paso 1 → 2: Primera evaluación (crear consulta y enviar datos)
    // Paso 1 → 2: Inicialización (Fase 1)
    if (step === 1) {
      await handlePhase1();
      return;
    }

    // Paso 2 → 3: Si ya terminó el triaje, avanzar
    if (step === 2 && consultation?.triage_completed) {
      setStep(3);
      return;
    }

    // Otros pasos: solo avanzar
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => {
    // No permitir volver si está procesando
    if (isProcessingStep1) return;
    setStep((s) => Math.max(s - 1, 0));
  };

  /**
   * PRIMERA EVALUACIÓN: Crear consulta, enviar inputs y ejecutar pipeline
   * Se ejecuta al pasar del paso 1 al paso 2
   */
  /**
   * FASE 1: Inicialización
   * Crea la consulta y devuelve la primera pregunta
   */
  const handlePhase1 = async () => {
    try {
      setIsProcessingStep1(true);

      let patientId = selectedPatientId;
      if (!useExistingPatient) {
        const created = await createPatient.mutateAsync(newPatient);
        patientId = created.id;
      }

      if (!patientId) {
        throw new Error("Could not get patient ID");
      }

      const res = await createConsultation.mutateAsync({
        patient: patientId,
        image: imageFile || undefined,
        audio: audioFile || undefined
      });

      setConsultationId(res.id);
      setTempConsultation(res);
      setIsProcessingStep1(false);
      setStep(2);
    } catch (error) {
      console.error("Error en Fase 1:", error);
      alert("Error starting triage. Please try again.");
      setIsProcessingStep1(false);
    }
  };

  /**
   * FASE 2: Triaje Iterativo
   * Envía la respuesta y recibe la siguiente pregunta o diagnóstico
   */
  const handleTriageAnswer = async (answer: string) => {
    try {
      if (!consultationId) return;
      const res = await submitTriageAnswer.mutateAsync({
        studyId: consultationId,
        answer
      });
      setTempConsultation(res);
    } catch (error) {
      console.error("Error en Fase 2:", error);
      alert("Error al enviar la respuesta.");
    }
  };

  /**
   * Confirmar y finalizar consulta
   */
  const handleSubmit = async () => {
    try {
      if (!consultationId) return;

      // Navegar a la pantalla de fin
      navigate(`/nueva-consulta/fin?study=${consultationId}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error finishing consultation";
      console.error("Error al finalizar consulta:", error);
      alert(`Error: ${msg}`);
    }
  };

  const isSubmitting =
    createPatient.isPending || 
    createConsultation.isPending || 
    submitTriageAnswer.isPending;

  const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header + Stepper */}
      <div className="shrink-0 pb-4 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            New Consultation
          </h1>
          <p className="text-muted-foreground mt-1">
            Guided registration for AI-assisted clinical triage
          </p>
        </div>

        <div className="flex items-center gap-1.5 mt-4 sm:mt-6 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < step
                    ? "bg-success text-success-foreground"
                    : i === step
                    ? "bg-gradient-primary text-primary-foreground shadow-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm hidden sm:block whitespace-nowrap ${
                  i <= step ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-xl shadow-card p-6 space-y-6"
          >
            {/* ─── PASO 0: Paciente ─── */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-heading font-semibold text-card-foreground">
                    Patient Data
                  </h2>
                </div>

                {/* Toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  {["Existing Patient", "New Patient"].map((label, idx) => (
                    <button
                      key={label}
                      onClick={() => setUseExistingPatient(idx === 0)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        useExistingPatient === (idx === 0)
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {useExistingPatient ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        placeholder="Search by name or ID..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {loadingPatients ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
                        {filteredPatients.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No patients found
                          </p>
                        ) : (
                          filteredPatients.map((patient: Patient) => (
                            <button
                              key={patient.id}
                              onClick={() => setSelectedPatientId(patient.id)}
                              className={`w-full p-3 rounded-lg text-left transition-colors ${
                                selectedPatientId === patient.id
                                  ? "bg-primary/10 border-2 border-primary"
                                  : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                              }`}
                            >
                              <p className="text-sm font-medium text-card-foreground">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {patient.dni} • {patient.age} years
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-card-foreground block mb-1.5">
                          First Name *
                        </label>
                        <input
                          value={newPatient.first_name}
                          onChange={(e) =>
                            setNewPatient({ ...newPatient, first_name: e.target.value })
                          }
                          placeholder="e.g., Maria"
                          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-card-foreground block mb-1.5">
                          Last Name *
                        </label>
                        <input
                          value={newPatient.last_name}
                          onChange={(e) =>
                            setNewPatient({ ...newPatient, last_name: e.target.value })
                          }
                          placeholder="e.g., Smith"
                          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-card-foreground block mb-1.5">
                        ID *
                      </label>
                      <input
                        value={newPatient.dni}
                        onChange={(e) => setNewPatient({ ...newPatient, dni: e.target.value })}
                        placeholder="e.g., 12345678"
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-card-foreground block mb-1.5">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={newPatient.birth_date}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, birth_date: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}

                {!isStep0Valid && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {useExistingPatient
                      ? "Select a patient to continue"
                      : "Complete mandatory fields (*)"}
                  </p>
                )}
              </>
            )}

            {/* ─── PASO 1: Entradas (imagen/audio) ─── */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-accent/10">
                    <Upload className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="font-heading font-semibold text-card-foreground">
                    System Inputs
                  </h2>
                </div>

                {/* Imagen médica (opcional) */}
                <div>
                  <p className="text-sm font-medium text-card-foreground mb-2">
                    Medical Image <span className="text-muted-foreground font-normal">(optional)</span>
                  </p>
                  <label
                    className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden min-h-[160px] ${
                      imageFile
                        ? "border-accent bg-accent/5"
                        : "border-border bg-muted/30 hover:border-accent/50"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                         <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-sm" />
                         <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-foreground text-sm font-medium flex items-center gap-2">
                              <Upload className="w-4 h-4" /> Change image
                            </p>
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className={`p-3 rounded-full ${imageFile ? "bg-accent/20" : "bg-accent/10"} relative z-10`}>
                          {imageFile ? (
                            <CheckCircle2 className="w-6 h-6 text-accent" />
                          ) : (
                            <Image className="w-6 h-6 text-accent" />
                          )}
                        </div>
                        <div className="text-center relative z-10">
                          <p className="text-sm font-medium text-card-foreground">
                            X-Ray / Image
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, DICOM</p>
                        </div>
                        {imageFile && (
                          <p className="text-xs text-accent font-medium truncate max-w-full px-2 relative z-10 bg-accent/5 py-1 rounded">
                            {imageFile.name}
                          </p>
                        )}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.dcm"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                {/* Audio de síntomas (opcional) — grabación en tiempo real o subir archivo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-card-foreground">
                      Symptom audio{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </p>
                    <span className="text-xs text-muted-foreground">WAV · MP3 · WebM</span>
                  </div>
                  <AudioRecorder
                    value={audioFile}
                    onAudioChange={setAudioFile}
                  />
                </div>

                {/* Fallback texto si no hay audio */}
                {!audioFile && (
                  <div>
                    <label className="text-sm font-medium text-card-foreground block mb-1.5">
                      Text description of symptoms
                      <span className="text-muted-foreground font-normal"> (if no audio)</span>
                    </label>
                    <textarea
                      value={symptomsText}
                      onChange={(e) => setSymptomsText(e.target.value)}
                      rows={3}
                      placeholder="Briefly describe the patient's symptoms..."
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                )}
              </>
            )}

            {/* ─── PASO 2: Triaje Interactivo ─── */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-warning/10">
                    <HelpCircle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-card-foreground">
                      Interactive Triage MedGemma
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Answer the AI's questions to get an accurate diagnosis
                    </p>
                  </div>
                </div>

                <div className="h-[400px]">
                  <TriageChatRenderer
                    content={(consultation || tempConsultation)?.combined_ai_analysis || ""}
                    isCompleted={(consultation || tempConsultation)?.triage_completed || false}
                    isLoading={isSubmitting}
                    onSelectOption={handleTriageAnswer}
                  />
                </div>

                {!(consultation || tempConsultation)?.triage_completed && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2 italic">
                    <Sparkles className="w-3.5 h-3.5" />
                    MedGemma is analyzing your responses in real-time
                  </p>
                )}

                {(consultation || tempConsultation)?.triage_completed && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 mt-4 flex items-center justify-between">
                    <p className="text-xs text-success font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Triage completed successfully
                    </p>
                    <button 
                      onClick={() => setStep(3)}
                      className="text-xs font-bold text-success hover:underline"
                    >
                      View Summary →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ─── PASO 3: Confirmar y Enviar ─── */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-success/10">
                    <Send className="w-5 h-5 text-success" />
                  </div>
                  <h2 className="font-heading font-semibold text-card-foreground">
                    Confirm Consultation
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-medium">Patient</p>
                    {useExistingPatient ? (
                      <p className="text-sm font-medium text-card-foreground">
                        {selectedPatient
                          ? `${selectedPatient.first_name} ${selectedPatient.last_name} — ID: ${selectedPatient.dni}`
                          : "Not selected"}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-card-foreground">
                        {newPatient.first_name && newPatient.last_name
                          ? `${newPatient.first_name} ${newPatient.last_name} — ID: ${newPatient.dni}`
                          : "Incomplete data"}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-medium">Inputs</p>
                    <div className="mt-1 space-y-0.5 text-sm text-card-foreground">
                      <p>
                        Image:{" "}
                        <span className={imageFile ? "text-success" : "text-destructive"}>
                          {imageFile ? imageFile.name : "Not attached"}
                        </span>
                      </p>
                      <p>
                        Audio:{" "}
                        <span className={audioFile ? "text-success" : "text-muted-foreground"}>
                          {audioFile ? audioFile.name : "Not attached"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-medium">
                      Triage Status
                    </p>
                    <p className="text-sm text-card-foreground mt-1">
                      {(consultation || tempConsultation)?.triage_completed ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs text-success font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Evaluations completed (2/2)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    • First evaluation: Multimodal analysis and initialization
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • Second evaluation: Refined interactive triage
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary font-medium">🔬 Pipeline: MedASR + MedGemma</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The prediagnosis is ready for medical review. Upon completion, the case will be added to the triage queue.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Botones de navegación */}
      <div className="shrink-0 flex justify-between pt-3 pb-2 border-t border-border bg-background">
        <button
          onClick={prevStep}
          disabled={step === 0 || isSubmitting || isProcessingStep1}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground disabled:opacity-50 hover:bg-secondary/80 transition-colors"
        >
          Previous
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!canGoNext() || isSubmitting}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-primary text-primary-foreground shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {step === 1 ? "Analyzing..." : step === 2 ? "Processing..." : "Loading..."}
              </>
            ) : (
              <>
                {step === 1 && <Sparkles className="w-4 h-4" />}
                {step === 1 ? "Analyze with AI" : step === 2 ? "Submit Responses" : "Next"}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-primary text-primary-foreground shadow-primary hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Finish Consultation
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NuevaConsulta;
