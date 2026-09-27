"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import type { GuideSummary } from "@/types";
import { KnowledgeGuideCard } from "@/components/knowledge/KnowledgeGuideCard";
import { UploadGuideDocument } from "@/components/knowledge/UploadGuideDocument";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

type CollectionFilter = "all" | "common" | "complex";

export function KnowledgeBasePageInner() {
  const searchParams = useSearchParams();
  const [collection, setCollection] = useState<CollectionFilter>("all");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [team, setTeam] = useState("");
  const [query, setQuery] = useState("");
  const [guides, setGuides] = useState<GuideSummary[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);

  function refreshFilters() {
    api.listCategories().then(setCategories).catch(() => setCategories([]));
    api.listTeams().then(setTeams).catch(() => setTeams([]));
  }

  function refreshGuides() {
    setGuides(null);
    api
      .listGuides({
        collection: collection === "all" ? undefined : collection,
        category: category || undefined,
        team: team || undefined,
        q: query || undefined,
      })
      .then(setGuides)
      .catch(() => setGuides([]));
  }

  useEffect(() => {
    refreshFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(refreshGuides, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, category, team, query]);

  function handleUploaded() {
    refreshFilters();
    refreshGuides();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Knowledge Base</h1>
        <p className="text-sm text-slate-500">Browse approved troubleshooting guides.</p>
      </div>

      <div className="mb-5">
        <UploadGuideDocument onUploaded={handleUploaded} />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["all", "common", "complex"] as CollectionFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setCollection(c)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                collection === c ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              {c === "all" ? "All Guides" : `${c} Problems`}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search troubleshooting guides..."
            className="input-field pl-9"
          />
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field sm:w-48">
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={team} onChange={(e) => setTeam(e.target.value)} className="input-field sm:w-56">
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {guides === null && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      )}

      {guides !== null && guides.length === 0 && (
        <EmptyState icon={BookOpen} title="No guides match your filters" description="Try clearing a filter or search term." />
      )}

      {guides !== null && guides.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <KnowledgeGuideCard key={g.guide_id} guide={g} />
          ))}
        </div>
      )}
    </div>
  );
}
