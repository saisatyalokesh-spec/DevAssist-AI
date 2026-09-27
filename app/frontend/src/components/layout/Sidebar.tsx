"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, ImageUp, Bookmark, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/troubleshoot", label: "Troubleshoot", icon: Wrench },
  { href: "/upload-screenshot", label: "Upload Screenshot", icon: ImageUp },
  { href: "/saved-solutions", label: "Saved Solutions", icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-navy-900 text-slate-300 lg:flex">
      <div className="px-6 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient shadow-lg">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight text-white">
              DevAssist <span className="text-accent-light">AI</span>
            </p>
            <p className="text-[11px] text-slate-400">Debug Smarter. Build Faster.</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 mt-2 rounded-xl2 bg-gradient-to-br from-navy-700 to-navy-800 p-4">
        <p className="text-[13px] font-semibold leading-snug text-white">
          Fix Errors.
          <br />
          Learn Faster.
          <br />
          Build Better.
        </p>
      </div>
    </aside>
  );
}
