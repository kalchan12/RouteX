import { describe, it, expect } from 'vitest';
import { defaultScenarios } from '../../src/scenarios/defaultScenarios';
import { ScenarioConfigSchema } from '../../src/lib/schemas';

describe('Scenario Schema Validation with Zod', () => {
  it('validates all default scenarios against ScenarioConfigSchema', () => {
    for (const scenario of defaultScenarios) {
      const result = ScenarioConfigSchema.safeParse(scenario);
      expect(result.success, `Scenario "${scenario.id}" failed validation: ${!result.success ? JSON.stringify(result.error) : ''}`).toBe(true);
    }
  });
});
