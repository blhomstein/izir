import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createOrganization } from '../src/organizations/create-organization.js';
import {
  organizationIdSchema,
  type NewOrganization,
  type Organization,
  type OrganizationId,
} from '../src/organizations/organization.js';
import type { OrganizationRepository } from '../src/organizations/organization-repository.js';

const fixedId = organizationIdSchema.parse('01994a72-5a3e-739c-a490-e039f8a84a81');

class InMemoryOrganizationRepository implements OrganizationRepository {
  async create(organization: NewOrganization): Promise<Organization> {
    const now = new Date();
    return { ...organization, createdAt: now, updatedAt: now };
  }

  async findById(_id: OrganizationId): Promise<Organization | null> {
    return null;
  }
}

describe('createOrganization', () => {
  it('trims the name and creates an active organization with a stable ID', async () => {
    const organization = await createOrganization(
      { name: '  Acme Corporation  ' },
      new InMemoryOrganizationRepository(),
      () => fixedId,
    );

    assert.equal(organization.id, fixedId);
    assert.equal(organization.name, 'Acme Corporation');
    assert.equal(organization.status, 'active');
  });

  it('rejects a blank name at the application boundary', async () => {
    await assert.rejects(() =>
      createOrganization(
        { name: '   ' },
        new InMemoryOrganizationRepository(),
        () => fixedId,
      ),
    );
  });
});
