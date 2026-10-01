"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Bookmark, X, FileWarning } from "lucide-react";
import { ErrorInput } from "./ErrorInput";
import { ImageUploader } from "./ImageUploader";
import { AIAnalysisCard } from "./AIAnalysisCard";
import { TroubleshootingStep } from "./TroubleshootingStep";
import { TroubleshootingTimeline } from "./TroubleshootingTimeline";
import { EscalationCard } from "./EscalationCard";
import { Spinner } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResponse, SessionDetail, TicketContext } from "@/types";

type InputTab = "text" | "image";

interface Props {
  initialTab?: InputTab;
  initialSessionId?: string;
}

const PROCESSING_MESSAGES = [
  "Understanding problem...",
  "Searching troubleshooting knowledge...",
  "Preparing recommended action...",
];

export function Workspace({ initialTab = "text", initialSessionId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<InputTab>(initialTab);

  const [problem, setProblem] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [context, setContext] = useState<TicketContext>({
    product_area: "",
    environment: "",
    priority: "Medium",
    customer_impact: "",
    steps_already_tried: "",
  });

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingMsgIdx, setProcessingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load an existing session if we arrived via ?session=... (e.g. from the Hero or Recent list)
  useEffect(() => {
    if (!initialSessionId) return;
    setLoading(true);
    api
      .getSession(initialSessionId)
      .then(async (session) => {
        setSessionDetail(session);
        const view = await buildAnalysisFromSession(session);
        setAnalysis(view);
      })
      .catch(() => setError("Could not load that session."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProcessingMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, [loading]);

  async function refreshTimeline(sessionId: string) {
    try {
      const detail = await api.getSession(sessionId);
      setSessionDetail(detail);
    } catch {
      /* non-fatal */
    }
  }

  async function handleAnalyze() {
    setError(null);
    setLoading(true);
    setProcessingMsgIdx(0);
    try {
      let result: AnalysisResponse;
      if (tab === "image" && imageFile) {
        result = await api.analyzeImage(imageFile, context);
      } else {
        const combined = [problem, errorMessage].filter((v) => v.trim()).join("\n\n");
        result = await api.analyzeText(combined, context);
      }
      setAnalysis(result);
      router.replace(`/troubleshoot?session=${result.session_id}`, { scroll: false });
      refreshTimeline(result.session_id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the DevAssist AI backend.");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdate(next: AnalysisResponse) {
    setAnalysis(next);
    refreshTimeline(next.session_id);
  }

  function handleNewSession() {
    setAnalysis(null);
    setSessionDetail(null);
    setProblem("");
    setErrorMessage("");
    setImageFile(null);
    router.replace("/troubleshoot", { scroll: false });
  }

  const canAnalyze = tab === "image" ? !!imageFile : problem.trim().length > 0 || errorMessage.trim().length > 0;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT: input */}
      <div className="card space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">New Troubleshooting Request</h2>
          {analysis && (
            <button onClick={handleNewSession} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setTab("text")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === "text" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
            }`}
          >
            Text / Error Log
          </button>
          <button
            onClick={() => setTab("image")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === "image" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
            }`}
          >
            Screenshot
          </button>
        </div>

        {tab === "text" ? (
          <ErrorInput
            problem={problem}
            setProblem={setProblem}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            context={context}
            setContext={setContext}
          />
        ) : (
          <ImageUploader file={imageFile} setFile={setImageFile} />
        )}

        <button onClick={handleAnalyze} disabled={!canAnalyze || loading} className="btn-primary w-full">
          {loading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          Analyze Problem
        </button>

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      {/* RIGHT: AI analysis */}
      <div className="space-y-4">
        {loading && !analysis && (
          <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Spinner className="h-6 w-6 text-accent-blue" />
            <p className="text-sm font-medium text-slate-600">{PROCESSING_MESSAGES[processingMsgIdx]}</p>
          </div>
        )}

        {!loading && !analysis && (
          <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
            <FileWarning className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              Describe the problem or upload a screenshot, then click{" "}
              <span className="font-medium text-slate-700">Analyze Problem</span>.
            </p>
          </div>
        )}

        {analysis && analysis.status === "needs_clarification" && (
          <div className="card border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-700">More information needed</p>
            <p className="mt-2 text-sm text-slate-500">{analysis.message}</p>
          </div>
        )}

        {analysis && analysis.status !== "needs_clarification" && <AIAnalysisCard analysis={analysis} />}

        {analysis && analysis.status === "in_progress" && (
          <TroubleshootingStep analysis={analysis} onUpdate={handleUpdate} />
        )}

        {analysis && analysis.status === "solved" && (
          <div className="card border-emerald-100 bg-emerald-50/40 p-5">
            <p className="text-sm font-semibold text-emerald-700">SOLVED</p>
            {analysis.solution && <p className="mt-2 text-sm text-slate-700">{analysis.solution}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
              <Bookmark className="h-3.5 w-3.5" /> Automatically saved to Saved Solutions.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => router.push("/saved-solutions")} className="btn-secondary">
                View in Saved Solutions
              </button>
              <button onClick={handleNewSession} className="btn-ghost">
                Close Session
              </button>
            </div>
          </div>
        )}

        {analysis && analysis.status === "escalated" && <EscalationCard analysis={analysis} />}

        {sessionDetail && sessionDetail.steps.length > 0 && (
          <TroubleshootingTimeline steps={sessionDetail.steps} />
        )}
      </div>
    </div>
  );
}

async function buildAnalysisFromSession(session: SessionDetail): Promise<AnalysisResponse> {
  let guide = null;
  if (session.guide_id) {
    try {
      guide = await api.getGuide(session.guide_id);
    } catch {
      guide = null;
    }
  }

  const pendingStep = session.steps.find((s) => s.status === "pending");

  return {
    problem: session.problem,
    category: session.category,
    problem_type: session.category,
    possible_causes: guide?.causes ?? [],
    troubleshooting_steps: guide?.steps ?? [],
    current_step: pendingStep?.instruction ?? "",
    verification: "",
    escalation_required: session.status === "escalated",
    responsible_team: session.responsible_team,
    source: session.source,
    session_id: session.id,
    status: session.status as AnalysisResponse["status"],
    guide_id: session.guide_id,
    guide_title: guide?.title ?? "",
    collection: session.collection,
    confidence: session.confidence,
    symptoms: guide?.symptoms ?? [],
    visual_indicators: guide?.problem ? [] : [],
    solution: guide?.solution ?? "",
    escalation_reason: guide?.escalation ?? "",
    message: "",
    other_matches: [],
  };
}
