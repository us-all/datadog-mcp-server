/**
 * Smoke test — validates core read-only tools against a live Datadog account.
 * Requires DD_API_KEY, DD_APP_KEY, DD_SITE env vars (or .env file).
 *
 * Usage:
 *   pnpm run smoke
 *
 * Imports from compiled dist/. Run `pnpm run build` first.
 */

import dotenv from "dotenv";
dotenv.config();

// Trigger client init (will validate config)
import "../dist/client.js";

import { queryMetrics } from "../dist/tools/metrics.js";
import { searchLogs } from "../dist/tools/logs.js";
import { getMonitors } from "../dist/tools/monitors.js";
import { searchRumEvents } from "../dist/tools/rum.js";
import { getIncidents } from "../dist/tools/incidents.js";
import { validateConfig } from "../dist/config.js";

const results = [];

async function run(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    results.push({ name, ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${name}: ${message}`);
    results.push({ name, ok: false, error: message });
  }
}

async function main() {
  console.log("Smoke test — Datadog MCP Server\n");

  try {
    validateConfig();
  } catch (err) {
    console.error("Configuration error:", err.message);
    console.error("Set DD_API_KEY and DD_APP_KEY in .env or environment.");
    process.exit(1);
  }

  const now = Math.floor(Date.now() / 1000);
  const fiveMinAgo = now - 300;
  const nowIso = new Date().toISOString();
  const fiveMinAgoIso = new Date(fiveMinAgo * 1000).toISOString();

  await run("query-metrics", () =>
    queryMetrics({
      query: "avg:system.cpu.user{*}",
      from: fiveMinAgo,
      to: now,
    })
  );

  await run("search-logs", () =>
    searchLogs({
      query: "*",
      from: fiveMinAgoIso,
      to: nowIso,
      limit: 1,
      sort: "-timestamp",
    })
  );

  await run("get-monitors", () =>
    getMonitors({
      pageSize: 5,
      page: 0,
    })
  );

  await run("search-rum-events", () =>
    searchRumEvents({
      query: "*",
      from: fiveMinAgoIso,
      to: nowIso,
      limit: 1,
      sort: "-timestamp",
    })
  );

  await run("get-incidents", () =>
    getIncidents({
      pageSize: 5,
      pageOffset: 0,
    })
  );

  console.log("");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
