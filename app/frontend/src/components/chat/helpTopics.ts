/**
 * Small client-side "how do I..." help knowledge base for the floating
 * assistant. This is separate from the RAG troubleshooting knowledge base —
 * it answers questions about using DevAssist AI itself (navigation,
 * features, workflow), not customer technical problems, so it never touches
 * the backend or creates a support session.
 */

export interface HelpLink {
  label: string;
  route: string;
}

export interface HelpTopic {
  id: string;
  title: string;
  /** Phrases that identify this topic once help-intent is already detected. */
  keywords: string[];
  description?: string;
  steps?: string[];
  /** Single primary destination, shown as one "Go to ..." button. */
  route?: string;
  routeLabel?: string;
  /** Used only by the multi-section overview topic. */
  links?: HelpLink[];
}

// Phrases that signal the person is asking how to use the app, rather than
// describing a technical problem for troubleshooting.
const HELP_INTENT_PHRASES = [
  "how do i",
  "how to",
  "how can i",
  "how does",
  "where do i",
  "where can i",
  "where is",
  "what is the",
  "what are the",
  "what can you do",
  "what can this",
  "help me",
  "guide me",
  "walk me through",
  "show me how",
  "steps to",
  "steps for",
  "give me steps",
  "instructions for",
  "instructions to",
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "upload-screenshot",
    title: "Uploading a Screenshot",
    keywords: ["upload screenshot", "upload image", "analyze screenshot", "screenshot", "attach a photo", "attach an image", "postman screenshot"],
    description: "You can analyze an error directly from an image — no need to retype it.",
    steps: [
      "Go to the Upload Screenshot page from the sidebar (or attach an image right here using the paperclip icon below).",
      "Choose a screenshot that clearly shows the error — a Postman response, browser console, or an app error dialog all work.",
      "Optionally add a short caption describing what the customer was doing when it happened.",
      "Click \"Analyze Problem\" (or Send, if you're doing this in chat). DevAssist AI will read the text in the image with OCR and match it against the knowledge base automatically.",
    ],
    route: "/upload-screenshot",
    routeLabel: "Go to Upload Screenshot",
  },
  {
    id: "troubleshoot",
    title: "Troubleshooting a Text or Error Log Problem",
    keywords: ["troubleshoot", "paste error", "error log", "describe problem", "text input", "analyze text", "type an error"],
    description: "Use this when you have the error as text rather than a screenshot.",
    steps: [
      "Go to the Troubleshoot page from the sidebar.",
      "Select the \"Text / Error Log\" tab.",
      "Describe the problem and/or paste the raw error message or stack trace.",
      "Click \"Analyze Problem\" — you'll get the matched guide, possible causes, and the first recommended step.",
      "After trying a step, click \"Mark Step Complete\" and choose what happened (Resolved, Still Exists, Different Error, or Need More Info) to keep going.",
    ],
    route: "/troubleshoot",
    routeLabel: "Go to Troubleshoot",
  },
  {
    id: "saved-solutions",
    title: "Viewing Saved Solutions",
    keywords: ["saved solutions", "saved solution", "view saved", "past solutions", "solution history", "previous tickets"],
    description:
      "Every ticket you analyze — text or screenshot — is saved here automatically the moment guidance is produced, so it's always an up-to-date reference for the team.",
    steps: [
      "Go to the Saved Solutions page from the sidebar.",
      "Use the tabs at the top (All / In Progress / Solved / Escalated) to filter by status.",
      "Click \"Open\" on any card to jump back into that session, or \"Remove\" to delete it.",
    ],
    route: "/saved-solutions",
    routeLabel: "Go to Saved Solutions",
  },
  {
    id: "knowledge-base",
    title: "Browsing or Updating the Knowledge Base",
    keywords: ["knowledge base", "browse guides", "browse knowledge", "replace docx", "update knowledge base", "upload knowledge base document", "upload guide document", "rag document"],
    description: "This is where the approved troubleshooting guides live, and where you can swap in a new knowledge-base document.",
    steps: [
      "Go to the Knowledge Base page from the sidebar.",
      "Use the search box, category filter, or team filter to find a specific guide.",
      "To replace the Common or Complex knowledge base document: open \"Manage Knowledge Base Documents\" near the top, choose the new .docx file under the right collection, and click \"Upload & Replace\".",
      "The change takes effect immediately — no server restart needed — and you'll see how many guides were parsed from the new file.",
    ],
    route: "/knowledge-base",
    routeLabel: "Go to Knowledge Base",
  },
  {
    id: "escalations",
    title: "Escalations",
    keywords: ["escalation", "escalate", "escalated tickets", "responsible team", "hand off to a team"],
    description: "When the knowledge base doesn't have a confident answer, or all steps are exhausted, a ticket is escalated to the responsible team here.",
    steps: [
      "Go to the Escalations page from the sidebar.",
      "Each entry shows the reason for escalation and the recommended team.",
      "Open the linked session for full context before handing it off.",
    ],
    route: "/escalations",
    routeLabel: "Go to Escalations",
  },
  {
    id: "overview",
    title: "What You Can Do in DevAssist AI",
    keywords: ["what can you do", "what can this app do", "what sections", "app overview", "what does this app do", "features", "help"],
    description: "Here's a quick map of everything DevAssist AI can help with:",
    links: [
      { label: "Troubleshoot a text/error problem", route: "/troubleshoot" },
      { label: "Upload a screenshot to analyze", route: "/upload-screenshot" },
      { label: "View Saved Solutions", route: "/saved-solutions" },
      { label: "Browse the Knowledge Base", route: "/knowledge-base" },
      { label: "View Escalations", route: "/escalations" },
    ],
  },
];

const OVERVIEW_TOPIC = HELP_TOPICS.find((t) => t.id === "overview")!;

/**
 * Returns a matched HelpTopic if the message reads as an "app usage"
 * question (how do I / where is / what can you do, etc.), otherwise null so
 * the caller falls through to normal RAG troubleshooting.
 */
export function matchHelpTopic(rawText: string): HelpTopic | null {
  const text = rawText.toLowerCase();

  const hasHelpIntent = HELP_INTENT_PHRASES.some((p) => text.includes(p));
  if (!hasHelpIntent) return null;

  let best: { topic: HelpTopic; score: number } | null = null;
  for (const topic of HELP_TOPICS) {
    for (const kw of topic.keywords) {
      if (text.includes(kw)) {
        const score = kw.length;
        if (!best || score > best.score) best = { topic, score };
      }
    }
  }

  return best ? best.topic : OVERVIEW_TOPIC;
}
