"use client";

import { useCallback, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";

interface Props {
  file: File | null;
  setFile: (f: File | null) => void;
}

export function ImageUploader({ file, setFile }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clear() {
    setFile(null);
    setPreview(null);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload Screenshot</label>

      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver ? "border-accent-blue bg-accent-blue/5" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <ImageUp className="h-7 w-7 text-slate-400" />
          <p className="text-sm text-slate-600">
            Drag & drop a screenshot, or <span className="font-medium text-accent-blue">browse</span>
          </p>
          <p className="text-xs text-slate-400">Postman, browser console, terminal, or app error screens</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
            }}
          />
        </div>
      )}

      {file && preview && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Screenshot preview" className="max-h-64 w-full object-contain bg-slate-50" />
            <button
              onClick={clear}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
            <p className="truncate text-xs text-slate-500">{file.name}</p>
            <button onClick={() => inputRef.current?.click()} className="text-xs font-medium text-accent-blue">
              Replace
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
