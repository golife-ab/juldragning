import { GroupPageInner } from "./group-page-inner";
import { Suspense } from "react";

export const instant = false;

export default function GroupPage() {
  return (
    <main className="flex flex-1 flex-col items-center">
      <Suspense fallback={<p className="text-gold/80">Laddar grupp…</p>}>
        <GroupPageInner />
      </Suspense>
    </main>
  );
}
