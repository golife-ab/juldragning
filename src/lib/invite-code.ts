const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/[OIL01]/g, "");
}

export function isValidInviteCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(normalizeInviteCode(code));
}
