"use client";

import { readApiError } from "@/lib/api";
import {
  readLocalGroupEntries,
  rememberParticipationFromSnapshot,
} from "@/lib/session";
import type { GroupSnapshot } from "@/lib/types";
import type { LocalGroupEntry } from "@/lib/local-groups";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MyGroupsList() {
  const [entries, setEntries] = useState<LocalGroupEntry[]>(() =>
    readLocalGroupEntries(),
  );
  const [refreshing, setRefreshing] = useState(() => {
    return readLocalGroupEntries().length > 0;
  });

  useEffect(() => {
    const stored = readLocalGroupEntries();
    if (stored.length === 0) return;

    let cancelled = false;

    void (async () => {
      const next: LocalGroupEntry[] = [];

      for (const entry of stored) {
        try {
          const res = await fetch(
            `/api/groups/${entry.inviteCode}?participantId=${encodeURIComponent(entry.participantId)}`,
          );
          if (!res.ok) throw new Error(await readApiError(res));
          const snapshot = (await res.json()) as GroupSnapshot;
          const updated = rememberParticipationFromSnapshot(
            entry.participantId,
            snapshot,
          );
          next.push(updated);
        } catch {
          next.push(entry);
        }
      }

      if (!cancelled) {
        setEntries(
          [...next].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        );
        setRefreshing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 w-full max-w-md">
      <h2 className="mb-3 text-center text-lg font-semibold text-gold">
        Dina grupper
      </h2>
      <p className="mb-4 text-center text-sm text-gold/75">
        Här sparas grupper du skapat eller gått med i, på den här enheten.
      </p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.inviteCode}>
            <Link
              href={`/grupp/${entry.inviteCode}`}
              className="block rounded-xl border border-gold/25 bg-forest-900/70 px-4 py-3 transition hover:border-gold/45 hover:bg-forest-900/90"
            >
              <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      {entry.groupName?.trim()
                        ? entry.groupName
                        : `Grupp ${entry.inviteCode}`}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tracking-widest text-gold/70">
                      {entry.inviteCode}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gold/60">Öppna</span>
                </div>
                {entry.drawnAt && entry.myAssignmentName ? (
                  <p className="mt-2 text-sm text-gold/90">
                    Du drar julklapp till{" "}
                    <span className="font-semibold text-white">
                      {entry.myAssignmentName}
                    </span>
                  </p>
                ) : entry.drawnAt ? (
                  <p className="mt-2 text-sm text-gold/80">
                    Dragning klar. Öppna gruppen för att se din mottagare.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gold/70">
                    Väntar på dragning
                  </p>
                )}
            </Link>
          </li>
        ))}
      </ul>
      {refreshing ? (
        <p className="mt-2 text-center text-xs text-gold/50">Uppdaterar…</p>
      ) : null}
    </section>
  );
}
