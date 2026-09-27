"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import type { SavedSolutionOut } from "@/types";
import { SavedSolutionCard } from "@/components/saved/SavedSolutionCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { statusLabel } from "@/lib/utils";

type StatusFilter = "all" | "in_progress" | "solved" | "escalated" | "needs_clarification";

export default function SavedSolutionsPage() {
  const [solutions, setSolutions] = useState<SavedSolutionOut[] | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    api.listSavedSolutions().then(setSolutions).catch(() => setSolutions([]));
  }, []);

  async function handleRemove(id: string) {
    setSolutions((prev) => prev?.filter((s) => s.id !== id) ?? prev);
    try {
      await api.removeSavedSolution(id);
    } catch {
      /* silently ignore — list already optimistically updated */
    }
  }

  const filtered = solutions?.filter((s) => filter === "all" || s.status === filter) ?? null;
  const statuses: StatusFilter[] = ["all", "in_progress", "solved", "escalated"];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Saved Solutions</h1>
        <p className="text-sm text-slate-500">
          Every problem DevAssist AI has analyzed — text or screenshot — with the causes, steps, and
          guidance it retrieved, saved automatically so you can pick up where you left off.
        </p>
      </div>

      <div className="mb-5 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
            }`}
          >
            {s === "all" ? "All" : statusLabel(s)}
          </button>
        ))}
      </div>

      {solutions === null && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      )}

      {filtered !== null && filtered.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved solutions yet"
          description="Analyze a ticket in the Troubleshooting Workspace — it's saved here automatically."
        />
      )}

      {filtered !== null && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <SavedSolutionCard key={s.id} solution={s} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
