import type { EmploymentSourceAdapterKey } from './employment-source-adapter.js';
import type {
  EmploymentSource,
  EmploymentSourceId,
  NewEmploymentSource,
} from './employment-source.js';

export interface EmploymentSourceRepository {
  create(source: NewEmploymentSource): Promise<EmploymentSource>;
  findById(id: EmploymentSourceId): Promise<EmploymentSource | null>;
}

export class EmploymentSourceAlreadyExistsError extends Error {
  constructor(
    readonly organizationId: string,
    readonly adapterKey: EmploymentSourceAdapterKey,
  ) {
    super(`Organization ${organizationId} already has a ${adapterKey} source`);
    this.name = 'EmploymentSourceAlreadyExistsError';
  }
}

export class EmploymentSourceOrganizationNotFoundError extends Error {
  constructor(readonly organizationId: string) {
    super(`Organization ${organizationId} does not exist`);
    this.name = 'EmploymentSourceOrganizationNotFoundError';
  }
}
