import { sql } from 'drizzle-orm';
import { check, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

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
