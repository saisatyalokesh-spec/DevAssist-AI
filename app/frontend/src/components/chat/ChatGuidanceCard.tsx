"use client";

import { useState } from "react";
import {
  Tag,
  Gauge,
  AlertCircle,
  ListChecks,
  CheckCircle2,
  CircleCheck,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  TriangleAlert,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { AnalysisResponse, StepResultType } from "@/types";

const OUTCOME_OPTIONS: { key: StepResultType; label: string; icon: typeof CircleCheck; tint: string }[] = [
  { key: "resolved", label: "Issue Resolved", icon: CircleCheck, tint: "hover:border-emerald-300 hover:bg-emerald-50" },
  { key: "still_failing", label: "Problem Still Exists", icon: RotateCcw, tint: "hover:border-amber-300 hover:bg-amber-50" },
  { key: "different_error", label: "Different Error Appeared", icon: ShieldAlert, tint: "hover:border-rose-300 hover:bg-rose-50" },
  { key: "need_info", label: "Need More Information", icon: HelpCircle, tint: "hover:border-slate-300 hover:bg-slate-50" },
];

interface Props {
  analysis: AnalysisResponse;
  /** Only the latest guidance message in the thread accepts new input. */
  interactive: boolean;
  onOutcome: (outcome: StepResultType, note: string) => void | Promise<void>;
  submitting: boolean;
  onOpenSaved?: () => void;
}

/**
 * Compact, chat-bubble-sized version of the full Troubleshooting Workspace
 * card — same structured fields (category, causes, current step) and the
 * same "Mark Step Complete" -> "What happened?" iterative loop, just sized
 * to sit inside the floating assistant panel.
 */
export function ChatGuidanceCard({ analysis, interactive, onOutcome, submitting, onOpenSaved }: Props) {
  const [stepCompleted, setStepCompleted] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<StepResultType | null>(null);
  const [note, setNote] = useState("");

  const isClarify = analysis.status === "needs_clarification";
  const isEscalated = analysis.status === "escalated";
  const isSolved = analysis.status === "solved";
  const isInProgress = analysis.status === "in_progress";

  function handleOutcomeClick(outcome: StepResultType) {
    if (outcome === "different_error" || outcome === "need_info") {
      setPendingOutcome(outcome);
      return;
    }
    onOutcome(outcome, "");
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white text-left shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {isClarify ? "More Information Needed" : "Actual Problem"}
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-slate-800">{analysis.problem}</p>
      </div>

      <div className="space-y-3 p-3.5">
        {(analysis.category || analysis.confidence > 0 || analysis.guide_id) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {analysis.category && (
              <Badge className="bg-violet-50 text-[11px] text-violet-700">
                <Tag className="h-3 w-3" /> {analysis.category}
              </Badge>
            )}
            {analysis.confidence > 0 && (
              <Badge className="bg-emerald-50 text-[11px] text-emerald-700">
                <Gauge className="h-3 w-3" /> {analysis.confidence}% match
              </Badge>
            )}
            {analysis.guide_id && <Badge className="text-[11px]">{analysis.guide_id}</Badge>}
          </div>
        )}

        {isClarify && (
          <p className="text-[13px] text-slate-600">{analysis.message}</p>
        )}

        {analysis.possible_causes?.length > 0 && (
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <AlertCircle className="h-3 w-3" /> Why This Happens
            </p>
            <ul className="space-y-1">
              {analysis.possible_causes.slice(0, 4).map((c, i) => (
                <li key={i} className="flex gap-1.5 text-[13px] text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-purple" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        {isInProgress && analysis.current_step && (
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <ListChecks className="h-3 w-3" /> Current Action
            </p>
            <p className="rounded-lg border border-accent-blue/20 bg-blue-50/50 px-3 py-2 text-[13px] font-medium text-slate-800">
              {analysis.current_step}
            </p>

            {interactive && !stepCompleted && (
              <button
                onClick={() => setStepCompleted(true)}
                className="btn-primary mt-3 h-8 px-3 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Step Complete
              </button>
            )}

            {interactive && stepCompleted && !pendingOutcome && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-slate-700">What happened?</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {OUTCOME_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        disabled={submitting}
                        onClick={() => handleOutcomeClick(opt.key)}
                        className={`flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-left text-xs text-slate-700 transition-colors ${opt.tint} disabled:opacity-50`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {interactive && pendingOutcome && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-slate-700">
                  {pendingOutcome === "different_error"
                    ? "What error appeared instead?"
                    : "What additional information do you need?"}
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="input-field resize-none text-xs"
                  placeholder="Type details here..."
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onOutcome(pendingOutcome, note)}
                    disabled={submitting || !note.trim()}
                    className="btn-primary h-8 px-3 text-xs"
                  >
                    {submitting ? <Spinner className="h-3.5 w-3.5" /> : "Continue"}
                  </button>
                  <button onClick={() => setPendingOutcome(null)} className="btn-ghost h-8 px-3 text-xs">
                    Back
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {isSolved && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-700">SOLVED</p>
            {analysis.solution && <p className="mt-1 text-[13px] text-slate-700">{analysis.solution}</p>}
            <button
              onClick={onOpenSaved}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-accent-blue"
            >
              <Bookmark className="h-3.5 w-3.5" /> Saved automatically — view in Saved Solutions
            </button>
          </div>
        )}

        {isEscalated && (
          <div className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
              <TriangleAlert className="h-3.5 w-3.5" /> Further Investigation Required
            </p>
            <p className="mt-1 text-[13px] text-rose-600">
              {analysis.escalation_reason ||
                "Reliable troubleshooting information was not found. Further investigation or escalation is recommended."}
            </p>
            <p className="mt-2 text-[11px] font-medium text-slate-600">
              Recommended team: {analysis.responsible_team || "Unassigned – Needs Triage"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
