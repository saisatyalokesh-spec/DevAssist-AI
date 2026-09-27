"use client";

import { Info } from "lucide-react";
import type { TicketContext } from "@/types";

interface Props {
  problem: string;
  setProblem: (v: string) => void;
  errorMessage: string;
  setErrorMessage: (v: string) => void;
  context: TicketContext;
  setContext: (c: TicketContext) => void;
}

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export function ErrorInput({
  problem,
  setProblem,
  errorMessage,
  setErrorMessage,
  context,
  setContext,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer Problem</label>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Describe the customer's problem..."
          rows={4}
          className="input-field resize-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Error Message</label>
        <textarea
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          placeholder="Paste the exact error message, log line, or stack trace..."
          rows={3}
          className="input-field resize-none font-mono text-xs"
        />
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Info className="h-3.5 w-3.5" /> Context
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Product Area</label>
            <input
              value={context.product_area}
              onChange={(e) => setContext({ ...context, product_area: e.target.value })}
              placeholder="e.g. API"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Environment</label>
            <input
              value={context.environment}
              onChange={(e) => setContext({ ...context, environment: e.target.value })}
              placeholder="e.g. Production"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Priority</label>
            <select
              value={context.priority}
              onChange={(e) => setContext({ ...context, priority: e.target.value })}
              className="input-field"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Customer Impact</label>
            <input
              value={context.customer_impact}
              onChange={(e) => setContext({ ...context, customer_impact: e.target.value })}
              placeholder="e.g. Single user"
              className="input-field"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Steps Already Tried</label>
            <input
              value={context.steps_already_tried}
              onChange={(e) => setContext({ ...context, steps_already_tried: e.target.value })}
              placeholder="Anything the customer or you already tried"
              className="input-field"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
