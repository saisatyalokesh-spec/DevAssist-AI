"use client";

import { useState } from "react";
import { TriangleAlert, CircleCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResponse } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

const INFO_TO_PROVIDE = [
  "Customer issue",
  "Error message",
  "Environment",
  "Steps already tried",
  "Screenshots",
  "Previous troubleshooting results",
];

export function EscalationCard({ analysis }: { analysis: AnalysisResponse }) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const escalation = await api.getEscalationForSession(analysis.session_id);
      await api.acknowledgeEscalation(escalation.id);
      setCreated(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create the escalation.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="card overflow-hidden border-rose-100">
      <div className="flex items-start gap-3 border-b border-rose-100 bg-rose-50/70 px-5 py-4">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        <div>
          <p className="text-sm font-semibold text-rose-700">Further Investigation Required</p>
          <p className="mt-0.5 text-sm text-rose-600">
            {analysis.escalation_reason ||
              "Reliable troubleshooting information was not found. Further investigation or escalation is recommended."}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recommended Team
          </p>
          <p className="text-sm font-medium text-slate-800">
            {analysis.responsible_team || "Unassigned – Needs Triage"}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Information to Provide
          </p>
          <ul className="grid grid-cols-2 gap-1.5">
            {INFO_TO_PROVIDE.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {created ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CircleCheck className="h-4 w-4" /> Escalation created and acknowledged.
          </p>
        ) : (
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? <Spinner className="h-4 w-4" /> : "Create Escalation"}
          </button>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
