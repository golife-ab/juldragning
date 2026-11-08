import {
  applySnapshotToLocalGroup,
  getLocalParticipation,
  readLocalGroups,
  upsertLocalGroup,
  type LocalGroupEntry,
  type UpsertLocalGroupInput,
} from "@/lib/local-groups";
import type { GroupSnapshot } from "@/lib/types";

export type JulSession = {
  participantId: string;
  inviteCode: string;
};

/** @deprecated Use local group helpers; kept for gradual migration */
export const SESSION_KEY = "juldragning_session";

export function readLocalGroupEntries(): LocalGroupEntry[] {
  return readLocalGroups();
}

export function rememberParticipation(input: UpsertLocalGroupInput): void {
  upsertLocalGroup(input);
}

export function rememberParticipationFromSnapshot(
  participantId: string,
  snapshot: GroupSnapshot,
): LocalGroupEntry {
  return applySnapshotToLocalGroup(participantId, snapshot);
}

export function participationForInvite(
  inviteCode: string,
): LocalGroupEntry | null {
  return getLocalParticipation(inviteCode);
}

/** Last touched group on this device, if any */
export function readSession(): JulSession | null {
  const [latest] = readLocalGroups();
  if (!latest) return null;
  return {
    participantId: latest.participantId,
    inviteCode: latest.inviteCode,
  };
}

export function writeSession(session: JulSession): void {
  upsertLocalGroup({
    inviteCode: session.inviteCode,
    participantId: session.participantId,
  });
}

export function clearSession(): void {
  // Intentionally does not wipe all groups; legacy name kept for API stability
}
