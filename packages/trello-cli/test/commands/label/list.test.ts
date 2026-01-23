import { describe, it, expect } from "bun:test";
import LabelList from "../../../src/commands/label/list";

describe("label:list", () => {
  const instance = Object.create(LabelList.prototype);

  describe("toData", () => {
    it("extracts only id, name, color from raw API response", () => {
      const rawData = [
        { id: "123", name: "Bug", color: "red", idBoard: "board1", extra: "ignored" },
      ];
      expect(instance.toData(rawData)).toEqual([
        { id: "123", name: "Bug", color: "red" },
      ]);
    });
  });

  describe("format", () => {
    it("formats labels as [color] name (ID: id)", async () => {
      const data = [{ id: "123", name: "Bug", color: "red" }];
      expect(await instance.format(data)).toBe("[red] Bug (ID: 123)");
    });

    it("shows (unnamed) for empty names", async () => {
      const data = [{ id: "123", name: "", color: "yellow" }];
      expect(await instance.format(data)).toContain("(unnamed)");
    });

    it("shows [no color] when color is null", async () => {
      const data = [{ id: "123", name: "Test", color: null }];
      expect(await instance.format(data)).toContain("[no color]");
    });

    it("returns empty message for empty array", async () => {
      expect(await instance.format([])).toBe("No labels found on this board");
    });
  });
});
