export interface TicketContext {
  product_area?: string;
  environment?: string;
  priority?: string;
  customer_impact?: string;
  steps_already_tried?: string;
}

export interface MatchAlternative {
  guide_id: string;
  title: string;
  confidence: number;
}

export interface AnalysisResponse {
  problem: string;
  category: string;
  problem_type: string;
  possible_causes: string[];
  troubleshooting_steps: string[];
  current_step: string;
  verification: string;
  escalation_required: boolean;
  responsible_team: string;
  source: string;

  session_id: string;
  status: "in_progress" | "needs_clarification" | "escalated" | "solved";
  guide_id: string;
  guide_title: string;
  collection: string;
  confidence: number;
  symptoms: string[];
  visual_indicators: string[];
  solution: string;
  escalation_reason: string;
  message: string;
  other_matches: MatchAlternative[];
}

export interface StepOut {
  id: string;
  step_number: number;
  instruction: string;
  result: string;
  status: string;
}

export interface SessionSummary {
  id: string;
  problem: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface SessionDetail extends SessionSummary {
  collection: string;
  guide_id: string;
  confidence: number;
  responsible_team: string;
  source: string;
  steps: StepOut[];
}

export interface GuideSummary {
  guide_id: string;
  title: string;
  collection: string;
  category: string;
  team: string;
}

export interface GuideOut {
  guide_id: string;
  title: string;
  collection: string;
  category: string;
  problem: string;
  symptoms: string[];
  causes: string[];
  steps: string[];
  solution: string;
  escalation: string;
  team: string;
  related: string[];
}

export interface SavedSolutionOut {
  id: string;
  session_id: string;
  problem: string;
  category: string;
  guide_title: string;
  guide_id: string;
  possible_causes: string[];
  steps: string[];
  solution: string;
  team: string;
  status: string;
  created_at: string;
}

export interface EscalationOut {
  id: string;
  session_id: string;
  reason: string;
  team: string;
  status: string;
  created_at: string;
}

export interface InsightsOut {
  problems_analyzed: number;
  guides_retrieved: number;
  active_sessions: number;
  escalated: number;
  solved: number;
}

export interface SearchResult {
  type: "guide" | "session";
  id: string;
  title: string;
  subtitle: string;
}

export type StepResultType = "resolved" | "still_failing" | "different_error" | "need_info";

export interface UploadGuideResponse {
  collection: string;
  filename: string;
  guides_parsed: number;
  total_guides: number;
}
