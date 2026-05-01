import { ToolRegistry, createSearchToolsMetaTool } from "@us-all/mcp-toolkit";
import { config } from "./config.js";

export const CATEGORIES = [
  "metrics",
  "monitors",
  "dashboards",
  "logs",
  "apm",
  "rum",
  "incidents",
  "security",
  "synthetics",
  "ci",
  "infra",
  "fleet",
  "status-pages",
  "oncall",
  "teams",
  "account",
  "meta",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const registry = new ToolRegistry<Category>({
  enabledCategories: config.enabledCategories,
  disabledCategories: config.disabledCategories,
});

const meta = createSearchToolsMetaTool(registry, CATEGORIES,
  "Discover tools across the 158-tool Datadog MCP surface — call this first to find the right tool.");

export const searchToolsSchema = meta.schema;
export const searchTools = meta.handler;
