import { z } from "zod/v4";
import { onCallApi } from "../client.js";

export const getTeamOnCallSchema = z.object({
  teamId: z.string().describe("The Datadog team ID. Example: abc123-def456-ghi789"),
  include: z.string().optional().describe("Comma-separated included relationships. Example: responders,escalations,escalations.responders"),
});

export async function getTeamOnCall(params: z.infer<typeof getTeamOnCallSchema>) {
  const response = await onCallApi.getTeamOnCallUsers({
    teamId: params.teamId,
    include: params.include,
  });

  return {
    data: response.data,
    included: response.included,
  };
}

export const getOnCallScheduleSchema = z.object({
  scheduleId: z.string().describe("The on-call schedule ID. Example: abc123-def456-ghi789"),
  include: z.string().optional().describe("Comma-separated included relationships. Example: teams,layers,layers.members,layers.members.user"),
});

export async function getOnCallSchedule(params: z.infer<typeof getOnCallScheduleSchema>) {
  const response = await onCallApi.getOnCallSchedule({
    scheduleId: params.scheduleId,
    include: params.include,
  });

  return {
    data: response.data,
    included: response.included,
  };
}
