"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Hash } from "lucide-react";
import type { SessionSummary } from "@/types";
import { statusColor, statusLabel, timeAgo } from "@/lib/utils";

export function SessionCard({ session }: { session: SessionSummary }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/sessions?id=${session.id}`)}
      className="card card-hover flex w-full items-center justify-between gap-3 p-4 text-left"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Hash className="h-3 w-3" /> {session.id}
        </p>
        <p className="mt-1 truncate text-sm font-medium text-slate-800">{session.problem}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {session.category || "Uncategorized"} · {timeAgo(session.updated_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`badge ${statusColor(session.status)}`}>{statusLabel(session.status)}</span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </button>
  );
}
