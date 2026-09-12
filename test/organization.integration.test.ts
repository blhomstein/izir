import 'dotenv/config';

import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';

import { inArray } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDatabase } from '../src/db/client.js';
import { organizations } from '../src/db/schema.js';
import { createOrganization } from '../src/organizations/create-organization.js';
import { organizationIdSchema } from '../src/organizations/organization.js';
import { OrganizationAlreadyExistsError } from '../src/organizations/organization-repository.js';
import { PostgresOrganizationRepository } from '../src/organizations/postgres-organization-repository.js';

const firstId = organizationIdSchema.parse('01994a72-5a3e-739c-a490-e039f8a84a81');
const secondId = organizationIdSchema.parse('01994a72-5a3e-739c-a490-e039f8a84a82');
const unknownId = organizationIdSchema.parse('01994a72-5a3e-739c-a490-e039f8a84a83');
const connectionString = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe(
  'PostgresOrganizationRepository',
  { skip: connectionString ? false : 'DATABASE_URL is not configured' },
  () => {
    if (!connectionString) return;

    const { db, pool } = createDatabase(connectionString);
    const repository = new PostgresOrganizationRepository(db);

    before(async () => {
      await migrate(db, { migrationsFolder: 'drizzle' });
      await removeTestOrganizations();
    });

    afterEach(removeTestOrganizations);

    async function removeTestOrganizations() {
      await db.delete(organizations).where(
        inArray(organizations.id, [firstId, secondId, unknownId]),
      );
    }

    after(async () => {
      await pool.end();
    });

    it('creates and loads an organization by its stable ID', async () => {
      const created = await createOrganization(
        { name: 'Acme Corporation' },
        repository,
        () => firstId,
      );
      const loaded = await repository.findById(firstId);

      assert.deepEqual(loaded, created);
      assert.equal(created.status, 'active');
      assert.ok(created.createdAt instanceof Date);
      assert.ok(created.updatedAt instanceof Date);
    });

    it('maps repeated creation of the same ID to a domain error', async () => {
      await createOrganization({ name: 'Acme' }, repository, () => firstId);

      await assert.rejects(
        () => createOrganization({ name: 'Acme' }, repository, () => firstId),
        (error) =>
          error instanceof OrganizationAlreadyExistsError &&
          error.organizationId === firstId,
      );
    });

    it('allows distinct organizations to have the same name', async () => {
      await createOrganization({ name: 'Acme' }, repository, () => firstId);
      await createOrganization({ name: 'Acme' }, repository, () => secondId);

      assert.equal((await repository.findById(firstId))?.name, 'Acme');
      assert.equal((await repository.findById(secondId))?.name, 'Acme');
    });

    it('returns null for an unknown ID', async () => {
      assert.equal(await repository.findById(unknownId), null);
    });

    it('rejects structurally invalid rows at the database boundary', async () => {
      await assert.rejects(() =>
        db.insert(organizations).values({ id: firstId, name: '  Acme  ' }),
      );
    });
  },
);
