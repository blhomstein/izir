import 'dotenv/config';

import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';

import { inArray } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDatabase } from '../src/db/client.js';
import { employmentSources, organizations } from '../src/db/schema.js';
import { createEmploymentSource } from '../src/employment-sources/create-employment-source.js';
import { EmploymentSourceAlreadyExistsError } from '../src/employment-sources/employment-source-repository.js';
import { employmentSourceIdSchema } from '../src/employment-sources/employment-source.js';
import { PostgresEmploymentSourceRepository } from '../src/employment-sources/postgres-employment-source-repository.js';
import { organizationIdSchema } from '../src/organizations/organization.js';

const firstSourceId = employmentSourceIdSchema.parse(
  '01994a72-5a3e-739c-a490-e039f8a84b01',
);
const secondSourceId = employmentSourceIdSchema.parse(
  '01994a72-5a3e-739c-a490-e039f8a84b02',
);
const organizationId = organizationIdSchema.parse(
  '01994a72-5a3e-739c-a490-e039f8a84a91',
);
const secondOrganizationId = organizationIdSchema.parse(
  '01994a72-5a3e-739c-a490-e039f8a84a92',
);
const connectionString = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe(
  'PostgresEmploymentSourceRepository',
  { skip: connectionString ? false : 'DATABASE_URL is not configured' },
  () => {
    if (!connectionString) return;

    const { db, pool } = createDatabase(connectionString);
    const repository = new PostgresEmploymentSourceRepository(db);

    before(async () => {
      await migrate(db, { migrationsFolder: 'drizzle' });
      await removeTestData();
      await db.insert(organizations).values([
        { id: organizationId, name: 'Acme' },
        { id: secondOrganizationId, name: 'Other employer' },
      ]);
    });

    afterEach(async () => {
      await db
        .delete(employmentSources)
        .where(inArray(employmentSources.id, [firstSourceId, secondSourceId]));
    });

    async function removeTestData() {
      await db
        .delete(employmentSources)
        .where(inArray(employmentSources.id, [firstSourceId, secondSourceId]));
      await db
        .delete(organizations)
        .where(
          inArray(organizations.id, [organizationId, secondOrganizationId]),
        );
    }

    after(async () => {
      await removeTestData();
      await pool.end();
    });

    it('creates and reads a source while validating stored configuration', async () => {
      const created = await createEmploymentSource(
        {
          organizationId,
          name: 'Acme careers',
          adapterKey: 'greenhouse',
          config: { boardToken: 'acme' },
        },
        repository,
        () => firstSourceId,
      );

      assert.deepEqual(await repository.findById(firstSourceId), created);
    });

    it('rejects a second source for the same organization and adapter', async () => {
      await createEmploymentSource(
        {
          organizationId,
          name: 'Acme careers',
          adapterKey: 'greenhouse',
          config: { boardToken: 'first-board' },
        },
        repository,
        () => firstSourceId,
      );

      await assert.rejects(
        () =>
          createEmploymentSource(
            {
              organizationId,
              name: 'Second Greenhouse source',
              adapterKey: 'greenhouse',
              config: { boardToken: 'second-board' },
            },
            repository,
            () => secondSourceId,
          ),
        EmploymentSourceAlreadyExistsError,
      );
    });

    it('lets the database reject invalid JSON shapes', async () => {
      await assert.rejects(() =>
        db.insert(employmentSources).values({
          id: firstSourceId,
          organizationId,
          name: 'Invalid source',
          adapterKey: 'greenhouse',
          config: [],
          configSchemaVersion: 1,
        }),
      );
    });
  },
);
