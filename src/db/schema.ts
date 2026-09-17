import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { employmentSourceAdapterKeys } from '../employment-sources/employment-source-adapter.js';

export const organizationStatus = pgEnum('organization_status', [
  'active',
  'archived',
]);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    status: organizationStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('organizations_name_not_blank', sql`char_length(${table.name}) > 0`),
    check('organizations_name_trimmed', sql`${table.name} = btrim(${table.name})`),
  ],
);

const employmentSourceAdapterKeySql = sql.raw(
  employmentSourceAdapterKeys.map((key) => `'${key}'`).join(', '),
);

export const employmentSources = pgTable(
  'employment_sources',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    adapterKey: varchar('adapter_key', { length: 64 }).notNull(),
    config: jsonb('config').notNull(),
    configSchemaVersion: integer('config_schema_version').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'employment_sources_organization_id_organizations_id_fk',
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
    }).onDelete('restrict'),
    unique('employment_sources_organization_adapter_unique').on(
      table.organizationId,
      table.adapterKey,
    ),
    check(
      'employment_sources_name_not_blank',
      sql`char_length(${table.name}) > 0`,
    ),
    check(
      'employment_sources_name_trimmed',
      sql`${table.name} = btrim(${table.name})`,
    ),
    check(
      'employment_sources_adapter_key_allowed',
      sql`${table.adapterKey} in (${employmentSourceAdapterKeySql})`,
    ),
    check(
      'employment_sources_config_is_object',
      sql`jsonb_typeof(${table.config}) = 'object'`,
    ),
    check(
      'employment_sources_config_schema_version_positive',
      sql`${table.configSchemaVersion} > 0`,
    ),
  ],
);
