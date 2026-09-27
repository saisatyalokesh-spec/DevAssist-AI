"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import type { SessionDetail } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { TroubleshootingTimeline } from "@/components/troubleshoot/TroubleshootingTimeline";
import { statusColor, statusLabel, timeAgo } from "@/lib/utils";

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .getSession(params.sessionId)
      .then(setSession)
      .catch(() => setNotFound(true));
  }, [params.sessionId]);

  if (notFound) return <p className="text-sm text-slate-500">Session not found.</p>;
  if (!session) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Session {session.id}</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-800">{session.problem}</h1>
          </div>
          <span className={`badge shrink-0 ${statusColor(session.status)}`}>{statusLabel(session.status)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {session.category && <Badge className="bg-violet-50 text-violet-700">{session.category}</Badge>}
          {session.guide_id && <Badge>{session.guide_id}</Badge>}
          {session.responsible_team && <Badge className="bg-blue-50 text-blue-700">{session.responsible_team}</Badge>}
          <Badge>{session.priority} priority</Badge>
          <Badge>{session.source === "image" ? "From screenshot" : "From text"}</Badge>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Created {timeAgo(session.created_at)} · Updated {timeAgo(session.updated_at)}
        </p>

        <div className="mt-5 flex gap-2">
          {session.status === "in_progress" && (
            <button onClick={() => router.push(`/troubleshoot?session=${session.id}`)} className="btn-primary">
              Continue Troubleshooting
            </button>
          )}
          {session.status === "solved" && (
            <button onClick={() => router.push("/saved-solutions")} className="btn-secondary">
              <Bookmark className="h-4 w-4" />
              View in Saved Solutions
            </button>
          )}
          {session.status === "escalated" && (
            <button onClick={() => router.push(`/troubleshoot?session=${session.id}`)} className="btn-secondary">
              View Escalation
            </button>
          )}
        </div>
      </div>

      {session.steps.length > 0 && (
        <div className="mt-6">
          <TroubleshootingTimeline steps={session.steps} />
        </div>
      )}
    </div>
  );
}
