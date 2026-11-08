"use client";

import { readApiError } from "@/lib/api";
import { writeSession } from "@/lib/session";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type Mode = "create" | "join";

export function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCode = searchParams.get("kod") ?? "";

  const [mode, setMode] = useState<Mode>(presetCode ? "join" : "create");
  const [groupName, setGroupName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [joinCode, setJoinCode] = useState(presetCode);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizerName,
            name: groupName || undefined,
          }),
        });
        if (!res.ok) throw new Error(await readApiError(res));
        const data = (await res.json()) as {
          inviteCode: string;
          participantId: string;
        };
        writeSession({
          inviteCode: data.inviteCode,
          participantId: data.participantId,
        });
        router.push(`/grupp/${data.inviteCode}`);
      } else {
        const res = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode: joinCode, displayName }),
        });
        if (!res.ok) throw new Error(await readApiError(res));
        const data = (await res.json()) as {
          inviteCode: string;
          participantId: string;
        };
        writeSession({
          inviteCode: data.inviteCode,
          participantId: data.participantId,
        });
        router.push(`/grupp/${data.inviteCode}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex rounded-xl border border-gold/30 bg-forest-900/60 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "create"
              ? "bg-christmas-red text-white"
              : "text-gold/80 hover:text-gold"
          }`}
          onClick={() => setMode("create")}
        >
          Skapa grupp
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "join"
              ? "bg-christmas-red text-white"
              : "text-gold/80 hover:text-gold"
          }`}
          onClick={() => setMode("join")}
        >
          Gå med
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-gold/25 bg-forest-900/70 p-6 shadow-xl backdrop-blur"
      >
        {mode === "create" ? (
          <>
            <label className="block text-sm text-gold/90">
              Ditt namn (organisatör)
              <input
                className="mt-1 w-full rounded-lg border border-gold/30 bg-forest-950 px-3 py-2 text-white"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label className="block text-sm text-gold/90">
              Gruppnamn (valfritt)
              <input
                className="mt-1 w-full rounded-lg border border-gold/30 bg-forest-950 px-3 py-2 text-white"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Till exempel Teamet"
              />
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm text-gold/90">
              Inbjudningskod
              <input
                className="mt-1 w-full rounded-lg border border-gold/30 bg-forest-950 px-3 py-2 uppercase tracking-widest text-white"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                pattern="[A-Z2-9]{6}"
                title="6 tecken, utan O/0/I/1"
              />
            </label>
            <label className="block text-sm text-gold/90">
              Ditt namn
              <input
                className="mt-1 w-full rounded-lg border border-gold/30 bg-forest-950 px-3 py-2 text-white"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          </>
        )}

        {error ? (
          <p className="rounded-lg bg-christmas-red/20 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-christmas-red py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Vänta…" : mode === "create" ? "Skapa grupp" : "Gå med"}
        </button>
      </form>
    </div>
  );
}
