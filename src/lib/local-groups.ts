import type { GroupSnapshot } from "@/lib/types";

export const LOCAL_GROUPS_KEY = "juldragning_local_groups";
/** @deprecated Legacy single-group key; migrated on read */
export const LEGACY_SESSION_KEY = "juldragning_session";

export type LocalGroupEntry = {
  inviteCode: string;
  participantId: string;
  groupName: string | null;
  myAssignmentName: string | null;
  drawnAt: string | null;
  updatedAt: string;
};

type LegacyJulSession = {
  participantId: string;
  inviteCode: string;
};

let storageOverride: Storage | null = null;

/** @internal */
export function __setStorageForTests(storage: Storage | null): void {
  storageOverride = storage;
}

function getStorage(): Storage | null {
  if (storageOverride) return storageOverride;
  if (typeof window === "undefined") return null;
  return localStorage;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

function readRawList(): LocalGroupEntry[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(LOCAL_GROUPS_KEY);
    if (!raw) {
      return migrateLegacySession(storage);
    }
    const parsed = JSON.parse(raw) as LocalGroupEntry[];
    if (!Array.isArray(parsed)) return migrateLegacySession(storage);
    return parsed
      .filter(
        (e) =>
          e &&
          typeof e.inviteCode === "string" &&
          typeof e.participantId === "string",
      )
      .map((e) => ({
        inviteCode: normalizeCode(e.inviteCode),
        participantId: e.participantId,
        groupName: e.groupName ?? null,
        myAssignmentName: e.myAssignmentName ?? null,
        drawnAt: e.drawnAt ?? null,
        updatedAt: e.updatedAt ?? nowIso(),
      }));
  } catch {
    return migrateLegacySession(storage);
  }
}

function migrateLegacySession(storage: Storage): LocalGroupEntry[] {
  try {
    const legacyRaw = storage.getItem(LEGACY_SESSION_KEY);
    if (!legacyRaw) return [];
    const legacy = JSON.parse(legacyRaw) as LegacyJulSession;
    if (!legacy.participantId || !legacy.inviteCode) {
      storage.removeItem(LEGACY_SESSION_KEY);
      return [];
    }
    const entry: LocalGroupEntry = {
      inviteCode: normalizeCode(legacy.inviteCode),
      participantId: legacy.participantId,
      groupName: null,
      myAssignmentName: null,
      drawnAt: null,
      updatedAt: nowIso(),
    };
    writeRawList([entry]);
    storage.removeItem(LEGACY_SESSION_KEY);
    return [entry];
  } catch {
    storage.removeItem(LEGACY_SESSION_KEY);
    return [];
  }
}

function writeRawList(entries: LocalGroupEntry[]): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(LOCAL_GROUPS_KEY, JSON.stringify(entries));
}

export function readLocalGroups(): LocalGroupEntry[] {
  const list = readRawList();
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getLocalParticipation(
  inviteCode: string,
): LocalGroupEntry | null {
  const code = normalizeCode(inviteCode);
  return readRawList().find((e) => e.inviteCode === code) ?? null;
}

export type UpsertLocalGroupInput = {
  inviteCode: string;
  participantId: string;
  groupName?: string | null;
  myAssignmentName?: string | null;
  drawnAt?: string | null;
};

export function upsertLocalGroup(input: UpsertLocalGroupInput): LocalGroupEntry {
  const code = normalizeCode(input.inviteCode);
  const list = readRawList();
  const index = list.findIndex((e) => e.inviteCode === code);
  const previous = index >= 0 ? list[index] : null;

  const entry: LocalGroupEntry = {
    inviteCode: code,
    participantId: input.participantId,
    groupName:
      input.groupName !== undefined
        ? input.groupName
        : (previous?.groupName ?? null),
    myAssignmentName:
      input.myAssignmentName !== undefined
        ? input.myAssignmentName
        : (previous?.myAssignmentName ?? null),
    drawnAt:
      input.drawnAt !== undefined
        ? input.drawnAt
        : (previous?.drawnAt ?? null),
    updatedAt: nowIso(),
  };

  if (index >= 0) {
    list[index] = entry;
  } else {
    list.push(entry);
  }

  writeRawList(list);
  return entry;
}

export function applySnapshotToLocalGroup(
  participantId: string,
  snapshot: GroupSnapshot,
): LocalGroupEntry {
  return upsertLocalGroup({
    inviteCode: snapshot.inviteCode,
    participantId,
    groupName: snapshot.name,
    drawnAt: snapshot.drawnAt,
    myAssignmentName: snapshot.myAssignment?.displayName ?? null,
  });
}

export function clearLocalGroups(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(LOCAL_GROUPS_KEY);
  storage.removeItem(LEGACY_SESSION_KEY);
}
