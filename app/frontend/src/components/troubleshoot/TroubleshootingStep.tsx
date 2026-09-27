"use client";

import { useState } from "react";
import { CheckCircle2, CircleCheck, RotateCcw, ShieldAlert, HelpCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResponse, StepResultType } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  analysis: AnalysisResponse;
  onUpdate: (next: AnalysisResponse) => void;
}

const OUTCOME_OPTIONS: { key: StepResultType; label: string; icon: typeof CircleCheck; tint: string }[] = [
  { key: "resolved", label: "Issue Resolved", icon: CircleCheck, tint: "hover:border-emerald-300 hover:bg-emerald-50" },
  { key: "still_failing", label: "Problem Still Exists", icon: RotateCcw, tint: "hover:border-amber-300 hover:bg-amber-50" },
  { key: "different_error", label: "Different Error Appeared", icon: ShieldAlert, tint: "hover:border-rose-300 hover:bg-rose-50" },
  { key: "need_info", label: "Need More Information", icon: HelpCircle, tint: "hover:border-slate-300 hover:bg-slate-50" },
];

export function TroubleshootingStep({ analysis, onUpdate }: Props) {
  const [stepCompleted, setStepCompleted] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<StepResultType | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (analysis.status !== "in_progress" || !analysis.current_step) return null;

  async function submit(outcome: StepResultType, noteText: string) {
    setSubmitting(true);
    setError(null);
    try {
      const next = await api.submitStepResult(analysis.session_id, outcome, noteText);
      onUpdate(next);
      setStepCompleted(false);
      setPendingOutcome(null);
      setNote("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit the result.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOutcomeClick(outcome: StepResultType) {
    if (outcome === "different_error" || outcome === "need_info") {
      setPendingOutcome(outcome);
      return;
    }
    submit(outcome, "");
  }

  return (
    <div className="card p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Current Action
      </p>
      <p className="rounded-lg bg-accent-gradient/[0.06] border border-accent-blue/20 bg-blue-50/50 px-4 py-3 text-sm font-medium text-slate-800">
        {analysis.current_step}
      </p>

      {!stepCompleted && (
        <button onClick={() => setStepCompleted(true)} className="btn-primary mt-4">
          <CheckCircle2 className="h-4 w-4" />
          Mark Step Complete
        </button>
      )}

      {stepCompleted && !pendingOutcome && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">What happened?</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {OUTCOME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  disabled={submitting}
                  onClick={() => handleOutcomeClick(opt.key)}
                  className={`flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors ${opt.tint} disabled:opacity-50`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pendingOutcome && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {pendingOutcome === "different_error"
              ? "What error appeared instead?"
              : "What additional information do you need?"}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              pendingOutcome === "different_error"
                ? "e.g. Now getting a 403 Forbidden instead of a 401"
                : "e.g. Need the exact request headers from the customer"
            }
            className="input-field resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => submit(pendingOutcome, note)}
              disabled={submitting || !note.trim()}
              className="btn-primary"
            >
              {submitting ? <Spinner className="h-4 w-4" /> : "Continue"}
            </button>
            <button onClick={() => setPendingOutcome(null)} className="btn-ghost">
              Back
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
