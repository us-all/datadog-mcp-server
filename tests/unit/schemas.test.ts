import { describe, it, expect } from "vitest";

// Use import.meta.glob for vite-compatible dynamic imports
const toolModules = import.meta.glob("../../src/tools/*.ts", { eager: true }) as Record<string, Record<string, unknown>>;

// Filter out utils.ts
const toolEntries = Object.entries(toolModules).filter(
  ([path]) => !path.endsWith("utils.ts"),
);

describe("tool schemas", () => {
  it("all Schema exports are valid zod objects", () => {
    expect(toolEntries.length).toBeGreaterThan(0);

    for (const [path, mod] of toolEntries) {
      const file = path.split("/").pop();
      const schemaExports = Object.entries(mod).filter(([key]) => key.endsWith("Schema"));
      expect(schemaExports.length, `${file} should export at least one Schema`).toBeGreaterThan(0);

      for (const [name, schema] of schemaExports) {
        expect(schema, `${file}:${name} should have .shape`).toHaveProperty("shape");
      }
    }
  });

  it("all schemas have descriptions on required fields", () => {
    const missingDescriptions: string[] = [];

    for (const [path, mod] of toolEntries) {
      const file = path.split("/").pop();
      const schemaExports = Object.entries(mod).filter(([key]) => key.endsWith("Schema"));

      for (const [schemaName, schema] of schemaExports) {
        const shape = (schema as any).shape;
        for (const [fieldName, fieldDef] of Object.entries(shape)) {
          let current = fieldDef as any;
          let found = !!current.description;
          while (!found && current.def?.innerType) {
            current = current.def.innerType;
            found = !!current.description;
          }
          if (!found) {
            missingDescriptions.push(`${file}:${schemaName}.${fieldName}`);
          }
        }
      }
    }

    expect(missingDescriptions, `Fields missing .describe(): ${missingDescriptions.join(", ")}`).toEqual([]);
  });

  it("representative schemas reject missing required fields", () => {
    // Find metrics module
    const metricsEntry = toolEntries.find(([p]) => p.endsWith("metrics.ts"));
    expect(metricsEntry).toBeDefined();
    const { queryMetricsSchema } = metricsEntry![1] as any;
    expect(queryMetricsSchema.safeParse({}).success).toBe(false);

    // Find apm module
    const apmEntry = toolEntries.find(([p]) => p.endsWith("apm.ts"));
    expect(apmEntry).toBeDefined();
    const { searchSpansSchema } = apmEntry![1] as any;
    expect(searchSpansSchema.safeParse({}).success).toBe(false);
  });
});
