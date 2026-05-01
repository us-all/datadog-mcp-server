import { describe, it, expect } from "vitest";
import { applyExtractFields } from "../../src/tools/extract-fields.js";

describe("applyExtractFields", () => {
  it("returns data unchanged when expr is empty or undefined", () => {
    const data = { a: 1, b: 2 };
    expect(applyExtractFields(data, undefined)).toEqual(data);
    expect(applyExtractFields(data, "")).toEqual(data);
  });

  it("projects flat top-level fields", () => {
    const data = { id: "1", title: "CPU Usage", description: "long text" };
    expect(applyExtractFields(data, "id,title")).toEqual({ id: "1", title: "CPU Usage" });
  });

  it("projects nested dotted paths", () => {
    const data = {
      id: "1",
      author: { handle: "alice", email: "alice@example.com" },
    };
    expect(applyExtractFields(data, "id,author.handle")).toEqual({
      id: "1",
      author: { handle: "alice" },
    });
  });

  it("projects array-of-objects with wildcard", () => {
    const data = {
      title: "dashboard",
      widgets: [
        { id: 1, definition: { type: "timeseries", title: "x" } },
        { id: 2, definition: { type: "query_value", title: "y" } },
      ],
    };
    expect(applyExtractFields(data, "title,widgets.*.definition.type")).toEqual({
      title: "dashboard",
      widgets: [{ definition: { type: "timeseries" } }, { definition: { type: "query_value" } }],
    });
  });

  it("ignores missing keys", () => {
    expect(applyExtractFields({ id: "1" }, "id,nonexistent")).toEqual({ id: "1" });
  });
});
