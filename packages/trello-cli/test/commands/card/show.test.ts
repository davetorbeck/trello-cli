import { describe, it, expect } from "bun:test";
import Show from "../../../src/commands/card/show";

/**
 * Category 6: Card Commands - card:show
 * 
 * Tests #19-20: Data transformation and URL parsing
 */

describe("card:show", () => {
  // Create instance without full oclif initialization
  const instance = Object.create(Show.prototype);
  
  // Mock cache for toData
  instance.cache = {
    convertMemberIdsToEntity: async (ids: string[]) => 
      ids.map(id => ({ id, username: `user_${id}`, fullName: `User ${id}` }))
  };

  describe("toData (Test #19)", () => {
    it("extracts core card fields from API response", async () => {
      const rawData = {
        card: {
          id: "card123",
          name: "Test Card",
          due: "2025-01-30T12:00:00.000Z",
          desc: "Card description",
          labels: [{ id: "lbl1", name: "Bug", color: "red" }],
          url: "https://trello.com/c/abc123/test-card",
          idMembers: ["member1"],
          extraField: "ignored",
        },
        actions: [],
        attachments: [],
      };

      const result = await instance.toData(rawData);

      expect(result.id).toBe("card123");
      expect(result.name).toBe("Test Card");
      expect(result.due).toBe("2025-01-30T12:00:00.000Z");
      expect(result.description).toBe("Card description");
      expect(result.labels).toEqual([{ id: "lbl1", name: "Bug", color: "red" }]);
      expect(result.url).toBe("https://trello.com/c/abc123/test-card");
      expect(result).not.toHaveProperty("extraField");
    });

    it("transforms comments from actions", async () => {
      const rawData = {
        card: { id: "card123", name: "Test", labels: [], idMembers: [] },
        actions: [
          {
            id: "action1",
            date: "2025-01-20T10:00:00.000Z",
            data: { text: "This is a comment" },
            memberCreator: { fullName: "John Doe", username: "johnd" },
          },
          {
            id: "action2",
            date: "2025-01-21T10:00:00.000Z",
            data: { text: "Another comment" },
            memberCreator: { username: "janedoe" },
          },
        ],
        attachments: [],
      };

      const result = await instance.toData(rawData);

      expect(result.comments).toHaveLength(2);
      expect(result.comments[0]).toEqual({
        id: "action1",
        text: "This is a comment",
        date: "2025-01-20T10:00:00.000Z",
        author: "John Doe",
      });
      expect(result.comments[1].author).toBe("janedoe"); // Falls back to username
    });

    it("filters attachments to only images", async () => {
      const rawData = {
        card: { id: "card123", name: "Test", labels: [], idMembers: [] },
        actions: [],
        attachments: [
          { id: "att1", name: "photo.jpg", url: "https://...", mimeType: "image/jpeg" },
          { id: "att2", name: "doc.pdf", url: "https://...", mimeType: "application/pdf" },
          { id: "att3", name: "screenshot.png", url: "https://...", mimeType: "image/png" },
        ],
      };

      const result = await instance.toData(rawData);

      expect(result.images).toHaveLength(2);
      expect(result.images.map((i: any) => i.name)).toEqual(["photo.jpg", "screenshot.png"]);
    });

    it("handles missing memberCreator gracefully", async () => {
      const rawData = {
        card: { id: "card123", name: "Test", labels: [], idMembers: [] },
        actions: [
          {
            id: "action1",
            date: "2025-01-20T10:00:00.000Z",
            data: { text: "Orphan comment" },
            memberCreator: null,
          },
        ],
        attachments: [],
      };

      const result = await instance.toData(rawData);
      expect(result.comments[0].author).toBe("Unknown");
    });

    it("converts member IDs to entities", async () => {
      const rawData = {
        card: { id: "card123", name: "Test", labels: [], idMembers: ["m1", "m2"] },
        actions: [],
        attachments: [],
      };

      const result = await instance.toData(rawData);

      expect(result.members).toHaveLength(2);
      expect(result.members[0]).toHaveProperty("username", "user_m1");
    });
  });

  describe("parseCardUrl (Test #20)", () => {
    // Access private method for testing
    const parseCardUrl = (url: string): string | null => {
      const match = url.match(/trello\.com\/c\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    };

    it("extracts shortlink from standard Trello URL", () => {
      const url = "https://trello.com/c/iOtoErm9/123-card-name";
      expect(parseCardUrl(url)).toBe("iOtoErm9");
    });

    it("extracts shortlink from URL without card name", () => {
      const url = "https://trello.com/c/AbCdEfGh";
      expect(parseCardUrl(url)).toBe("AbCdEfGh");
    });

    it("extracts shortlink from URL with query params", () => {
      const url = "https://trello.com/c/yrSLWrI9/45-my-card?filter=all";
      expect(parseCardUrl(url)).toBe("yrSLWrI9");
    });

    it("handles HTTP URLs (non-HTTPS)", () => {
      const url = "http://trello.com/c/TestLink/99-test";
      expect(parseCardUrl(url)).toBe("TestLink");
    });

    it("returns null for invalid Trello URL", () => {
      const url = "https://example.com/c/nottrello";
      expect(parseCardUrl(url)).toBeNull();
    });

    it("returns null for board URL (not card)", () => {
      const url = "https://trello.com/b/BoardId/board-name";
      expect(parseCardUrl(url)).toBeNull();
    });

    it("returns null for malformed URL", () => {
      const url = "not-a-url";
      expect(parseCardUrl(url)).toBeNull();
    });

    it("handles URL with mixed case shortlink", () => {
      const url = "https://trello.com/c/AaBbCcDd/1-test";
      expect(parseCardUrl(url)).toBe("AaBbCcDd");
    });
  });
});
