import { Suspense } from "react";
import { SessionDetailPageInner } from "./SessionDetailPageInner";

export default function SessionDetailPage() {
  return (
    <Suspense fallback={null}>
      <SessionDetailPageInner />
    </Suspense>
  );
}
