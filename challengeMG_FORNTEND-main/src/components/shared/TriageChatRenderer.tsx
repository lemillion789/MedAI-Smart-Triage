import { useRef, useEffect } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TriageChatRendererProps {
  content: string;
  isCompleted: boolean;
  onSelectOption: (option: string) => void;
  isLoading: boolean;
}

export function TriageChatRenderer({
  content,
  isCompleted,
  onSelectOption,
  isLoading,
}: TriageChatRendererProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isLoading]);

  // Parsear el contenido para extraer la pregunta y las opciones
  const parseContent = (text: string) => {
    if (!text) return { question: "", options: [], type: "unknown" };

    if (text.includes("[ASK]")) {
      const questionPart = text.replace("[ASK]", "").trim();
      // Regex más robusto para capturar opciones: Busca "Letra) Texto" hasta la próxima opción o final de string
      const optionsMatch = Array.from(questionPart.matchAll(/([A-Z])\)\s*(.*?)(?=\s*[A-Z]\)|$)/gs));
      
      let questionText = questionPart;
      const options = optionsMatch.map(match => ({
        key: match[1],
        label: match[0].trim()
      }));

      // El texto de la pregunta es todo lo que hay antes de la primera opción
      if (options.length > 0) {
        questionText = questionPart.split(/[A-Z]\)/)[0].trim();
      }

      return { question: questionText, options, type: "ask" };
    }

    if (text.includes("[DIAGNOSIS]")) {
      return { question: text.replace("[DIAGNOSIS]", "").trim(), options: [], type: "diagnosis" };
    }

    return { question: text, options: [], type: "text" };
  };

  const { question, options, type } = parseContent(content);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl shadow-sm border ${
              type === "diagnosis" 
                ? "bg-success/5 border-success/20" 
                : "bg-muted/30 border-border"
            }`}
          >
            {type === "ask" && (
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-warning" />
                <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                  AI Question
                </span>
              </div>
            )}
            
            {type === "diagnosis" && (
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-xs font-semibold text-success uppercase tracking-wider">
                  Final Report
                </span>
              </div>
            )}

            <div className="prose prose-sm max-w-none text-card-foreground whitespace-pre-wrap">
              {question}
            </div>
          </motion.div>
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>AI is thinking...</span>
          </motion.div>
        )}
      </div>

      {!isCompleted && !isLoading && (
        <div className="pt-2">
          {options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onSelectOption(opt.key)}
                  className="px-4 py-3 rounded-xl border-2 border-border bg-card text-left text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <span className="inline-block w-6 h-6 rounded bg-primary/10 text-primary text-center leading-6 mr-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {opt.key}
                  </span>
                  {opt.label.replace(`${opt.key})`, "").trim()}
                </button>
              ))}
            </div>
          ) : type === "ask" ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your answer..."
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSelectOption(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  onSelectOption(input.value);
                  input.value = "";
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Send
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
