import { z } from "zod/v4";
import { downtimesApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

export const listDowntimesSchema = z.object({
  currentOnly: z.boolean().optional().describe("Return only currently active downtimes"),
  include: z.string().optional().describe("Comma-separated related resources to include. Example: created_by,monitor"),
  pageLimit: z.coerce.number().optional().default(50).describe("Max results per page (default 50)"),
  pageOffset: z.coerce.number().optional().default(0).describe("Pagination offset"),
});

export async function listDowntimes(params: z.infer<typeof listDowntimesSchema>) {
  const response = await downtimesApi.listDowntimes({
    currentOnly: params.currentOnly,
    include: params.include,
    pageLimit: params.pageLimit,
    pageOffset: params.pageOffset,
  });

  const downtimes = response.data ?? [];
  return {
    count: downtimes.length,
    downtimes: downtimes.map((d) => ({
      id: d.id,
      type: d.type,
      displayTimezone: d.attributes?.displayTimezone,
      message: d.attributes?.message,
      muteFirstRecoveryNotification: d.attributes?.muteFirstRecoveryNotification,
      scope: d.attributes?.scope,
      status: d.attributes?.status,
      schedule: d.attributes?.schedule,
      canceled: d.attributes?.canceled?.toISOString(),
      created: d.attributes?.created?.toISOString(),
      modified: d.attributes?.modified?.toISOString(),
      monitorIdentifier: d.attributes?.monitorIdentifier,
    })),
  };
}

export const createDowntimeSchema = z.object({
  scope: z.string().describe("Downtime scope. Example: env:prod or host:web-01 or * (all)"),
  start: z.coerce.number().describe("Start time as Unix epoch seconds. Example: 1740000000"),
  end: z.coerce.number().optional().describe("End time as Unix epoch seconds (omit for indefinite). Example: 1740003600"),
  message: z.string().optional().describe("Notification message. Example: Scheduled maintenance window"),
  monitorId: z.coerce.number().optional().describe("Specific monitor ID to mute. Example: 12345678"),
  monitorTags: z.array(z.string()).optional().describe("Mute monitors matching these tags. Example: [\"service:api\"]"),
  timezone: z.string().optional().default("UTC").describe("IANA timezone. Example: UTC or America/New_York"),
  notifyEndStates: z.array(z.string()).optional().describe("States to notify on end. Example: [\"alert\", \"warn\"]"),
});

export async function createDowntime(params: z.infer<typeof createDowntimeSchema>) {
  assertWriteAllowed();
  let monitorIdentifier: any;
  if (params.monitorId) {
    monitorIdentifier = { monitorId: params.monitorId };
  } else if (params.monitorTags && params.monitorTags.length > 0) {
    monitorIdentifier = { monitorTags: params.monitorTags };
  } else {
    monitorIdentifier = { monitorTags: ["*"] };
  }

  const response = await downtimesApi.createDowntime({
    body: {
      data: {
        attributes: {
          scope: params.scope,
          monitorIdentifier,
          schedule: {
            start: new Date(params.start * 1000).toISOString(),
            ...(params.end ? { end: new Date(params.end * 1000).toISOString() } : {}),
          } as any,
          message: params.message,
          displayTimezone: params.timezone,
          ...(params.notifyEndStates ? { notifyEndStates: params.notifyEndStates as any } : {}),
        },
        type: "downtime",
      },
    },
  });

  return {
    id: response.data?.id,
    type: response.data?.type,
    scope: response.data?.attributes?.scope,
    status: response.data?.attributes?.status,
    schedule: response.data?.attributes?.schedule,
    message: response.data?.attributes?.message,
    created: response.data?.attributes?.created?.toISOString(),
  };
}

export const cancelDowntimeSchema = z.object({
  downtimeId: z.string().describe("Downtime ID to cancel. Example: abc123def456"),
});

export async function cancelDowntime(params: z.infer<typeof cancelDowntimeSchema>) {
  assertWriteAllowed();
  await downtimesApi.cancelDowntime({
    downtimeId: params.downtimeId,
  });

  return { success: true, downtimeId: params.downtimeId };
}
