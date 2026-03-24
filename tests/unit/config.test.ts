import { describe, it, expect, vi, beforeEach } from "vitest";

describe("config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("validateConfig throws when DD_API_KEY is missing", async () => {
    process.env.DD_API_KEY = "";
    process.env.DD_APP_KEY = "test";
    const { validateConfig } = await import("../../src/config.js");
    expect(() => validateConfig()).toThrow("DD_API_KEY");
    process.env.DD_API_KEY = "test-api-key";
  });

  it("validateConfig throws when DD_APP_KEY is missing", async () => {
    process.env.DD_API_KEY = "test";
    process.env.DD_APP_KEY = "";
    const { validateConfig } = await import("../../src/config.js");
    expect(() => validateConfig()).toThrow("DD_APP_KEY");
    process.env.DD_APP_KEY = "test-app-key";
  });

  it("config.site defaults to us5.datadoghq.com", async () => {
    delete process.env.DD_SITE;
    const { config } = await import("../../src/config.js");
    expect(config.site).toBe("us5.datadoghq.com");
    process.env.DD_SITE = "us5.datadoghq.com";
  });

  it("config.allowWrite is true only when DD_ALLOW_WRITE=true", async () => {
    process.env.DD_ALLOW_WRITE = "false";
    const mod1 = await import("../../src/config.js");
    expect(mod1.config.allowWrite).toBe(false);

    vi.resetModules();
    process.env.DD_ALLOW_WRITE = "true";
    const mod2 = await import("../../src/config.js");
    expect(mod2.config.allowWrite).toBe(true);
    delete process.env.DD_ALLOW_WRITE;
  });
});
