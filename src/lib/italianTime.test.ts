import { describe, expect, it } from "vitest";
import { parseItalianLocalDateTime, toItalianDateTimeLocalValue } from "./italianTime";

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

describe("toItalianDateTimeLocalValue", () => {
  it("è l'inverso di parseItalianLocalDateTime in estate", () => {
    expect(toItalianDateTimeLocalValue(new Date("2026-08-01T11:30:00.000Z"))).toBe(
      "2026-08-01T13:30",
    );
  });

  it("è l'inverso di parseItalianLocalDateTime in inverno", () => {
    expect(toItalianDateTimeLocalValue(new Date("2026-01-15T19:45:00.000Z"))).toBe(
      "2026-01-15T20:45",
    );
  });
});
