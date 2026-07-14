import { describe, expect, it } from "vitest";
import { parseItalianLocalDateTime } from "./italianTime";

describe("parseItalianLocalDateTime", () => {
  it("converte un orario estivo (CEST, UTC+2) nell'istante UTC corretto", () => {
    const result = parseItalianLocalDateTime("2026-08-01T13:30");
    expect(result.toISOString()).toBe("2026-08-01T11:30:00.000Z");
  });

  it("converte un orario invernale (CET, UTC+1) nell'istante UTC corretto", () => {
    const result = parseItalianLocalDateTime("2026-01-15T20:45");
    expect(result.toISOString()).toBe("2026-01-15T19:45:00.000Z");
  });
});
