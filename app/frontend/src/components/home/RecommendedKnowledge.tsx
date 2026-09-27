"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { GuideSummary } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

export function RecommendedKnowledge() {
  const router = useRouter();
  const [guides, setGuides] = useState<GuideSummary[] | null>(null);

  useEffect(() => {
    api
      .listGuides({})
      .then((all) => setGuides(all.slice(0, 4)))
      .catch(() => setGuides([]));
  }, []);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Recommended Knowledge</h2>
        <button
          onClick={() => router.push("/knowledge-base")}
          className="flex items-center gap-1 text-xs font-medium text-accent-blue"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {guides === null && (
        <div className="flex justify-center py-6">
          <Spinner className="h-5 w-5 text-slate-400" />
        </div>
      )}

      <div className="space-y-1">
        {guides?.map((g) => (
          <button
            key={g.guide_id}
            onClick={() => router.push(`/knowledge-base/guide?id=${g.guide_id}`)}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{g.title}</p>
              <p className="text-xs text-slate-400">
                {g.collection === "complex" ? "Complex" : "Common"} guide · {g.category}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
