import { createWrapToolHandler } from "@us-all/mcp-toolkit";
import { config } from "../config.js";

export class WriteBlockedError extends Error {
  constructor() {
    super("Write operations are disabled. Set DD_ALLOW_WRITE=true to enable.");
    this.name = "WriteBlockedError";
  }
}

export function assertWriteAllowed(): void {
  if (!config.allowWrite) {
    throw new WriteBlockedError();
  }
}

export function extractDatadogError(body: unknown): unknown {
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const rec = parsed as Record<string, unknown>;
      if (rec.errors != null) return rec.errors;
      if (typeof rec.message === "string") return rec.message;
    }
    return typeof body === "string" ? body : JSON.stringify(body);
  } catch {
    return String(body);
  }
}

export const wrapToolHandler = createWrapToolHandler({
  redactionPatterns: [/DD_API_KEY/i, /DD_APP_KEY/i],
  errorExtractors: [
    {
      match: (error) => error instanceof WriteBlockedError,
      extract: (error) => ({ kind: "passthrough", text: (error as Error).message }),
    },
    {
      match: (error) => {
        if (!(error instanceof Error)) return false;
        const rec = error as unknown as Record<string, unknown>;
        return (
          typeof rec.code === "number" ||
          typeof rec.body === "string" ||
          typeof rec.requestId === "string"
        );
      },
      extract: (error) => {
        const err = error as Error & Record<string, unknown>;
        const data: Record<string, unknown> & { message: string } = {
          message: err.message,
        };
        if (typeof err.code === "number") {
          data.status = err.code;
        }
        if (err.body != null) {
          data.datadogError = extractDatadogError(err.body);
        }
        if (typeof err.requestId === "string") {
          data.requestId = err.requestId;
        }
        return { kind: "structured", data };
      },
    },
  ],
});
