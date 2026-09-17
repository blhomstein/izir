import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createEmploymentSource } from '../src/employment-sources/create-employment-source.js';
import type { EmploymentSourceRepository } from '../src/employment-sources/employment-source-repository.js';
import {
  employmentSourceIdSchema,
  type EmploymentSource,
  type EmploymentSourceId,
  type NewEmploymentSource,
} from '../src/employment-sources/employment-source.js';
import { organizationIdSchema } from '../src/organizations/organization.js';

const fixedSourceId = employmentSourceIdSchema.parse(
  '01994a72-5a3e-739c-a490-e039f8a84b01',
);
const organizationId = organizationIdSchema.parse(
  '01994a72-5a3e-739c-a490-e039f8a84a81',
);

class InMemoryEmploymentSourceRepository
  implements EmploymentSourceRepository
{
  async create(source: NewEmploymentSource): Promise<EmploymentSource> {
    const now = new Date();
    return { ...source, createdAt: now, updatedAt: now };
  }

  async findById(_id: EmploymentSourceId): Promise<EmploymentSource | null> {
    return null;
  }
}

describe('createEmploymentSource', () => {
  it('registers a Greenhouse source for an organization', async () => {
    const source = await createEmploymentSource(
      {
        organizationId,
        name: '  Acme careers  ',
        adapterKey: 'greenhouse',
        config: { boardToken: 'acme' },
      },
      new InMemoryEmploymentSourceRepository(),
      () => fixedSourceId,
    );

    assert.equal(source.organizationId, organizationId);
    assert.equal(source.name, 'Acme careers');
    assert.equal(source.configSchemaVersion, 1);
    assert.equal(source.enabled, true);
  });

  it('preserves an explicitly disabled source', async () => {
    const source = await createEmploymentSource(
      {
        organizationId,
        name: 'Acme careers',
        adapterKey: 'greenhouse',
        config: { boardToken: 'acme' },
        enabled: false,
      },
      new InMemoryEmploymentSourceRepository(),
      () => fixedSourceId,
    );

    assert.equal(source.enabled, false);
  });

  it('rejects unknown adapter configuration fields', async () => {
    await assert.rejects(() =>
      createEmploymentSource(
        {
          organizationId,
          name: 'Acme careers',
          adapterKey: 'greenhouse',
          config: { boadToken: 'acme' },
        },
        new InMemoryEmploymentSourceRepository(),
        () => fixedSourceId,
      ),
    );
  });
});
