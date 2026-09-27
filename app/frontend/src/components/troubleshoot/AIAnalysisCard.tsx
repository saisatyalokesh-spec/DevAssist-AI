import { AlertCircle, Tag, Gauge, ListChecks } from "lucide-react";
import type { AnalysisResponse } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function AIAnalysisCard({ analysis }: { analysis: AnalysisResponse }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Actual Problem
        </p>
        <p className="text-sm font-medium text-slate-800">{analysis.problem}</p>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {analysis.category && (
            <Badge className="bg-violet-50 text-violet-700">
              <Tag className="h-3 w-3" /> {analysis.category}
            </Badge>
          )}
          {analysis.collection && (
            <Badge className="bg-blue-50 text-blue-700">
              {analysis.collection === "complex" ? "Complex problem" : "Common problem"}
            </Badge>
          )}
          {analysis.confidence > 0 && (
            <Badge className="bg-emerald-50 text-emerald-700">
              <Gauge className="h-3 w-3" /> {analysis.confidence}% match
            </Badge>
          )}
          {analysis.guide_id && <Badge>{analysis.guide_id}</Badge>}
        </div>

        {analysis.symptoms?.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ListChecks className="h-3.5 w-3.5" /> Symptoms
            </p>
            <ul className="space-y-1.5">
              {analysis.symptoms.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {analysis.possible_causes?.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AlertCircle className="h-3.5 w-3.5" /> Why This Happens
            </p>
            <ul className="space-y-1.5">
              {analysis.possible_causes.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-purple" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
