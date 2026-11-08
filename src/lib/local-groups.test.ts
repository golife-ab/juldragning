import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_SESSION_KEY,
  LOCAL_GROUPS_KEY,
  __setStorageForTests,
  applySnapshotToLocalGroup,
  getLocalParticipation,
  readLocalGroups,
  upsertLocalGroup,
} from "./local-groups";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("local-groups", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    __setStorageForTests(storage);
  });

  afterEach(() => {
    __setStorageForTests(null);
  });

  it("sparar flera grupper utan att skriva över varandra", () => {
    upsertLocalGroup({
      inviteCode: "aaaaaa",
      participantId: "p1",
    });
    upsertLocalGroup({
      inviteCode: "bbbbbb",
      participantId: "p2",
    });

    const groups = readLocalGroups();
    expect(groups).toHaveLength(2);
    expect(getLocalParticipation("AAAAAA")?.participantId).toBe("p1");
    expect(getLocalParticipation("bbbbbb")?.participantId).toBe("p2");
  });

  it("uppdaterar uppdrag efter dragning", () => {
    upsertLocalGroup({
      inviteCode: "cccccc",
      participantId: "p3",
      groupName: "Kompisgänget",
    });

    applySnapshotToLocalGroup("p3", {
      id: "g1",
      name: "Kompisgänget",
      inviteCode: "CCCCCC",
      organizerId: "other",
      drawnAt: "2026-11-08T12:00:00.000Z",
      participants: [],
      myAssignment: { id: "r1", displayName: "Sara" },
      isOrganizer: false,
    });

    const entry = getLocalParticipation("cccccc");
    expect(entry?.myAssignmentName).toBe("Sara");
    expect(entry?.drawnAt).toBe("2026-11-08T12:00:00.000Z");
  });

  it("migrerar gammal enskild session till listan", () => {
    storage.setItem(
      LEGACY_SESSION_KEY,
      JSON.stringify({ inviteCode: "dddddd", participantId: "p9" }),
    );

    const groups = readLocalGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0]?.inviteCode).toBe("DDDDDD");
    expect(storage.getItem(LEGACY_SESSION_KEY)).toBeNull();
    expect(storage.getItem(LOCAL_GROUPS_KEY)).toBeTruthy();
  });
});
