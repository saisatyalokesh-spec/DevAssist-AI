import { Suspense } from "react";
import { TroubleshootPageInner } from "./TroubleshootPageInner";

export default function TroubleshootPage() {
  return (
    <Suspense fallback={null}>
      <TroubleshootPageInner />
    </Suspense>
  );
}
