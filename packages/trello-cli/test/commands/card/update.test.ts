import { describe, it, expect } from "bun:test";
import Update from "../../../src/commands/card/update";

describe("card:update", () => {
  const instance = Object.create(Update.prototype);

  describe("toData", () => {
    it("maps desc to description and strips extra fields", () => {
      const rawData = {
        id: "card123",
        name: "Test Card",
        due: "2025-01-25T00:00:00.000Z",
        desc: "Card description",
        labels: [{ id: "label1", name: "Bug", color: "red" }],
        url: "https://trello.com/c/abc123",
        idBoard: "board1",
        idList: "list1",
      };

      expect(instance.toData(rawData)).toEqual({
        id: "card123",
        name: "Test Card",
        due: "2025-01-25T00:00:00.000Z",
        description: "Card description",
        labels: [{ id: "label1", name: "Bug", color: "red" }],
        url: "https://trello.com/c/abc123",
      });
    });
  });
});
