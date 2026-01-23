import { describe, it, expect } from "bun:test";
import List from "../../../src/commands/card/list";

/**
 * Category 6: Card Commands - card:list
 * 
 * Test #22: Array data transformation
 */

describe("card:list", () => {
  const instance = Object.create(List.prototype);

  describe("toData (Test #22)", () => {
    it("extracts card fields from array of cards", () => {
      const rawData = [
        {
          id: "card1",
          name: "First Card",
          desc: "Description 1",
          due: "2025-01-30T12:00:00.000Z",
          closed: false,
          url: "https://trello.com/c/card1",
          labels: [{ id: "l1", name: "Bug", color: "red" }],
          idList: "list123",
          pos: 1024,
        },
        {
          id: "card2",
          name: "Second Card",
          desc: "",
          due: null,
          closed: true,
          url: "https://trello.com/c/card2",
          labels: [],
          idList: "list123",
          pos: 2048,
        },
      ];

      const result = instance.toData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "card1",
        name: "First Card",
        description: "Description 1",
        due: "2025-01-30T12:00:00.000Z",
        closed: false,
        url: "https://trello.com/c/card1",
        labels: [{ id: "l1", name: "Bug", color: "red" }],
      });
      expect(result[1]).toEqual({
        id: "card2",
        name: "Second Card",
        description: "",
        due: null,
        closed: true,
        url: "https://trello.com/c/card2",
        labels: [],
      });
    });

    it("handles empty card list", () => {
      const result = instance.toData([]);
      expect(result).toEqual([]);
    });

    it("strips extra API fields", () => {
      const rawData = [
        {
          id: "card1",
          name: "Card",
          desc: "Desc",
          due: null,
          closed: false,
          url: "https://...",
          labels: [],
          // Extra fields that should be stripped
          idBoard: "board123",
          idList: "list123",
          pos: 16384,
          subscribed: true,
          badges: { votes: 0 },
          checkItemStates: [],
        },
      ];

      const result = instance.toData(rawData);

      expect(result[0]).not.toHaveProperty("idBoard");
      expect(result[0]).not.toHaveProperty("idList");
      expect(result[0]).not.toHaveProperty("pos");
      expect(result[0]).not.toHaveProperty("subscribed");
      expect(result[0]).not.toHaveProperty("badges");
    });
  });

  describe("format", () => {
    it("formats cards as 'name (ID: id)' per line", async () => {
      const data = [
        { id: "card1", name: "First Card" },
        { id: "card2", name: "Second Card" },
      ];

      const result = await instance.format(data);

      expect(result).toBe("First Card (ID: card1)\nSecond Card (ID: card2)");
    });

    it("handles single card", async () => {
      const data = [{ id: "solo", name: "Only Card" }];
      const result = await instance.format(data);
      expect(result).toBe("Only Card (ID: solo)");
    });

    it("handles empty array", async () => {
      const data: any[] = [];
      const result = await instance.format(data);
      expect(result).toBe("");
    });

    it("handles cards with special characters in name", async () => {
      const data = [{ id: "card1", name: "Card with 'quotes' & symbols" }];
      const result = await instance.format(data);
      expect(result).toContain("Card with 'quotes' & symbols");
    });
  });
});
