"use client";

import { readApiError } from "@/lib/api";
import {
  participationForInvite,
  rememberParticipationFromSnapshot,
} from "@/lib/session";
import type { GroupSnapshot } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Props = { inviteCode: string };

export function GroupClient({ inviteCode }: Props) {
  const [snapshot, setSnapshot] = useState<GroupSnapshot | null>(null);
  const [participantId] = useState<string | null>(() =>
    participationForInvite(inviteCode)?.participantId ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (pid: string | null) => {
    setError(null);
    const qs = pid ? `?participantId=${encodeURIComponent(pid)}` : "";
    const res = await fetch(`/api/groups/${inviteCode}${qs}`);
    if (!res.ok) throw new Error(await readApiError(res));
    const data = (await res.json()) as GroupSnapshot;
    setSnapshot(data);
    return data;
  }, [inviteCode]);

  useEffect(() => {
    const pid = participantId;

    // Datahämtning för gruppvy; localStorage uppdateras när svaret kommer.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avsiktlig klienthämtning vid mount
    load(pid)
      .then((data) => {
        if (pid) {
          rememberParticipationFromSnapshot(pid, data);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Kunde inte ladda gruppen"),
      )
      .finally(() => setLoading(false));
  }, [inviteCode, load, participantId]);

  async function handleDraw() {
    if (!participantId) return;
    setDrawing(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${inviteCode}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as GroupSnapshot;
      setSnapshot(data);
      rememberParticipationFromSnapshot(participantId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dragningen misslyckades");
    } finally {
      setDrawing(false);
    }
  }

  async function copyInvite() {
    const link = `${window.location.origin}/?kod=${inviteCode}`;
    await navigator.clipboard.writeText(
      `Kod: ${inviteCode}\n${link}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-center text-gold/80">Laddar grupp…</p>;
  }

  if (!snapshot) {
    return (
      <p className="text-center text-red-200">
        {error ?? "Gruppen kunde inte visas"}
      </p>
    );
  }

  const canDraw =
    participantId &&
    snapshot.isOrganizer &&
    !snapshot.drawnAt &&
    snapshot.participants.length >= 3;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-gold/70">Inbjudningskod</p>
        <p className="font-mono text-3xl font-bold tracking-[0.35em] text-gold">
          {snapshot.inviteCode}
        </p>
        {snapshot.name ? (
          <h1 className="mt-2 text-xl font-semibold text-white">{snapshot.name}</h1>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={copyInvite}
          className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10"
        >
          {copied ? "Kopierat!" : "Kopiera kod & länk"}
        </button>
        {!participantId ? (
          <Link
            href={`/?kod=${inviteCode}`}
            className="rounded-lg bg-christmas-red px-4 py-2 text-sm font-medium text-white"
          >
            Gå med i gruppen
          </Link>
        ) : null}
      </div>

      <section className="rounded-2xl border border-gold/25 bg-forest-900/70 p-6">
        <h2 className="mb-3 text-lg font-semibold text-gold">
          Deltagare ({snapshot.participants.length})
        </h2>
        <ul className="space-y-2">
          {snapshot.participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-forest-950/80 px-3 py-2 text-white"
            >
              <span>{p.displayName}</span>
              {p.id === snapshot.organizerId ? (
                <span className="text-xs text-gold/80">Organisatör</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {participantId && snapshot.myAssignment ? (
        <section className="rounded-2xl border-2 border-gold/50 bg-christmas-red/20 p-6 text-center">
          <p className="text-sm text-gold/90">Du drar julklapp till</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {snapshot.myAssignment.displayName}
          </p>
        </section>
      ) : null}

      {participantId && !snapshot.drawnAt && snapshot.isOrganizer ? (
        <div className="space-y-3">
          {snapshot.participants.length < 3 ? (
            <p className="text-center text-sm text-gold/80">
              Minst tre deltagare krävs innan dragning.
            </p>
          ) : null}
          <button
            type="button"
            disabled={!canDraw || drawing}
            onClick={handleDraw}
            className="w-full rounded-xl bg-gold py-3 font-semibold text-forest-950 hover:bg-yellow-300 disabled:opacity-50"
          >
            {drawing ? "Drar…" : "Dra julklappar"}
          </button>
        </div>
      ) : null}

      {snapshot.drawnAt && participantId && !snapshot.myAssignment ? (
        <p className="text-center text-gold/80 text-sm">
          Dragningen är klar. Öppna sidan igen om du inte ser din mottagare.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-christmas-red/20 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <p className="text-center text-xs text-gold/60">
        <Link href="/" className="underline hover:text-gold/80">
          Tillbaka till startsidan
        </Link>
        {participantId
          ? ", där hittar du alla dina grupper på den här enheten."
          : "."}
      </p>
    </div>
  );
}
