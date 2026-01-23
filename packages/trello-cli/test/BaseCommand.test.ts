import { describe, it, expect } from "bun:test";

/**
 * BaseCommand Tests
 * 
 * Tests for card ID detection and format flag handling.
 * These test OUR code logic, not external libraries.
 */

// Card ID detection patterns (extracted from BaseCommand.ts lines 100-101)
const isFullId = (card: string) => /^[a-f0-9]{24}$/i.test(card);
const isShortLink = (card: string) => /^[a-zA-Z0-9]{8}$/.test(card);

// Format selection logic (extracted from BaseCommand.ts lines 155-181)
function resolveFormat(flagFormat: string | undefined, defaultOutput: string): string {
  let format = flagFormat;
  if (!format || format === "default") {
    format = defaultOutput;
  }
  return format;
}

describe("BaseCommand", () => {
  describe("Card ID Detection - 24-char hex", () => {
    it("detects valid 24-char lowercase hex ID", () => {
      expect(isFullId("6971cce9adce0658ae34e7c6")).toBe(true);
    });

    it("detects valid 24-char uppercase hex ID", () => {
      expect(isFullId("6971CCE9ADCE0658AE34E7C6")).toBe(true);
    });

    it("detects valid 24-char mixed case hex ID", () => {
      expect(isFullId("6971CcE9aDcE0658Ae34e7C6")).toBe(true);
    });

    it("rejects 23-char hex string (too short)", () => {
      expect(isFullId("6971cce9adce0658ae34e7c")).toBe(false);
    });

    it("rejects 25-char hex string (too long)", () => {
      expect(isFullId("6971cce9adce0658ae34e7c6a")).toBe(false);
    });

    it("rejects 24-char string with non-hex characters", () => {
      expect(isFullId("6971cce9adce0658ae34e7cg")).toBe(false);
    });

    it("rejects card names that look like IDs but have spaces", () => {
      expect(isFullId("6971cce9adce0658 e34e7c6")).toBe(false);
    });

    it("rejects regular card names", () => {
      expect(isFullId("My Important Task")).toBe(false);
    });
  });

  describe("Card ID Detection - 8-char shortlink", () => {
    it("detects valid 8-char alphanumeric shortlink", () => {
      expect(isShortLink("yrSLWrI9")).toBe(true);
    });

    it("detects all lowercase shortlink", () => {
      expect(isShortLink("abcdefgh")).toBe(true);
    });

    it("detects all uppercase shortlink", () => {
      expect(isShortLink("ABCDEFGH")).toBe(true);
    });

    it("detects all numeric shortlink", () => {
      expect(isShortLink("12345678")).toBe(true);
    });

    it("rejects 7-char string (too short)", () => {
      expect(isShortLink("yrSLWrI")).toBe(false);
    });

    it("rejects 9-char string (too long)", () => {
      expect(isShortLink("yrSLWrI9a")).toBe(false);
    });

    it("rejects 8-char string with special characters", () => {
      expect(isShortLink("yrSL-rI9")).toBe(false);
    });

    it("rejects 8-char string with spaces", () => {
      expect(isShortLink("yrSL rI9")).toBe(false);
    });

    it("rejects regular card names even if 8 chars", () => {
      expect(isShortLink("My Task!")).toBe(false);
    });
  });

  describe("output format resolution", () => {
    it("uses flag format when explicitly set to json", () => {
      expect(resolveFormat("json", "silent")).toBe("json");
    });

    it("uses flag format when explicitly set to csv", () => {
      expect(resolveFormat("csv", "silent")).toBe("csv");
    });

    it("uses defaultOutput when flag is 'default'", () => {
      expect(resolveFormat("default", "json")).toBe("json");
    });

    it("uses defaultOutput when flag is undefined", () => {
      expect(resolveFormat(undefined, "fancy")).toBe("fancy");
    });

    it("uses defaultOutput when flag is empty string", () => {
      // Edge case: empty string should behave like undefined
      expect(resolveFormat("", "raw")).toBe("raw");
    });

    it("preserves silent output when set as default", () => {
      expect(resolveFormat("default", "silent")).toBe("silent");
    });

    it("explicit format overrides silent default", () => {
      expect(resolveFormat("json", "silent")).toBe("json");
    });
  });

  describe("Card ID vs Name disambiguation", () => {
    // Integration-style tests for the full decision logic
    
    it("identifies full ID and skips name lookup", () => {
      const card = "6971cce9adce0658ae34e7c6";
      const shouldSkipLookup = isFullId(card) || isShortLink(card);
      expect(shouldSkipLookup).toBe(true);
    });

    it("identifies shortlink and skips name lookup", () => {
      const card = "yrSLWrI9";
      const shouldSkipLookup = isFullId(card) || isShortLink(card);
      expect(shouldSkipLookup).toBe(true);
    });

    it("requires name lookup for regular card names", () => {
      const card = "Fix authentication bug";
      const shouldSkipLookup = isFullId(card) || isShortLink(card);
      expect(shouldSkipLookup).toBe(false);
    });

    it("requires name lookup for numeric card names", () => {
      // A card named "123" should still require lookup (not 8 or 24 chars)
      const card = "123";
      const shouldSkipLookup = isFullId(card) || isShortLink(card);
      expect(shouldSkipLookup).toBe(false);
    });

    it("correctly handles edge case: 24-char non-hex name", () => {
      // A card name that happens to be 24 chars but not hex
      const card = "This is exactly 24 char!";
      expect(card.length).toBe(24);
      const shouldSkipLookup = isFullId(card) || isShortLink(card);
      expect(shouldSkipLookup).toBe(false);
    });
  });
});
