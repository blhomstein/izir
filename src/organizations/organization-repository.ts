import type {
  NewOrganization,
  Organization,
  OrganizationId,
} from './organization.js';

export interface OrganizationRepository {
  create(organization: NewOrganization): Promise<Organization>;
  findById(id: OrganizationId): Promise<Organization | null>;
}

export class OrganizationAlreadyExistsError extends Error {
  constructor(readonly organizationId: OrganizationId) {
    super(`Organization ${organizationId} already exists`);
    this.name = 'OrganizationAlreadyExistsError';
  }
}
