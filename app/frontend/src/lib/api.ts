import type {
  AnalysisResponse,
  TicketContext,
  StepResultType,
  SessionSummary,
  SessionDetail,
  GuideSummary,
  GuideOut,
  SavedSolutionOut,
  EscalationOut,
  InsightsOut,
  SearchResult,
  UploadGuideResponse,
} from "@/types";

// Empty string = same-origin relative requests. This is what production
// wants: the static export is served by the same FastAPI process on the
// same port, so `/api/...` just works with no CORS involved. Local dev sets
// NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 in .env.local instead,
// since `npm run dev` and `uvicorn` run on different ports.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export const api = {
  // ---- analyze --------------------------------------------------
  analyzeText(problem: string, context?: TicketContext) {
    return request<AnalysisResponse>("/api/analyze-text", {
      method: "POST",
      body: JSON.stringify({ problem, context }),
    });
  },

  analyzeImage(file: File, context?: TicketContext) {
    const form = new FormData();
    form.append("image", file);
    if (context?.product_area) form.append("product_area", context.product_area);
    if (context?.environment) form.append("environment", context.environment);
    if (context?.priority) form.append("priority", context.priority);
    if (context?.customer_impact) form.append("customer_impact", context.customer_impact);
    if (context?.steps_already_tried) form.append("steps_already_tried", context.steps_already_tried);
    return request<AnalysisResponse>("/api/analyze-image", { method: "POST", body: form });
  },

  extractImageFields(text: string) {
    return request<{ endpoint: string | null; status_line: string | null; error_code: string | null }>(
      `/api/analyze-image/fields?text=${encodeURIComponent(text)}`
    );
  },

  submitStepResult(sessionId: string, result: StepResultType, note?: string) {
    return request<AnalysisResponse>(`/api/troubleshooting/${sessionId}/result`, {
      method: "POST",
      body: JSON.stringify({ result, note }),
    });
  },

  // ---- sessions ---------------------------------------------------
  listSessions(params: { limit?: number; status?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.status) qs.set("status", params.status);
    return request<SessionSummary[]>(`/api/sessions?${qs.toString()}`);
  },

  getSession(sessionId: string) {
    return request<SessionDetail>(`/api/sessions/${sessionId}`);
  },

  // ---- knowledge base -----------------------------------------------
  listGuides(params: { collection?: string; category?: string; team?: string; q?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.collection) qs.set("collection", params.collection);
    if (params.category) qs.set("category", params.category);
    if (params.team) qs.set("team", params.team);
    if (params.q) qs.set("q", params.q);
    return request<GuideSummary[]>(`/api/knowledge/guides?${qs.toString()}`);
  },

  getGuide(guideId: string) {
    return request<GuideOut>(`/api/knowledge/guides/${guideId}`);
  },

  listCategories() {
    return request<string[]>("/api/knowledge/categories");
  },

  listTeams() {
    return request<string[]>("/api/knowledge/teams");
  },

  uploadGuideDocument(file: File, collection: "common" | "complex") {
    const form = new FormData();
    form.append("collection", collection);
    form.append("file", file);
    return request<UploadGuideResponse>("/api/knowledge/upload", { method: "POST", body: form });
  },

  // ---- saved solutions -----------------------------------------------
  // Saved automatically by the backend the moment a ticket is analyzed —
  // there is no manual "save" call anymore, only reading/removing.
  listSavedSolutions() {
    return request<SavedSolutionOut[]>("/api/saved-solutions");
  },

  getSavedSolution(id: string) {
    return request<SavedSolutionOut>(`/api/saved-solutions/${id}`);
  },

  removeSavedSolution(id: string) {
    return request<{ deleted: string }>(`/api/saved-solutions/${id}`, { method: "DELETE" });
  },

  // ---- escalations -----------------------------------------------
  listEscalations() {
    return request<EscalationOut[]>("/api/escalations");
  },

  getEscalationForSession(sessionId: string) {
    return request<EscalationOut>(`/api/escalations/${sessionId}`);
  },

  acknowledgeEscalation(id: string) {
    return request<EscalationOut>(`/api/escalations/${id}/acknowledge`, { method: "POST" });
  },

  // ---- insights / search -----------------------------------------------
  getInsights() {
    return request<InsightsOut>("/api/insights");
  },

  search(q: string) {
    return request<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`);
  },
};

export { ApiError };
