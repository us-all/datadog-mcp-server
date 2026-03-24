import { describe, it, expect, vi } from "vitest";
import { wrapToolHandler, WriteBlockedError, assertWriteAllowed } from "../../src/tools/utils.js";

describe("wrapToolHandler", () => {
  it("wraps successful result into MCP content format", async () => {
    const handler = wrapToolHandler(async () => ({ count: 1, items: ["a"] }));
    const result = await handler({} as any);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(1);
  });

  it("catches WriteBlockedError and returns isError", async () => {
    const handler = wrapToolHandler(async () => {
      throw new WriteBlockedError();
    });
    const result = await handler({} as any);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Write operations are disabled");
  });

  it("catches generic Error and returns sanitized structure", async () => {
    const handler = wrapToolHandler(async () => {
      throw new Error("something failed");
    });
    const result = await handler({} as any);
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toBe("something failed");
  });

  it("extracts Datadog SDK ApiException fields", async () => {
    const handler = wrapToolHandler(async () => {
      const err: any = new Error("HTTP error");
      err.code = 403;
      err.body = JSON.stringify({ errors: ["Forbidden"] });
      throw err;
    });
    const result = await handler({} as any);
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe(403);
    expect(parsed.datadogError).toEqual(["Forbidden"]);
  });

  it("sanitizes sensitive patterns from error messages", async () => {
    const handler = wrapToolHandler(async () => {
      throw new Error("Failed with DD_API_KEY=abc123");
    });
    const result = await handler({} as any);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).not.toContain("DD_API_KEY");
    expect(parsed.message).toContain("[REDACTED]");
  });
});

describe("assertWriteAllowed", () => {
  it("throws WriteBlockedError when allowWrite is false", () => {
    expect(() => assertWriteAllowed()).toThrow(WriteBlockedError);
  });
});

describe("WriteBlockedError", () => {
  it("has correct name and message", () => {
    const err = new WriteBlockedError();
    expect(err.name).toBe("WriteBlockedError");
    expect(err.message).toContain("Write operations are disabled");
  });
});
