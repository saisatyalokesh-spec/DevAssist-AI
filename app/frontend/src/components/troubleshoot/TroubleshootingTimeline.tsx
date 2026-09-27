import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { StepOut } from "@/types";

export function TroubleshootingTimeline({ steps }: { steps: StepOut[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="card p-5">
      <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Clock className="h-3.5 w-3.5" /> Session Timeline
      </p>
      <ol className="space-y-4">
        {steps.map((step, idx) => {
          const done = step.status === "completed";
          return (
            <li key={step.id} className="relative pl-7">
              {idx < steps.length - 1 && (
                <span className="absolute left-[9px] top-5 h-[calc(100%-4px)] w-px bg-slate-200" />
              )}
              <span className="absolute left-0 top-0.5">
                {done ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                ) : (
                  <Circle className="h-[18px] w-[18px] text-accent-blue pulse-dot" />
                )}
              </span>
              <p className="text-sm font-medium text-slate-800">
                Step {step.step_number}: {step.instruction}
              </p>
              {step.result && (
                <p className="mt-1 text-xs text-slate-500">
                  Reported: <span className="italic">&quot;{step.result}&quot;</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
