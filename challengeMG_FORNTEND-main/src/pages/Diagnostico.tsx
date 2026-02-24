import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Ear, MessageSquare, CheckCircle2, FileText, Download } from "lucide-react";

const pipelineSteps = [
  { name: "HeAR", desc: "Analyzing respiratory audio...", icon: Ear, duration: 2000 },
  { name: "MedGemma", desc: "Processing image + clinical data...", icon: Brain, duration: 3000 },
  { name: "MedASR", desc: "Generating medical report...", icon: MessageSquare, duration: 2000 },
];

const Diagnostico = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (currentStep < pipelineSteps.length) {
      const timer = setTimeout(() => {
        if (currentStep === pipelineSteps.length - 1) {
          setComplete(true);
        }
        setCurrentStep((s) => s + 1);
      }, pipelineSteps[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="shrink-0 pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">AI Diagnosis</h1>
        <p className="text-muted-foreground mt-1">Artificial intelligence pipeline processing</p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 sm:space-y-8 pb-4">
        {/* Pipeline visualization */}
        <div className="bg-card rounded-xl shadow-card p-6 space-y-4">
          <h2 className="font-heading font-semibold text-card-foreground">Processing Pipeline</h2>
          <div className="space-y-3">
            {pipelineSteps.map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep && !complete;
              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    done
                      ? "border-success/30 bg-success/5"
                      : active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${done ? "bg-success/10" : active ? "bg-primary/10" : "bg-secondary"}`}>
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <s.icon className={`w-5 h-5 ${active ? "text-primary animate-pulse-soft" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? "text-success" : active ? "text-primary" : "text-muted-foreground"}`}>
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{done ? "Completed" : active ? s.desc : "Waiting"}</p>
                  </div>
                  {active && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.div
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, delay: d * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {complete && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card rounded-xl shadow-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <h2 className="font-heading font-semibold text-card-foreground">Diagnosis Result</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Main Diagnosis</p>
                  <p className="text-sm font-semibold text-card-foreground mt-1">Community-Acquired Pneumonia</p>
                  <p className="text-xs text-primary mt-1">Confidence: 92.4%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Estimated Severity</p>
                  <p className="text-sm font-semibold text-warning mt-1">Moderate</p>
                  <p className="text-xs text-muted-foreground mt-1">CURB-65: 2/5</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground font-medium mb-2">Analysis Findings</p>
                <ul className="space-y-1.5 text-sm text-card-foreground">
                  <li>• <strong>HeAR:</strong> Crackling rales in right lung base</li>
                  <li>• <strong>MedGemma:</strong> Alveolar opacity in right lower lobe, air bronchogram</li>
                  <li>• <strong>MedASR:</strong> Consistent symptoms: fever, productive cough, exertional dyspnea</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs text-primary font-medium mb-1">Recommendations</p>
                <p className="text-sm text-card-foreground">Initiate empirical antibiotic therapy. Consider hospitalization based on progress. Radiographic control in 48-72h.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pb-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-sm shadow-primary hover:opacity-90 transition-opacity">
                <Download className="w-4 h-4" /> Download Clinical History
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
                <FileText className="w-4 h-4" /> View in History
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Diagnostico;
