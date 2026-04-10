import { z } from "zod/v4";
import { v1 } from "@datadog/datadog-api-client";
import { sloCorrectionsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- List SLO Corrections ---

export const listSloCorrectionsSchema = z.object({
  offset: z.coerce.number().optional().describe("Pagination offset"),
  limit: z.coerce.number().optional().describe("Number of results per page"),
});

export async function listSloCorrections(params: z.infer<typeof listSloCorrectionsSchema>) {
  const response = await sloCorrectionsApi.listSLOCorrection({
    ...(params.offset !== undefined ? { offset: params.offset } : {}),
    ...(params.limit !== undefined ? { limit: params.limit } : {}),
  });

  const corrections = response.data ?? [];
  return {
    count: corrections.length,
    corrections: corrections.map(formatCorrection),
  };
}

// --- Get SLO Correction ---

export const getSloCorrectionsSchema = z.object({
  sloCorrectionId: z.string().describe("The SLO correction ID"),
});

export async function getSloCorrection(params: z.infer<typeof getSloCorrectionsSchema>) {
  const response = await sloCorrectionsApi.getSLOCorrection({
    sloCorrectionId: params.sloCorrectionId,
  });

  return formatCorrection(response.data!);
}

// --- Create SLO Correction ---

export const createSloCorrectionSchema = z.object({
  sloId: z.string().describe("The SLO ID to apply the correction to"),
  category: z.enum(["Scheduled Maintenance", "Outside Business Hours", "Deployment", "Other"])
    .describe("Category of the correction"),
  start: z.string().describe("ISO 8601 start time of the correction period"),
  end: z.string().optional().describe("ISO 8601 end time. Required if duration is not provided"),
  duration: z.coerce.number().optional().describe("Duration in seconds. Required if end is not provided"),
  description: z.string().optional().describe("Description of the correction"),
  timezone: z.string().optional().describe("Timezone for display (defaults to UTC). Example: Asia/Seoul"),
  rrule: z.string().optional().describe("Recurrence rule (RFC 5545 RRULE). Example: FREQ=WEEKLY;INTERVAL=1;BYDAY=SA,SU"),
});

export async function createSloCorrection(params: z.infer<typeof createSloCorrectionSchema>) {
  assertWriteAllowed();

  const attributes = new v1.SLOCorrectionCreateRequestAttributes();
  attributes.sloId = params.sloId;
  attributes.category = params.category as v1.SLOCorrectionCategory;
  attributes.start = Math.floor(new Date(params.start).getTime() / 1000);
  if (params.end) attributes.end = Math.floor(new Date(params.end).getTime() / 1000);
  if (params.duration !== undefined) attributes.duration = params.duration;
  if (params.description) attributes.description = params.description;
  if (params.timezone) attributes.timezone = params.timezone;
  if (params.rrule) attributes.rrule = params.rrule;

  const data = new v1.SLOCorrectionCreateData();
  data.type = "correction" as v1.SLOCorrectionType;
  data.attributes = attributes;

  const body = new v1.SLOCorrectionCreateRequest();
  body.data = data;

  const response = await sloCorrectionsApi.createSLOCorrection({ body });
  return formatCorrection(response.data!);
}

// --- Update SLO Correction ---

export const updateSloCorrectionSchema = z.object({
  sloCorrectionId: z.string().describe("The SLO correction ID to update"),
  category: z.enum(["Scheduled Maintenance", "Outside Business Hours", "Deployment", "Other"]).optional()
    .describe("Updated category"),
  start: z.string().optional().describe("Updated ISO 8601 start time"),
  end: z.string().optional().describe("Updated ISO 8601 end time"),
  duration: z.coerce.number().optional().describe("Updated duration in seconds"),
  description: z.string().optional().describe("Updated description"),
  timezone: z.string().optional().describe("Updated timezone"),
  rrule: z.string().optional().describe("Updated recurrence rule"),
});

export async function updateSloCorrection(params: z.infer<typeof updateSloCorrectionSchema>) {
  assertWriteAllowed();

  const attributes = new v1.SLOCorrectionUpdateRequestAttributes();
  if (params.category) attributes.category = params.category as v1.SLOCorrectionCategory;
  if (params.start) attributes.start = Math.floor(new Date(params.start).getTime() / 1000);
  if (params.end) attributes.end = Math.floor(new Date(params.end).getTime() / 1000);
  if (params.duration !== undefined) attributes.duration = params.duration;
  if (params.description) attributes.description = params.description;
  if (params.timezone) attributes.timezone = params.timezone;
  if (params.rrule) attributes.rrule = params.rrule;

  const data = new v1.SLOCorrectionUpdateData();
  data.type = "correction" as v1.SLOCorrectionType;
  data.attributes = attributes;

  const body = new v1.SLOCorrectionUpdateRequest();
  body.data = data;

  const response = await sloCorrectionsApi.updateSLOCorrection({
    sloCorrectionId: params.sloCorrectionId,
    body,
  });
  return formatCorrection(response.data!);
}

// --- Delete SLO Correction ---

export const deleteSloCorrectionSchema = z.object({
  sloCorrectionId: z.string().describe("The SLO correction ID to delete"),
});

export async function deleteSloCorrection(params: z.infer<typeof deleteSloCorrectionSchema>) {
  assertWriteAllowed();
  await sloCorrectionsApi.deleteSLOCorrection({
    sloCorrectionId: params.sloCorrectionId,
  });
  return { deleted: true, sloCorrectionId: params.sloCorrectionId };
}

// --- Helper ---

function formatCorrection(c: v1.SLOCorrection) {
  return {
    id: c.id,
    type: c.type,
    sloId: c.attributes?.sloId,
    category: c.attributes?.category,
    description: c.attributes?.description,
    start: c.attributes?.start,
    end: c.attributes?.end,
    duration: c.attributes?.duration,
    timezone: c.attributes?.timezone,
    rrule: c.attributes?.rrule,
    createdAt: c.attributes?.createdAt,
    modifiedAt: c.attributes?.modifiedAt,
    creator: c.attributes?.creator,
  };
}
