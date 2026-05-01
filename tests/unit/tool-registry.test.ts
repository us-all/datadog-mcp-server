import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/tool-registry.js";

describe("ToolRegistry", () => {
  let r: ToolRegistry;

  beforeEach(() => {
    r = new ToolRegistry();
    r.register("get-monitors", "List Datadog monitors", "monitors");
    r.register("get-monitor", "Get monitor details by ID", "monitors");
    r.register("create-monitor", "Create a new monitor", "monitors");
    r.register("query-metrics", "Query time-series metric data", "metrics");
    r.register("search-logs", "Search logs by query", "logs");
    r.register("aggregate-logs", "Aggregate logs", "logs");
    r.register("search-rum-events", "Search RUM events", "rum");
  });

  it("matches by tool name token", () => {
    const matches = r.search("monitor");
    expect(matches.map((m) => m.name)).toContain("get-monitors");
    expect(matches.map((m) => m.name)).toContain("create-monitor");
  });

  it("respects category filter", () => {
    const matches = r.search("search", "logs");
    expect(matches.map((m) => m.name)).toEqual(["search-logs"]);
  });

  it("ranks name matches higher than description matches", () => {
    const matches = r.search("monitor");
    expect(matches[0].name).toMatch(/monitor/);
  });

  it("returns empty for no match", () => {
    expect(r.search("nonexistent")).toEqual([]);
  });

  it("summary returns correct breakdown", () => {
    const s = r.summary();
    expect(s.total).toBe(7);
    expect(s.categoryBreakdown.monitors).toBe(3);
    expect(s.categoryBreakdown.logs).toBe(2);
  });
});
