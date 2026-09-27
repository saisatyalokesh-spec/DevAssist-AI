"use client";

import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight } from "lucide-react";
import type { GuideSummary } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function KnowledgeGuideCard({ guide }: { guide: GuideSummary }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/knowledge-base/guide?id=${guide.guide_id}`)}
      className="card card-hover flex flex-col items-start gap-3 p-5 text-left"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <BookOpen className="h-4 w-4" />
        </div>
        <Badge className={guide.collection === "complex" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}>
          {guide.collection === "complex" ? "Complex" : "Common"}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{guide.title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{guide.guide_id}</p>
      </div>
      <div className="mt-auto flex w-full items-center justify-between text-xs text-slate-500">
        <span>{guide.category}</span>
        <ArrowRight className="h-3.5 w-3.5 text-accent-blue" />
      </div>
    </button>
  );
}
