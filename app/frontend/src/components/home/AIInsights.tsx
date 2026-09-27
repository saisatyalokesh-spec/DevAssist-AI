"use client";

import { useEffect, useState } from "react";
import { Bug, BookMarked, Activity, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { InsightsOut } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

export function AIInsights() {
  const [data, setData] = useState<InsightsOut | null>(null);

  useEffect(() => {
    api.getInsights().then(setData).catch(() => setData(null));
  }, []);

  const items = [
    { icon: Bug, label: "Problems Analyzed", value: data?.problems_analyzed, tint: "bg-rose-50 text-rose-500" },
    { icon: BookMarked, label: "Guides Retrieved", value: data?.guides_retrieved, tint: "bg-emerald-50 text-emerald-500" },
    { icon: Activity, label: "Active Sessions", value: data?.active_sessions, tint: "bg-blue-50 text-blue-500" },
    { icon: TriangleAlert, label: "Escalated", value: data?.escalated, tint: "bg-amber-50 text-amber-500" },
  ];

  return (
    <div className="card p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">AI Insights</h2>
      {!data ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-5 w-5 text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none text-slate-800">{item.value ?? 0}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-[11px] text-slate-400">
        Live counts from your session database — not a fixed demo number.
      </p>
    </div>
  );
}
