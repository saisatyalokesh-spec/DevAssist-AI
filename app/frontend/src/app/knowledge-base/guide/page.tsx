import { Suspense } from "react";
import { GuideDetailPageInner } from "./GuideDetailPageInner";

export default function GuideDetailPage() {
  return (
    <Suspense fallback={null}>
      <GuideDetailPageInner />
    </Suspense>
  );
}
