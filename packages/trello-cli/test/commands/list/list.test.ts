import { describe, it, expect } from "bun:test";
import ListList from "../../../src/commands/list/list";

/**
 * Category 7: List Commands - list:list
 * 
 * Test #25: Data transformation for lists
 */

describe("list:list", () => {
  const instance = Object.create(ListList.prototype);

  describe("toData (Test #25)", () => {
    it("extracts list fields from API response", () => {
      const rawData = [
        {
          id: "list1",
          name: "To Do",
          // Extra API fields
          closed: false,
          idBoard: "board123",
          pos: 16384,
          subscribed: false,
        },
        {
          id: "list2",
          name: "In Progress",
          closed: false,
          idBoard: "board123",
          pos: 32768,
        },
        {
          id: "list3",
          name: "Done",
          closed: false,
          idBoard: "board123",
          pos: 49152,
        },
      ];

      const result = instance.toData(rawData);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: "list1", name: "To Do" });
      expect(result[1]).toEqual({ id: "list2", name: "In Progress" });
      expect(result[2]).toEqual({ id: "list3", name: "Done" });
    });

    it("handles empty list array", () => {
      const result = instance.toData([]);
      expect(result).toEqual([]);
    });

    it("strips position and board reference", () => {
      const rawData = [
        {
          id: "l1",
          name: "List",
          pos: 1024,
          idBoard: "board123",
          closed: false,
          subscribed: true,
          softLimit: null,
        },
      ];

      const result = instance.toData(rawData);

      expect(result[0]).toEqual({ id: "l1", name: "List" });
      expect(result[0]).not.toHaveProperty("pos");
      expect(result[0]).not.toHaveProperty("idBoard");
      expect(result[0]).not.toHaveProperty("closed");
    });

    it("preserves list order from API", () => {
      const rawData = [
        { id: "l3", name: "Third", pos: 49152 },
        { id: "l1", name: "First", pos: 16384 },
        { id: "l2", name: "Second", pos: 32768 },
      ];

      const result = instance.toData(rawData);

      // Order should be preserved as received
      expect(result[0].name).toBe("Third");
      expect(result[1].name).toBe("First");
      expect(result[2].name).toBe("Second");
    });
  });

  describe("format", () => {
    it("displays lists as 'name (ID: id)' per line", async () => {
      const data = [
        { id: "list1", name: "To Do" },
        { id: "list2", name: "In Progress" },
        { id: "list3", name: "Done" },
      ];

      const result = await instance.format(data);

      expect(result).toBe("To Do (ID: list1)\nIn Progress (ID: list2)\nDone (ID: list3)");
    });

    it("handles single list", async () => {
      const data = [{ id: "only", name: "Only List" }];
      const result = await instance.format(data);
      expect(result).toBe("Only List (ID: only)");
    });

    it("handles empty list", async () => {
      const data: any[] = [];
      const result = await instance.format(data);
      expect(result).toBe("");
    });

    it("handles list names with numbers", async () => {
      const data = [
        { id: "l1", name: "Sprint 42" },
        { id: "l2", name: "Week 1 Tasks" },
      ];

      const result = await instance.format(data);

      expect(result).toContain("Sprint 42");
      expect(result).toContain("Week 1 Tasks");
    });
  });
});
