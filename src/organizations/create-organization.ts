import { randomUUID } from 'node:crypto';

import {
  createOrganizationInputSchema,
  newOrganizationSchema,
  organizationIdSchema,
  type CreateOrganizationInput,
  type Organization,
  type OrganizationId,
} from './organization.js';
import type { OrganizationRepository } from './organization-repository.js';

export type OrganizationIdGenerator = () => OrganizationId;

const defaultIdGenerator: OrganizationIdGenerator = () =>
  organizationIdSchema.parse(randomUUID());

export async function createOrganization(
  input: CreateOrganizationInput,
  repository: OrganizationRepository,
  generateId: OrganizationIdGenerator = defaultIdGenerator,
): Promise<Organization> {
  const { name } = createOrganizationInputSchema.parse(input);
  const organization = newOrganizationSchema.parse({
    id: generateId(),
    name,
    status: 'active',
  });

  return repository.create(organization);
}
