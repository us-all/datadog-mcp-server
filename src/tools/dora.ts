import { z } from "zod/v4";
import { doraMetricsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

export const sendDoraDeploymentSchema = z.object({
  service: z.string().describe("Service name for the deployment. Example: my-api-service"),
  version: z.string().optional().describe("Version or git SHA of the deployment. Example: v1.2.3 or abc123"),
  environment: z.string().optional().describe("Environment name. Example: production, staging"),
  startedAt: z.number().describe("Unix timestamp (seconds) when deployment started"),
  finishedAt: z.number().describe("Unix timestamp (seconds) when deployment finished"),
});

export async function sendDoraDeployment(params: z.infer<typeof sendDoraDeploymentSchema>) {
  assertWriteAllowed();

  const response = await doraMetricsApi.createDORADeployment({
    body: {
      data: {
        attributes: {
          service: params.service,
          version: params.version,
          env: params.environment,
          startedAt: params.startedAt,
          finishedAt: params.finishedAt,
        },
      },
    },
  });

  return {
    id: response.data?.id,
    type: response.data?.type,
  };
}

export const sendDoraIncidentSchema = z.object({
  service: z.string().describe("Service name affected by the incident. Example: my-api-service"),
  name: z.string().optional().describe("Incident name or title"),
  severity: z.string().optional().describe("Incident severity. Example: SEV-1, SEV-2"),
  environment: z.string().optional().describe("Environment name. Example: production"),
  startedAt: z.number().describe("Unix timestamp (seconds) when incident started"),
  finishedAt: z.number().optional().describe("Unix timestamp (seconds) when incident was resolved"),
  version: z.string().optional().describe("Version that caused the incident"),
});

export async function sendDoraIncident(params: z.infer<typeof sendDoraIncidentSchema>) {
  assertWriteAllowed();

  const response = await doraMetricsApi.createDORAIncident({
    body: {
      data: {
        attributes: {
          services: [params.service],
          name: params.name,
          severity: params.severity,
          env: params.environment,
          startedAt: params.startedAt,
          finishedAt: params.finishedAt,
          version: params.version,
        },
      },
    },
  });

  return {
    id: response.data?.id,
    type: response.data?.type,
  };
}
