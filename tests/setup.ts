// Set env vars before any module loads (config.ts reads at import time)
process.env.DD_API_KEY = "test-api-key";
process.env.DD_APP_KEY = "test-app-key";
process.env.DD_SITE = "us5.datadoghq.com";
