// GemmaQuestionRenderer - Renderizador de preguntas dinámicas MedGemma (documentación sección 5.6 / 9.3)

import { useState } from "react";
import type { FollowUpQuestion } from "@/types/api";

interface GemmaQuestionRendererProps {
  questions: FollowUpQuestion[];
  answers: Record<string, string | string[] | number>;
  onChange: (questionId: string, value: string | string[] | number) => void;
}

export function GemmaQuestionRenderer({ questions, answers, onChange }: GemmaQuestionRendererProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No additional questions at this time.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <QuestionItem
          key={q.id}
          question={q}
          value={answers[q.id]}
          onChange={(v) => onChange(q.id, v)}
        />
      ))}
    </div>
  );
}

interface QuestionItemProps {
  question: FollowUpQuestion;
  value: string | string[] | number | undefined;
  onChange: (value: string | string[] | number) => void;
}

function QuestionItem({ question, value, onChange }: QuestionItemProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-card-foreground">
        {question.text}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </label>

      {question.type === "single_select" && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-4 py-3 rounded-lg text-sm font-medium text-left border-2 transition-all ${
                value === opt
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-card-foreground hover:border-primary/40 hover:bg-muted/60"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === "multi_select" && question.options && (
        <MultiSelect
          options={question.options}
          value={Array.isArray(value) ? value : []}
          onChange={(v) => onChange(v)}
        />
      )}

      {question.type === "numeric" && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={question.min}
            max={question.max}
            value={value as number ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-32 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
          {question.unit && (
            <span className="text-sm text-muted-foreground">{question.unit}</span>
          )}
          {question.min != null && question.max != null && (
            <span className="text-xs text-muted-foreground">
              ({question.min} - {question.max})
            </span>
          )}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          value={value as string ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="Describe your answer..."
        />
      )}
    </div>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-4 py-3 rounded-lg text-sm font-medium text-left border-2 transition-all flex items-center gap-2 ${
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-card-foreground hover:border-primary/40 hover:bg-muted/60"
            }`}
          >
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? "border-primary bg-primary" : "border-muted-foreground"
              }`}
            >
              {selected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                  <path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
