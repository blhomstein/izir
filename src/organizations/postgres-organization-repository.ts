import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import type { Database } from '../db/client.js';
import { organizations } from '../db/schema.js';
import {
  newOrganizationSchema,
  organizationIdSchema,
  organizationSchema,
  type NewOrganization,
  type Organization,
  type OrganizationId,
} from './organization.js';
import {
  OrganizationAlreadyExistsError,
  type OrganizationRepository,
} from './organization-repository.js';

export class PostgresOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: Database) {}

  async create(candidate: NewOrganization): Promise<Organization> {
    const organization = newOrganizationSchema.parse(candidate);

    try {
      const [created] = await this.db
        .insert(organizations)
        .values(organization)
        .returning();

      return organizationSchema.parse(created);
    } catch (error) {
      const databaseError = unwrapDatabaseError(error);

      if (
        databaseError?.code === '23505' &&
        databaseError.constraint === 'organizations_pkey'
      ) {
        throw new OrganizationAlreadyExistsError(organization.id);
      }

      throw error;
    }
  }

  async findById(candidateId: OrganizationId): Promise<Organization | null> {
    const id = organizationIdSchema.parse(candidateId);
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return organization ? organizationSchema.parse(organization) : null;
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
