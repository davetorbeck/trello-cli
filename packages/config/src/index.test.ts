import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";
import Config from ".";

describe("Config", () => {
  it("constructs with configDir and profile", () => {
    const config = new Config("/tmp/test", "default");
    expect(config).toBeDefined();
  });
});
