import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import type { Database } from '../db/client.js';
import { employmentSources } from '../db/schema.js';
import { validateStoredEmploymentSourceConfig } from './create-employment-source.js';
import {
  EmploymentSourceAlreadyExistsError,
  EmploymentSourceOrganizationNotFoundError,
  type EmploymentSourceRepository,
} from './employment-source-repository.js';
import {
  employmentSourceIdSchema,
  employmentSourceSchema,
  newEmploymentSourceSchema,
  type EmploymentSource,
  type EmploymentSourceId,
  type NewEmploymentSource,
} from './employment-source.js';

export class PostgresEmploymentSourceRepository
  implements EmploymentSourceRepository
{
  constructor(private readonly db: Database) {}

  async create(candidate: NewEmploymentSource): Promise<EmploymentSource> {
    const source = newEmploymentSourceSchema.parse(candidate);
    validateStoredEmploymentSourceConfig(source);

    try {
      const [created] = await this.db
        .insert(employmentSources)
        .values(source)
        .returning();

      return this.parseStoredSource(created);
    } catch (error) {
      const databaseError = unwrapDatabaseError(error);

      if (
        databaseError?.code === '23505' &&
        databaseError.constraint ===
          'employment_sources_organization_adapter_unique'
      ) {
        throw new EmploymentSourceAlreadyExistsError(
          source.organizationId,
          source.adapterKey,
        );
      }

      if (
        databaseError?.code === '23503' &&
        databaseError.constraint ===
          'employment_sources_organization_id_organizations_id_fk'
      ) {
        throw new EmploymentSourceOrganizationNotFoundError(
          source.organizationId,
        );
      }

      throw error;
    }
  }

  async findById(candidateId: EmploymentSourceId): Promise<EmploymentSource | null> {
    const id = employmentSourceIdSchema.parse(candidateId);
    const [stored] = await this.db
      .select()
      .from(employmentSources)
      .where(eq(employmentSources.id, id))
      .limit(1);

    return stored ? this.parseStoredSource(stored) : null;
  }

  private parseStoredSource(candidate: unknown): EmploymentSource {
    const source = employmentSourceSchema.parse(candidate);
    const config = validateStoredEmploymentSourceConfig(source);

    return employmentSourceSchema.parse({ ...source, config });
  }
}

function unwrapDatabaseError(error: unknown): DatabaseError | null {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (error instanceof Error && error.cause instanceof DatabaseError) {
    return error.cause;
  }

  return null;
}
