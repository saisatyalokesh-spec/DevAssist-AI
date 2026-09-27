"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { GuideOut } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export function GuideDetailPageInner() {
  const searchParams = useSearchParams();
  const guideId = searchParams.get("id") || "";
  const router = useRouter();
  const [guide, setGuide] = useState<GuideOut | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!guideId) {
      setNotFound(true);
      return;
    }
    api
      .getGuide(guideId)
      .then(setGuide)
      .catch(() => setNotFound(true));
  }, [guideId]);

  async function startFromGuide() {
    if (!guide) return;
    setStarting(true);
    try {
      const result = await api.analyzeText(guide.problem);
      router.push(`/troubleshoot?session=${result.session_id}`);
    } finally {
      setStarting(false);
    }
  }

  if (notFound) {
    return <p className="text-sm text-slate-500">Guide not found.</p>;
  }

  if (!guide) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.push("/knowledge-base")}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
      </button>

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className={guide.collection === "complex" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}>
            {guide.collection === "complex" ? "Complex Problem" : "Common Problem"}
          </Badge>
          <Badge className="bg-violet-50 text-violet-700">{guide.category}</Badge>
          <Badge>{guide.guide_id}</Badge>
        </div>

        <h1 className="text-xl font-semibold text-slate-800">{guide.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{guide.problem}</p>

        <button onClick={startFromGuide} disabled={starting} className="btn-primary mt-5">
          {starting ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          Start Troubleshooting From This Guide
        </button>

        <div className="mt-8 space-y-6">
          {guide.symptoms.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Symptoms</h2>
              <ul className="space-y-1.5">
                {guide.symptoms.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {guide.causes.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Possible Causes</h2>
              <ul className="space-y-1.5">
                {guide.causes.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-purple" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {guide.steps.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Troubleshooting Steps</h2>
              <ol className="space-y-2">
                {guide.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {guide.solution && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Solution</h2>
              <p className="rounded-lg bg-emerald-50/60 border border-emerald-100 px-4 py-3 text-sm text-slate-700">
                {guide.solution}
              </p>
            </section>
          )}

          {guide.escalation && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Escalation Guidance</h2>
              <p className="rounded-lg bg-rose-50/60 border border-rose-100 px-4 py-3 text-sm text-slate-700">
                {guide.escalation}
              </p>
              <p className="mt-2 text-xs text-slate-500">Escalate to: {guide.team}</p>
            </section>
          )}

          {guide.related.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Related Guides</h2>
              <div className="flex flex-wrap gap-2">
                {guide.related.map((r) => (
                  <Badge key={r}>{r}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
