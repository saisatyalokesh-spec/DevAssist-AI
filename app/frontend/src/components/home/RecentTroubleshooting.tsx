"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { SessionSummary } from "@/types";
import { statusColor, statusLabel, timeAgo } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export function RecentTroubleshooting() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    api
      .listSessions({ limit: 5 })
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock className="h-4 w-4 text-slate-400" />
          Recent Troubleshooting
        </h2>
      </div>

      {sessions === null && (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5 text-slate-400" />
        </div>
      )}

      {sessions !== null && sessions.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No sessions yet"
          description="Analyze your first ticket and it will show up here."
        />
      )}

      <div className="divide-y divide-slate-100">
        {sessions?.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/sessions?id=${s.id}`)}
            className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{s.problem}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {s.category || "Uncategorized"} · {timeAgo(s.updated_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`badge ${statusColor(s.status)}`}>{statusLabel(s.status)}</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
