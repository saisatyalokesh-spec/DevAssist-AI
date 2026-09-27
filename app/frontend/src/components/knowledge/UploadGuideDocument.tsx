"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileUp, CircleCheck, TriangleAlert, ChevronDown } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

type Collection = "common" | "complex";

interface SlotState {
  file: File | null;
  uploading: boolean;
  result: { guides_parsed: number; total_guides: number } | null;
  error: string | null;
}

const EMPTY_SLOT: SlotState = { file: null, uploading: false, result: null, error: null };

export function UploadGuideDocument({ onUploaded }: { onUploaded?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [common, setCommon] = useState<SlotState>(EMPTY_SLOT);
  const [complex, setComplex] = useState<SlotState>(EMPTY_SLOT);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Upload Knowledge Base Document</p>
            <p className="text-xs text-slate-400">
              Manually send an updated Common or Complex RAG guidance .docx
            </p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <p className="mb-4 text-xs text-slate-500">
            Uploading a document <span className="font-medium text-slate-700">replaces every guide</span>{" "}
            currently in that collection — it must follow the same format as your existing
            knowledge base (e.g. <code className="rounded bg-slate-100 px-1 py-0.5">API-001 | Guide Title</code>{" "}
            headings with numbered sections).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UploadSlot
              label="Common Problems"
              collection="common"
              state={common}
              setState={setCommon}
              onUploaded={onUploaded}
            />
            <UploadSlot
              label="Complex Problems"
              collection="complex"
              state={complex}
              setState={setComplex}
              onUploaded={onUploaded}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function UploadSlot({
  label,
  collection,
  state,
  setState,
  onUploaded,
}: {
  label: string;
  collection: Collection;
  state: SlotState;
  setState: (s: SlotState) => void;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File) {
    setState({ file: f, uploading: false, result: null, error: null });
  }

  async function handleUpload() {
    if (!state.file) return;
    setState({ ...state, uploading: true, error: null, result: null });
    try {
      const res = await api.uploadGuideDocument(state.file, collection);
      setState({
        file: state.file,
        uploading: false,
        result: { guides_parsed: res.guides_parsed, total_guides: res.total_guides },
        error: null,
      });
      onUploaded?.();
    } catch (e) {
      setState({
        file: state.file,
        uploading: false,
        result: null,
        error: e instanceof ApiError ? e.message : "Upload failed.",
      });
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>

      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 px-4 py-6 text-center hover:border-slate-300"
      >
        <FileUp className="h-5 w-5 text-slate-400" />
        <p className="text-xs text-slate-500">
          {state.file ? state.file.name : "Click to choose a .docx file"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
          }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!state.file || state.uploading}
        className="btn-secondary mt-3 w-full"
      >
        {state.uploading ? <Spinner className="h-4 w-4" /> : "Upload & Replace"}
      </button>

      {state.result && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <CircleCheck className="h-3.5 w-3.5" />
          Parsed {state.result.guides_parsed} guides — knowledge base updated live.
        </p>
      )}
      {state.error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-rose-600">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {state.error}
        </p>
      )}
    </div>
  );
}
