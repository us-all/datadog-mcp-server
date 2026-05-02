import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// MCP Prompts: pre-built workflow templates that clients can invoke. Each
// returns a user-facing instruction the LLM should follow, leveraging the
// already-registered Datadog tools.

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "triage-incident",
    {
      title: "Triage a Datadog incident",
      description: "Pull an incident, correlate events / monitor state changes / log spikes in a window, and produce a triage summary.",
      argsSchema: {
        incidentId: z.string().describe("Datadog incident ID to triage"),
        lookbackMinutes: z.string().optional().describe("Look back this many minutes for related signals (default: 60)"),
      },
    },
    ({ incidentId, lookbackMinutes }) => {
      const window = lookbackMinutes ?? "60";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `Triage Datadog incident ${incidentId} using the last ${window} minutes of related signals.`,
              "",
              "Steps:",
              `1. Call \`get-incident\` with incidentId=${JSON.stringify(incidentId)}. Capture title, severity, customer impact, created timestamp, fields/tags, and any commander info.`,
              `2. Compute the window: from = (incident created_ts) - ${window}min, to = now (or incident resolved_ts if set).`,
              `3. Call \`get-events\` over that window with sources/tags from the incident (e.g. service, env) to surface deploys, alerts, and config changes.`,
              `4. Call \`search-incidents\` with a query targeting the same service/team to detect similar recent incidents (possible repeat / regression).`,
              `5. For monitors referenced by the incident (or matching its tags), call \`analyze-monitor-state\` to get current state + recent triggers + active downtimes in one shot.`,
              `6. Call \`aggregate-logs\` with a query like \`status:error service:<incident-service>\` grouped by 5-minute buckets to detect a log spike inside the window.`,
              "7. Produce a triage summary with: severity assessment, blast radius (services / users / regions), suspected root cause (deploy? config? upstream?), supporting evidence (event IDs, monitor IDs, log spike timestamps), and one recommended next action.",
            ].join("\n"),
          },
        }],
      };
    },
  );

  server.registerPrompt(
    "audit-monitor-noise",
    {
      title: "Audit noisy monitors",
      description: "Find the top N noisiest monitors by flap rate and recommend which to mute or tune.",
      argsSchema: {
        tagFilter: z.string().optional().describe("Optional tag filter for get-monitors, e.g. 'team:platform' or 'env:prod'"),
        topN: z.string().optional().describe("How many noisy monitors to return (default: 10)"),
      },
    },
    ({ tagFilter, topN }) => {
      const n = topN ?? "10";
      const tagPart = tagFilter ? ` filtered to tag '${tagFilter}'` : "";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `Audit Datadog monitor noise${tagPart} and rank the top ${n} noisiest by flap rate.`,
              "",
              "Steps:",
              `1. Call \`get-monitors\`${tagFilter ? ` with monitorTags=${JSON.stringify(tagFilter)}` : " (no filters)"} to enumerate the candidate set. Capture id, name, type, query, current overall_state, and tags.`,
              `2. For each monitor, call \`analyze-monitor-state\` (incidentMinutes=1440 = 24h window) to get current state + recent triggered events + active downtimes in one call.`,
              `3. Compute flap rate per monitor: count of state oscillations (Alert↔OK or Warn↔OK transitions) in the recent events, divided by the window length in hours. Higher = noisier.`,
              `4. Sort by flap rate descending and take the top ${n}. Tie-break by total trigger count.`,
              "5. For each, output: monitor id, name, flap rate (per hour), trigger count in window, currently muted? (active downtime), suggested action — one of: `mute-monitor` (tag-based silence), tighten threshold, add `recovery_window`, or split into multi-condition. Cite the recent triggers as evidence.",
              "6. End with a one-paragraph recommendation: what fraction of the audited surface is noisy, and which 2-3 monitors deserve immediate attention.",
            ].join("\n"),
          },
        }],
      };
    },
  );

  server.registerPrompt(
    "analyze-rum-error-spike",
    {
      title: "Analyze a RUM error spike",
      description: "Confirm a RUM error spike, group by error message and view, and report top patterns + impacted users.",
      argsSchema: {
        applicationId: z.string().describe("RUM application ID to investigate"),
        sinceMinutes: z.string().optional().describe("Look back this many minutes (default: 30)"),
      },
    },
    ({ applicationId, sinceMinutes }) => {
      const window = sinceMinutes ?? "30";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `Investigate a RUM error spike in application ${applicationId} over the last ${window} minutes.`,
              "",
              "Steps:",
              `1. Call \`aggregate-rum\` with query=\`@type:error @application.id:${applicationId}\`, time window of ${window} minutes, compute=count, groupBy=[\`@error.message\`] (or 5-minute time buckets) to confirm and shape the spike. Compare to the previous ${window} minutes for baseline.`,
              `2. If a spike is confirmed, call \`search-rum-events\` with the same query, sorted by timestamp descending, limit ~100, to retrieve representative error events.`,
              `3. Group the returned events client-side by (\`@error.message\`, \`@view.name\`). For each top group, capture count, distinct \`@session.id\` (impacted users proxy), browser/OS spread, and first/last seen.`,
              `4. Identify the top 3-5 error patterns. For each, include: error message, primary view, impacted user count, sample stack trace if present, and one hypothesis (regression vs. third-party vs. data-driven).`,
              "5. Produce a markdown report: spike confirmation chart description, top patterns table, and a prioritized list of which patterns to escalate (highest user impact first).",
            ].join("\n"),
          },
        }],
      };
    },
  );

  server.registerPrompt(
    "investigate-slow-trace",
    {
      title: "Investigate slow traces for a service",
      description: "Find the slowest spans for a service and break down where the time is spent.",
      argsSchema: {
        serviceName: z.string().describe("APM service name to investigate"),
        latencyP99Threshold: z.string().optional().describe("Duration threshold in ms — only consider spans slower than this (default: 1000)"),
      },
    },
    ({ serviceName, latencyP99Threshold }) => {
      const thresholdMs = latencyP99Threshold ?? "1000";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `Investigate slow traces for service '${serviceName}' (spans slower than ${thresholdMs}ms).`,
              "",
              "Steps:",
              `1. Call \`search-spans\` with query=\`service:${serviceName} @duration:>${thresholdMs}ms\`, sort by duration descending, limit ~50. Use a time window of the last hour by default.`,
              `2. Pick the top 3-5 trace_ids by total duration. For each, list the span breakdown: resource name, operation name, duration, span.kind (server/client/db), and key tags (sql.query, http.url, peer.service).`,
              `3. Aggregate time spent by category across the sample: DB time (spans where \`db.system\` is set), network/HTTP-client time (\`span.kind:client\` http calls), and self/compute time (parent duration minus child sum).`,
              `4. Identify hot spots — the resource(s) contributing the most p99 latency. Note repeat patterns (N+1 query, sync fan-out, single slow downstream service).`,
              "5. Produce a report with: top slow trace_ids + Datadog APM links, the latency breakdown table (DB / network / compute), top 3 hot-spot resources, and a recommended fix per hot spot (add index, batch, cache, parallelize, etc.).",
            ].join("\n"),
          },
        }],
      };
    },
  );
}
