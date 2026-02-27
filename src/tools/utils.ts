import { config } from "../config.js";

const SENSITIVE_PATTERNS = [
  /DD_API_KEY/i,
  /DD_APP_KEY/i,
  /api[_-]?key/i,
  /app[_-]?key/i,
  /authorization/i,
  /bearer\s+\S+/i,
];

function sanitize(text: string): string {
  let result = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNumericProp(obj: object, key: string): obj is Record<string, unknown> & Record<typeof key, number> {
  return key in obj && typeof (obj as Record<string, unknown>)[key] === "number";
}

function hasStringProp(obj: object, key: string): obj is Record<string, unknown> & Record<typeof key, string> {
  return key in obj && typeof (obj as Record<string, unknown>)[key] === "string";
}

function hasProp(obj: object, key: string): boolean {
  return key in obj && (obj as Record<string, unknown>)[key] != null;
}

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

function extractDatadogError(body: unknown): unknown {
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    if (isRecord(parsed)) {
      if (parsed.errors != null) return parsed.errors;
      if (typeof parsed.message === "string") return parsed.message;
    }
    const str = typeof body === "string" ? body : JSON.stringify(body);
    return sanitize(str);
  } catch {
    return sanitize(String(body));
  }
}

export function wrapToolHandler<T>(fn: (params: T) => Promise<unknown>) {
  return async (params: T) => {
    try {
      const result = await fn(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof WriteBlockedError) {
        return {
          content: [{ type: "text" as const, text: error.message }],
          isError: true,
        };
      }

      const structured: Record<string, unknown> = {
        message: "Unknown error",
      };

      if (error instanceof Error) {
        structured.message = sanitize(error.message);

        // Datadog SDK ApiException exposes .code (HTTP status) and .body
        if (hasNumericProp(error, "code")) {
          structured.status = error.code;
        }
        if (hasProp(error, "body")) {
          structured.datadogError = extractDatadogError((error as unknown as Record<string, unknown>).body);
        }
        if (hasStringProp(error, "requestId")) {
          structured.requestId = error.requestId;
        }
      } else {
        structured.message = sanitize(String(error));
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
        isError: true,
      };
    }
  };
}
