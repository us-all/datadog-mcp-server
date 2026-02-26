import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.DD_API_KEY ?? "",
  appKey: process.env.DD_APP_KEY ?? "",
  site: process.env.DD_SITE ?? "us5.datadoghq.com",
};

export function validateConfig(): void {
  if (!config.apiKey) {
    throw new Error("DD_API_KEY environment variable is required");
  }
  if (!config.appKey) {
    throw new Error("DD_APP_KEY environment variable is required");
  }
}
