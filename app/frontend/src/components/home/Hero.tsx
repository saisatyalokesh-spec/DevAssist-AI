"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ImageUp, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

const EXAMPLES = [
  "HTTP 401 Unauthorized",
  "Login failed",
  "API timeout",
  "Notification not received",
  "Data synchronization failed",
];

export function Hero() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetSolution(problem?: string) {
    const text = (problem ?? value).trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeText(text);
      router.push(`/troubleshoot?session=${result.session_id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the DevAssist AI backend.");
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-xl2 bg-hero-gradient px-8 py-10 text-white sm:px-10 sm:py-12">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-purple/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-20 h-64 w-64 rounded-full bg-accent-blue/20 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent-light">
          <Sparkles className="h-3.5 w-3.5" />
          Knowledge-grounded troubleshooting
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          DevAssist <span className="text-accent-light">AI</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-200">
          Your Intelligent Technical Support Assistant
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Upload a screenshot, paste an error, or describe a customer problem and
          get step-by-step, knowledge-based troubleshooting.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 rounded-xl bg-white/10 p-1.5 backdrop-blur">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGetSolution()}
              placeholder="Paste your error message, or describe the problem..."
              className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleGetSolution()}
            disabled={loading || !value.trim()}
            className="btn-primary shrink-0 disabled:opacity-60"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <>Get Solution <ArrowRight className="h-4 w-4" /></>}
          </button>
          <button
            onClick={() => router.push("/upload-screenshot")}
            className="btn shrink-0 border border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <ImageUp className="h-4 w-4" />
            Upload Screenshot
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleGetSolution(ex)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
            >
              &quot;{ex}&quot;
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
