"use client";

import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, AlertCircle } from "lucide-react";
import type { SavedSolutionOut } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { statusColor, statusLabel, timeAgo } from "@/lib/utils";

export function SavedSolutionCard({
  solution,
  onRemove,
}: {
  solution: SavedSolutionOut;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{solution.problem}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {solution.guide_title || "Custom troubleshooting"} · {timeAgo(solution.created_at)}
          </p>
        </div>
        <span className={`badge shrink-0 ${statusColor(solution.status)}`}>{statusLabel(solution.status)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {solution.category && <Badge className="bg-violet-50 text-violet-700">{solution.category}</Badge>}
        {solution.team && <Badge className="bg-blue-50 text-blue-700">{solution.team}</Badge>}
        {solution.guide_id && <Badge>{solution.guide_id}</Badge>}
      </div>

      {solution.possible_causes?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <AlertCircle className="h-3.5 w-3.5" /> Possible Causes
          </p>
          <ul className="space-y-1">
            {solution.possible_causes.slice(0, 3).map((c, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent-purple" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {solution.steps?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recommended Steps
          </p>
          <ol className="space-y-1">
            {solution.steps.slice(0, 3).map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                  {i + 1}
                </span>
                <span className="line-clamp-1">{s}</span>
              </li>
            ))}
            {solution.steps.length > 3 && (
              <li className="pl-6 text-xs text-slate-400">+{solution.steps.length - 3} more</li>
            )}
          </ol>
        </div>
      )}

      {solution.solution && (
        <p className="mt-3 rounded-lg bg-emerald-50/60 border border-emerald-100 px-3 py-2 text-xs text-slate-700 line-clamp-2">
          {solution.solution}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => router.push(`/sessions?id=${solution.session_id}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-accent-blue"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </button>
        <button
          onClick={() => onRemove(solution.id)}
          className="flex items-center gap-1.5 text-xs font-medium text-rose-500"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}
