import { describe, it, expect } from "bun:test";
import BoardList from "../../../src/commands/board/list";

/**
 * Category 7: Board Commands - board:list
 * 
 * Tests #23-24: Data transformation and format display
 */

describe("board:list", () => {
  const instance = Object.create(BoardList.prototype);

  describe("toData (Test #23)", () => {
    it("extracts board fields from API response", () => {
      const rawData = [
        {
          id: "board1",
          name: "Project Alpha",
          desc: "Main project board",
          url: "https://trello.com/b/board1/project-alpha",
          // Extra fields from API
          closed: false,
          idOrganization: "org123",
          pinned: true,
          starred: false,
          memberships: [],
          shortLink: "abc123",
        },
        {
          id: "board2",
          name: "Personal Tasks",
          desc: "",
          url: "https://trello.com/b/board2/personal-tasks",
          closed: false,
          idOrganization: null,
        },
      ];

      const result = instance.toData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "board1",
        name: "Project Alpha",
        desc: "Main project board",
        url: "https://trello.com/b/board1/project-alpha",
      });
      expect(result[1]).toEqual({
        id: "board2",
        name: "Personal Tasks",
        desc: "",
        url: "https://trello.com/b/board2/personal-tasks",
      });
    });

    it("handles empty board list", () => {
      const result = instance.toData([]);
      expect(result).toEqual([]);
    });

    it("strips organization and membership data", () => {
      const rawData = [
        {
          id: "b1",
          name: "Board",
          desc: "Test",
          url: "https://...",
          idOrganization: "org123",
          memberships: [{ id: "m1" }],
          prefs: { background: "blue" },
        },
      ];

      const result = instance.toData(rawData);

      expect(result[0]).not.toHaveProperty("idOrganization");
      expect(result[0]).not.toHaveProperty("memberships");
      expect(result[0]).not.toHaveProperty("prefs");
    });
  });

  describe("format (Test #24)", () => {
    it("displays boards as 'name (ID: id)' per line", async () => {
      const data = [
        { id: "board1", name: "Project Alpha" },
        { id: "board2", name: "Personal Tasks" },
      ];

      const result = await instance.format(data);

      expect(result).toBe("Project Alpha (ID: board1)\nPersonal Tasks (ID: board2)");
    });

    it("handles single board", async () => {
      const data = [{ id: "only", name: "Only Board" }];
      const result = await instance.format(data);
      expect(result).toBe("Only Board (ID: only)");
    });

    it("handles empty board list", async () => {
      const data: any[] = [];
      const result = await instance.format(data);
      expect(result).toBe("");
    });

    it("preserves board names with special characters", async () => {
      const data = [
        { id: "b1", name: "Q4 2025 - Planning & Review" },
        { id: "b2", name: "Bug Fixes (Critical)" },
      ];

      const result = await instance.format(data);

      expect(result).toContain("Q4 2025 - Planning & Review");
      expect(result).toContain("Bug Fixes (Critical)");
    });

    it("handles unicode in board names", async () => {
      const data = [{ id: "b1", name: "Roadmap" }];
      const result = await instance.format(data);
      expect(result).toContain("Roadmap");
    });
  });
});
