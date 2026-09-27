"use client";

import { useRouter } from "next/navigation";
import { ImageUp, FileText, Bookmark, BookOpen, ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: ImageUp,
    title: "Upload Screenshot",
    description: "Upload an error screenshot and analyze it.",
    cta: "Analyze Screenshot",
    href: "/upload-screenshot",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    icon: FileText,
    title: "Paste Error Logs",
    description: "Paste error messages, logs, or stack traces.",
    cta: "Paste error",
    href: "/troubleshoot",
    tint: "bg-blue-50 text-blue-600",
  },
  {
    icon: Bookmark,
    title: "Saved Solutions",
    description: "Every analyzed ticket's guidance, saved automatically.",
    cta: "View saved guidance",
    href: "/saved-solutions",
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: BookOpen,
    title: "Explore Knowledge Base",
    description: "Browse approved troubleshooting guides.",
    cta: "Browse guides",
    href: "/knowledge-base",
    tint: "bg-amber-50 text-amber-600",
  },
];

export function QuickActionCards() {
  const router = useRouter();
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.title}
            onClick={() => router.push(c.href)}
            className="card card-hover group flex flex-col items-start gap-3 p-5 text-left"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{c.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-xs font-medium text-accent-blue">
              {c.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        );
      })}
    </section>
  );
}
