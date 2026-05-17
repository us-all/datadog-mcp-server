import { z } from "zod/v4";
import { workflowAutomationApi } from "../client.js";

// The Datadog SDK's typed models for Workflow Automation only expose `id` /
// `attributes` fields with most rich data captured under `additionalProperties`
// (untyped pass-through). We surface both so callers see the full payload.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(data: any): any {
  if (data == null) return data;
  const out: Record<string, unknown> = {};
  if (data.id != null) out.id = data.id;
  if (data.type != null) out.type = data.type;
  if (data.attributes != null) {
    const attrs = { ...data.attributes };
    const extra = (data.attributes as { additionalProperties?: Record<string, unknown> })
      .additionalProperties;
    if (extra) Object.assign(attrs, extra);
    delete (attrs as Record<string, unknown>).additionalProperties;
    out.attributes = attrs;
  }
  const extraTop = (data as { additionalProperties?: Record<string, unknown> })
    .additionalProperties;
  if (extraTop) Object.assign(out, extraTop);
  return out;
}

// ============================================================
// get-workflow — fetch a workflow definition by ID
// ============================================================

export const getWorkflowSchema = z.object({
  workflowId: z
    .string()
    .describe(
      "Workflow UUID. Find it in the Datadog UI at /workflow/<UUID>. Example: 12345678-1234-1234-1234-123456789abc",
    ),
});

export async function getWorkflow(params: z.infer<typeof getWorkflowSchema>) {
  const response = await workflowAutomationApi.getWorkflow({
    workflowId: params.workflowId,
  });
  return { data: unwrap(response.data) };
}

// ============================================================
// list-workflow-instances — list run instances for a workflow
// ============================================================

export const listWorkflowInstancesSchema = z.object({
  workflowId: z.string().describe("Workflow UUID whose runs to list"),
  pageSize: z.coerce
    .number()
    .optional()
    .default(20)
    .describe("Results per page (default 20, max 100)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
});

export async function listWorkflowInstances(
  params: z.infer<typeof listWorkflowInstancesSchema>,
) {
  const response = await workflowAutomationApi.listWorkflowInstances({
    workflowId: params.workflowId,
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
  });
  const items = response.data ?? [];
  return {
    count: items.length,
    instances: items.map(unwrap),
    meta: response.meta,
  };
}

// ============================================================
// get-workflow-instance — full run details for a single instance
// (this is what surfaces step-by-step input/error state)
// ============================================================

export const getWorkflowInstanceSchema = z.object({
  workflowId: z.string().describe("Workflow UUID"),
  instanceId: z.string().describe("Workflow instance (run) ID"),
});

export async function getWorkflowInstance(
  params: z.infer<typeof getWorkflowInstanceSchema>,
) {
  const response = await workflowAutomationApi.getWorkflowInstance({
    workflowId: params.workflowId,
    instanceId: params.instanceId,
  });
  return { data: unwrap(response.data) };
}
