import dotenv from "dotenv";

dotenv.config();

function parseList(raw: string | undefined): string[] | null {
  if (!raw) return null;
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export const config = {
  apiKey: process.env.DD_API_KEY ?? "",
  appKey: process.env.DD_APP_KEY ?? "",
  site: process.env.DD_SITE ?? "us5.datadoghq.com",
  allowWrite: process.env.DD_ALLOW_WRITE === "true",
  enabledCategories: parseList(process.env.DD_TOOLS),
  disabledCategories: parseList(process.env.DD_DISABLE),
};

export function validateConfig(): void {
  if (!config.apiKey) {
    throw new Error("DD_API_KEY environment variable is required");
  }
  if (!config.appKey) {
    throw new Error("DD_APP_KEY environment variable is required");
  }
}
