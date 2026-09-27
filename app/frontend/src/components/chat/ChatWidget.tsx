"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, Paperclip, RefreshCcw, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { ChatGuidanceCard } from "./ChatGuidanceCard";
import { ChatHelpCard } from "./ChatHelpCard";
import { matchHelpTopic, HELP_TOPICS, type HelpTopic } from "./helpTopics";
import type { AnalysisResponse, StepResultType } from "@/types";

type ChatMsg =
  | { id: string; role: "user"; kind: "text"; text: string }
  | { id: string; role: "assistant"; kind: "guidance"; analysis: AnalysisResponse }
  | { id: string; role: "assistant"; kind: "help"; topic: HelpTopic }
  | { id: string; role: "assistant"; kind: "info"; text: string };

// Shown as quick-tap chips on a fresh conversation, like a typical product
// help chatbot's suggested questions.
const QUICK_ACTIONS: { label: string; topicId: string }[] = [
  { label: "How do I upload a screenshot?", topicId: "upload-screenshot" },
  { label: "How do I view Saved Solutions?", topicId: "saved-solutions" },
  { label: "What can you do?", topicId: "overview" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const WELCOME: ChatMsg = {
  id: "welcome",
  role: "assistant",
  kind: "info",
  text:
    "Hi! I'm the DevAssist AI assistant. Describe a problem, paste an error, or attach a screenshot — " +
    "I'll walk you through troubleshooting it step by step, right here.",
};

export function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function pushMessage(msg: ChatMsg) {
    setMessages((prev) => [...prev, msg]);
  }

  function analysisToMessage(analysis: AnalysisResponse): ChatMsg {
    return { id: uid(), role: "assistant", kind: "guidance", analysis };
  }

  async function handleSend() {
    if (loading) return;
    if (imageFile) {
      const file = imageFile;
      setImageFile(null);
      pushMessage({ id: uid(), role: "user", kind: "text", text: `📷 Uploaded screenshot: ${file.name}` });
      setLoading(true);
      setError(null);
      try {
        const result = await api.analyzeImage(file);
        setSessionId(result.session_id);
        pushMessage(analysisToMessage(result));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not reach the DevAssist AI backend.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const text = input.trim();
    if (!text) return;
    setInput("");
    pushMessage({ id: uid(), role: "user", kind: "text", text });

    // "How do I...?" / "Where is...?" questions are answered from the
    // built-in help topics — no backend call, no support session created.
    const helpTopic = matchHelpTopic(text);
    if (helpTopic) {
      pushMessage({ id: uid(), role: "assistant", kind: "help", topic: helpTopic });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeText(text);
      setSessionId(result.session_id);
      pushMessage(analysisToMessage(result));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the DevAssist AI backend.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(topicId: string) {
    const topic = HELP_TOPICS.find((t) => t.id === topicId);
    if (!topic) return;
    pushMessage({ id: uid(), role: "user", kind: "text", text: QUICK_ACTIONS.find((q) => q.topicId === topicId)?.label ?? topic.title });
    pushMessage({ id: uid(), role: "assistant", kind: "help", topic });
  }

  async function handleOutcome(outcome: StepResultType, note: string) {
    if (!sessionId) return;
    const OUTCOME_LABELS: Record<StepResultType, string> = {
      resolved: "Issue Resolved",
      still_failing: "Problem Still Exists",
      different_error: `Different Error Appeared${note ? `: ${note}` : ""}`,
      need_info: `Need More Information${note ? `: ${note}` : ""}`,
    };
    pushMessage({ id: uid(), role: "user", kind: "text", text: OUTCOME_LABELS[outcome] });
    setLoading(true);
    setError(null);
    try {
      const result = await api.submitStepResult(sessionId, outcome, note);
      pushMessage(analysisToMessage(result));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit that result.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewConversation() {
    setMessages([WELCOME]);
    setSessionId(null);
    setInput("");
    setImageFile(null);
    setError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const lastGuidanceIdx = [...messages].reverse().findIndex((m) => m.kind === "guidance");
  const lastGuidanceId =
    lastGuidanceIdx === -1 ? null : messages[messages.length - 1 - lastGuidanceIdx].id;

  return (
    <>
      {/* Floating bubble — present on every page via the root layout */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-white shadow-xl transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[70vh] max-h-[640px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-navy-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">DevAssist AI Assistant</p>
                <p className="text-[11px] text-slate-400">Debug Smarter. Build Faster.</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                title="Start a new conversation"
                className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent-gradient px-3.5 py-2 text-[13px] text-white">
                      {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "info") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-[13px] text-slate-700 shadow-sm">
                      {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "help") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <ChatHelpCard topic={m.topic} />
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex justify-start">
                  <ChatGuidanceCard
                    analysis={m.analysis}
                    interactive={m.id === lastGuidanceId}
                    submitting={loading}
                    onOutcome={handleOutcome}
                    onOpenSaved={() => {
                      setOpen(false);
                      router.push("/saved-solutions");
                    }}
                  />
                </div>
              );
            })}

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pl-0.5">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.topicId}
                    onClick={() => handleQuickAction(qa.topicId)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-accent-blue/40 hover:bg-blue-50/50 hover:text-accent-blue"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-sm">
                  <Spinner className="h-3.5 w-3.5 text-accent-blue" />
                  <span className="text-[13px] text-slate-500">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-rose-50 px-3.5 py-2 text-[13px] text-rose-600">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-100 bg-white p-2.5">
            {imageFile && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                <span className="truncate">📷 {imageFile.name}</span>
                <button onClick={() => setImageFile(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach a screenshot"
                className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={imageFile ? "Add a caption, or just send..." : "Describe the problem or paste an error..."}
                className="input-field max-h-24 flex-1 resize-none py-2 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !imageFile)}
                className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gradient text-white disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
