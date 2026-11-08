import { describe, expect, it } from "vitest";
import { assignSecretSanta } from "./secret-santa";

describe("assignSecretSanta", () => {
  it("ger inga självmatchningar för 3 deltagare", () => {
    const assignment = assignSecretSanta(3);
    expect(assignment).toHaveLength(3);
    assignment.forEach((target, i) => {
      expect(target).not.toBe(i);
    });
    expect(new Set(assignment).size).toBe(3);
  });

  it("ger permutation för 10 deltagare", () => {
    const assignment = assignSecretSanta(10);
    expect(assignment).toHaveLength(10);
    assignment.forEach((target, i) => {
      expect(target).not.toBe(i);
    });
    expect(new Set(assignment).size).toBe(10);
  });
});
