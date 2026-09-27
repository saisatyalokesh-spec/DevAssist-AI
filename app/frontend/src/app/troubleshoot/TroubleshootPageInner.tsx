"use client";

import { useSearchParams } from "next/navigation";
import { Workspace } from "@/components/troubleshoot/Workspace";

export function TroubleshootPageInner() {
  const searchParams = useSearchParams();
  const session = searchParams.get("session") || undefined;

  return (
    <div>
      <div className="mx-auto mb-6 max-w-7xl">
        <h1 className="text-xl font-semibold text-slate-800">Troubleshooting Workspace</h1>
        <p className="text-sm text-slate-500">
          Describe the customer&apos;s problem and DevAssist AI will find the relevant approved
          knowledge and walk you through it, step by step.
        </p>
      </div>
      <Workspace initialTab="text" initialSessionId={session} />
    </div>
  );
}
