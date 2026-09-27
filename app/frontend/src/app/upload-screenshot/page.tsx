import { Workspace } from "@/components/troubleshoot/Workspace";

export default function UploadScreenshotPage() {
  return (
    <div>
      <div className="mx-auto mb-6 max-w-7xl">
        <h1 className="text-xl font-semibold text-slate-800">Upload Screenshot</h1>
        <p className="text-sm text-slate-500">
          Upload a Postman, browser, or terminal screenshot — DevAssist AI extracts the error with
          OCR and analyzes it automatically.
        </p>
      </div>
      <Workspace initialTab="image" />
    </div>
  );
}
