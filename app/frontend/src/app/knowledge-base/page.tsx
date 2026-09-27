import { Suspense } from "react";
import { KnowledgeBasePageInner } from "./KnowledgeBasePageInner";

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={null}>
      <KnowledgeBasePageInner />
    </Suspense>
  );
}
