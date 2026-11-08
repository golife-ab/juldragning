export const SESSION_KEY = "juldragning_session";

export type JulSession = {
  participantId: string;
  inviteCode: string;
};

export function readSession(): JulSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JulSession;
    if (parsed.participantId && parsed.inviteCode) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeSession(session: JulSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
