import { HomeClient } from "@/components/home-client";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center">
      <header className="mb-8 text-center">
        <p className="text-4xl" aria-hidden>
          🎄
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gold">Julklappsdragning</h1>
        <p className="mt-2 max-w-sm text-sm text-gold/80">
          Skapa en grupp, bjud in med kod och dra vem som ska få julklapp av vem.
        </p>
      </header>
      <Suspense fallback={<p className="text-gold/70">Laddar…</p>}>
        <HomeClient />
      </Suspense>
    </main>
  );
}
