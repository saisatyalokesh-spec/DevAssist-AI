"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { SessionSummary } from "@/types";
import { SessionCard } from "@/components/session/SessionCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EscalationsPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    api
      .listSessions({ status: "escalated", limit: 50 })
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Escalated Issues</h1>
        <p className="text-sm text-slate-500">
          Tickets DevAssist AI couldn&apos;t resolve confidently, routed to a specialist team.
        </p>
      </div>

      {sessions === null && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      )}

      {sessions !== null && sessions.length === 0 && (
        <EmptyState icon={TriangleAlert} title="No escalated issues" description="Nice — everything resolved on its own so far." />
      )}

      <div className="space-y-3">
        {sessions?.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
