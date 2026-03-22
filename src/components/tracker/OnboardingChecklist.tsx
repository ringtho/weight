import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

type OnboardingStep = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type OnboardingChecklistProps = {
  steps: OnboardingStep[];
  onDismiss: () => void;
};

export default function OnboardingChecklist({ steps, onDismiss }: OnboardingChecklistProps) {
  const total = steps.length;
  const completed = steps.filter((step) => step.done).length;

  return (
    <div className="surface-panel rounded-2xl p-6 mb-6 animate-fade-up">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <p className="section-label">Quick Start</p>
          <h2 className="section-title text-[#2a2219]">Set up your first week</h2>
          <p className="text-xs text-[#6a5b4a] mt-1">
            {completed}/{total} complete
          </p>
        </div>
        <button onClick={onDismiss} className="btn btn-outline text-xs">
          Hide checklist
        </button>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col gap-2 rounded-2xl border border-[#e7ded2] bg-white/85 px-4 py-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-[#4b5a4a]" />
              ) : (
                <Circle className="w-5 h-5 text-[#b0895a]" />
              )}
              <div>
                <p className="text-sm font-semibold text-[#2a2219]">{step.label}</p>
                {step.note && <p className="text-xs text-[#6a5b4a]">{step.note}</p>}
              </div>
            </div>
            {!step.done && step.actionLabel && step.onAction && (
              <button onClick={step.onAction} className="btn btn-soft text-xs">
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
