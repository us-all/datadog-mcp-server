import { z } from "zod/v4";
import { downtimesApi } from "../client.js";

export const listDowntimesSchema = z.object({
  currentOnly: z.boolean().optional().describe("Return only currently active downtimes"),
  include: z.string().optional().describe("Comma-separated related resources to include (created_by, monitor)"),
  pageLimit: z.number().optional().default(50).describe("Max results per page"),
  pageOffset: z.number().optional().default(0).describe("Pagination offset"),
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
  scope: z.string().describe("Downtime scope (e.g., env:prod, host:myhost, *)"),
  start: z.number().describe("Start time as Unix epoch seconds"),
  end: z.number().optional().describe("End time as Unix epoch seconds (omit for indefinite)"),
  message: z.string().optional().describe("Notification message"),
  monitorId: z.number().optional().describe("Specific monitor ID to mute"),
  monitorTags: z.array(z.string()).optional().describe("Mute monitors matching these tags"),
  timezone: z.string().optional().default("UTC").describe("IANA timezone (default UTC)"),
  notifyEndStates: z.array(z.string()).optional().describe("States to notify on end: alert, warn, no data"),
});

export async function createDowntime(params: z.infer<typeof createDowntimeSchema>) {
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
  downtimeId: z.string().describe("Downtime ID to cancel"),
});

export async function cancelDowntime(params: z.infer<typeof cancelDowntimeSchema>) {
  await downtimesApi.cancelDowntime({
    downtimeId: params.downtimeId,
  });

  return { success: true, downtimeId: params.downtimeId };
}
