import { randomUUID } from 'node:crypto';

import {
  getEmploymentSourceAdapter,
  type ValidatedAdapterConfig,
} from './employment-source-adapter.js';
import type { EmploymentSourceRepository } from './employment-source-repository.js';
import {
  createEmploymentSourceInputSchema,
  employmentSourceIdSchema,
  newEmploymentSourceSchema,
  type CreateEmploymentSourceInput,
  type EmploymentSource,
  type EmploymentSourceId,
} from './employment-source.js';

export type EmploymentSourceIdGenerator = () => EmploymentSourceId;

const defaultIdGenerator: EmploymentSourceIdGenerator = () =>
  employmentSourceIdSchema.parse(randomUUID());

export async function createEmploymentSource(
  input: CreateEmploymentSourceInput,
  repository: EmploymentSourceRepository,
  generateId: EmploymentSourceIdGenerator = defaultIdGenerator,
): Promise<EmploymentSource> {
  const candidate = createEmploymentSourceInputSchema.parse(input);
  const adapter = getEmploymentSourceAdapter(candidate.adapterKey);
  const config = adapter.validateConfig(
    candidate.config,
    adapter.currentConfigSchemaVersion,
  );

  const source = newEmploymentSourceSchema.parse({
    ...candidate,
    id: generateId(),
    config,
    configSchemaVersion: adapter.currentConfigSchemaVersion,
  });

  return repository.create(source);
}

export function validateStoredEmploymentSourceConfig(
  source: Pick<
    EmploymentSource,
    'adapterKey' | 'config' | 'configSchemaVersion'
  >,
): ValidatedAdapterConfig {
  const adapter = getEmploymentSourceAdapter(source.adapterKey);
  return adapter.validateConfig(source.config, source.configSchemaVersion);
}
