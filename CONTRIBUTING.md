# Contributing to Datadog MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm

### Getting Started

```bash
git clone https://github.com/us-all/datadog-mcp-server.git
cd datadog-mcp-server
pnpm install
pnpm run build
```

### Development Workflow

```bash
pnpm run dev    # Watch mode — auto-rebuilds on changes
pnpm run build  # One-time build
pnpm run start  # Run the server
```

### Environment Variables

Create a `.env` file for local testing:

```bash
DD_API_KEY=<your-api-key>
DD_APP_KEY=<your-app-key>
DD_SITE=us5.datadoghq.com
```

## Adding a New Tool

Each tool follows a consistent pattern:

### 1. Define the schema and handler in `src/tools/<category>.ts`

```typescript
import { z } from "zod/v4";
import { someApi } from "../client.js";

export const myToolSchema = z.object({
  param: z.string().describe("Description for the AI model"),
});

export async function myTool(params: z.infer<typeof myToolSchema>) {
  const response = await someApi.someMethod({ ... });
  return { /* transformed response */ };
}
```

### 2. Add the API client to `src/client.ts` (if needed)

```typescript
export const newApi = new v2.NewApi(configuration);
```

### 3. Register the tool in `src/index.ts`

```typescript
import { myToolSchema, myTool } from "./tools/category.js";

server.tool(
  "my-tool",
  "Description of what this tool does",
  myToolSchema.shape,
  wrapToolHandler(myTool),
);
```

### Key Conventions

- Use `zod/v4` for input validation
- Use `.describe()` on every schema field (the AI model reads these)
- Use the official Datadog SDK client — avoid raw HTTP calls
- For v2 aggregate APIs, always use SDK model class instances (not plain objects)
- Return structured data; the `wrapToolHandler` handles JSON serialization and error wrapping

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-tool`)
3. Make your changes
4. Ensure `pnpm run build` succeeds
5. Submit a pull request

### PR Guidelines

- Keep changes focused — one feature or fix per PR
- Update README.md if adding new tools
- Follow existing code patterns and naming conventions
- Write clear commit messages

## Code Style

- TypeScript strict mode
- ESM modules (`.js` extensions in imports)
- Descriptive zod schemas with `.describe()` on every field
- Consistent naming: `camelCase` for functions, `kebab-case` for tool names

## Reporting Issues

- Use the [GitHub issue tracker](https://github.com/us-all/datadog-mcp-server/issues)
- Include steps to reproduce
- Include relevant error messages
- Specify your Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
