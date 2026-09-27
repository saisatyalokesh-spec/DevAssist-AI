"use client";

import { useRouter } from "next/navigation";
import { Compass, ArrowRight } from "lucide-react";
import type { HelpTopic } from "./helpTopics";

export function ChatHelpCard({ topic }: { topic: HelpTopic }) {
  const router = useRouter();

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white text-left shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
        <Compass className="h-4 w-4 shrink-0 text-accent-blue" />
        <p className="text-[13px] font-semibold text-slate-800">{topic.title}</p>
      </div>

      <div className="space-y-3 p-3.5">
        {topic.description && <p className="text-[13px] text-slate-600">{topic.description}</p>}

        {topic.steps && topic.steps.length > 0 && (
          <ol className="space-y-1.5">
            {topic.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        )}

        {topic.links && topic.links.length > 0 && (
          <div className="grid grid-cols-1 gap-1.5">
            {topic.links.map((link) => (
              <button
                key={link.route}
                onClick={() => router.push(link.route)}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:border-accent-blue/40 hover:bg-blue-50/50"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
              </button>
            ))}
          </div>
        )}

        {topic.route && (
          <button
            onClick={() => router.push(topic.route!)}
            className="btn-primary h-8 w-full px-3 text-xs"
          >
            {topic.routeLabel || "Go there"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
