import { z } from "zod/v4";
import { eventsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

export const getEventsSchema = z.object({
  start: z.number().describe("Start time as Unix epoch seconds. Example: 1740000000"),
  end: z.number().describe("End time as Unix epoch seconds. Example: 1740003600"),
  priority: z.enum(["low", "normal"]).optional().describe("Event priority filter"),
  sources: z.string().optional().describe("Comma-separated event sources. Example: datadog,nginx"),
  tags: z.string().optional().describe("Comma-separated tags to filter. Example: env:prod,service:api"),
  unaggregated: z.boolean().optional().describe("Return unaggregated events"),
  page: z.number().optional().describe("Page number for pagination"),
});

export async function getEvents(params: z.infer<typeof getEventsSchema>) {
  const response = await eventsApi.listEvents({
    start: params.start,
    end: params.end,
    priority: params.priority as any,
    sources: params.sources,
    tags: params.tags,
    unaggregated: params.unaggregated,
    page: params.page,
  });

  const events = response.events ?? [];
  return {
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      text: e.text,
      dateHappened: e.dateHappened ? new Date(e.dateHappened * 1000).toISOString() : undefined,
      host: e.host,
      priority: e.priority,
      source: (e as any).source,
      tags: e.tags,
      alertType: e.alertType,
    })),
  };
}

export const postEventSchema = z.object({
  title: z.string().describe("Event title. Example: Deployment completed"),
  text: z.string().describe("Event body (supports markdown, max 4000 chars). Example: Deployed v1.2.3 to production"),
  tags: z.array(z.string()).optional().describe("Tags for the event. Example: [\"env:prod\", \"deploy\"]"),
  alertType: z.enum(["error", "warning", "info", "success"]).optional().describe("Alert type"),
  priority: z.enum(["low", "normal"]).optional().describe("Event priority"),
  host: z.string().optional().describe("Associated host name"),
  aggregationKey: z.string().optional().describe("Aggregation key for grouping events"),
  sourceTypeName: z.string().optional().describe("Source type name. Example: my_app"),
});

export async function postEvent(params: z.infer<typeof postEventSchema>) {
  assertWriteAllowed();
  const response = await eventsApi.createEvent({
    body: {
      title: params.title,
      text: params.text,
      tags: params.tags,
      alertType: params.alertType as any,
      priority: params.priority as any,
      host: params.host,
      aggregationKey: params.aggregationKey,
      sourceTypeName: params.sourceTypeName,
    },
  });

  return {
    id: response.event?.id,
    title: response.event?.title,
    url: response.event?.url,
    status: response.status,
  };
}
