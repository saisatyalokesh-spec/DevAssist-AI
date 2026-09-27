"use client";

import { useRouter } from "next/navigation";
import { Plus, Bookmark, BookOpen, Code2, TriangleAlert, ChevronRight } from "lucide-react";

const ACTIONS = [
  { icon: Plus, label: "New Troubleshooting Session", href: "/troubleshoot" },
  { icon: Bookmark, label: "View Saved Solutions", href: "/saved-solutions" },
  { icon: BookOpen, label: "Explore Knowledge Base", href: "/knowledge-base" },
  { icon: Code2, label: "Check API Error Codes", href: "/knowledge-base?category=API%20%26%20Integration" },
  { icon: TriangleAlert, label: "View Escalated Issues", href: "/escalations" },
];

export function QuickActions() {
  const router = useRouter();
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Quick Actions</h2>
      <div className="space-y-1">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => router.push(a.href)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 text-accent-blue" />
              <span className="flex-1">{a.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
