"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon, Bell, FileText, Ticket } from "lucide-react";
import { api } from "@/lib/api";
import type { SearchResult } from "@/types";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .search(query.trim())
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (result.type === "guide") {
      router.push(`/knowledge-base/guide?id=${result.id}`);
    } else {
      router.push(`/sessions?id=${result.id}`);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur dark:border-navy-600 dark:bg-navy-900/90">
      <div ref={boxRef} className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search errors, tools, or ask anything..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-blue/30 dark:border-navy-600 dark:bg-navy-800 dark:text-slate-200"
        />
        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-card-lg dark:border-navy-600 dark:bg-navy-800">
            {loading && <p className="px-4 py-2 text-xs text-slate-400">Searching...</p>}
            {!loading && results.length === 0 && (
              <p className="px-4 py-2 text-xs text-slate-400">No matches yet.</p>
            )}
            {results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-navy-700"
              >
                {r.type === "guide" ? (
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                ) : (
                  <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-accent-purple" />
                )}
                <span>
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                    {r.title}
                  </span>
                  <span className="block text-xs text-slate-400">{r.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
