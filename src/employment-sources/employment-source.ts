import { z } from 'zod';

import { organizationIdSchema } from '../organizations/organization.js';
import { employmentSourceAdapterKeySchema } from './employment-source-adapter.js';

export const employmentSourceIdSchema = z.uuid().brand<'EmploymentSourceId'>();

const storedEmploymentSourceNameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine(
    (name) => name === name.trim(),
    'Employment source name must be trimmed',
  );

export const createEmploymentSourceInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    name: z.string().trim().min(1).max(255),
    adapterKey: employmentSourceAdapterKeySchema,
    config: z.unknown(),
    enabled: z.boolean().optional().default(true),
  })
  .strict();

export const newEmploymentSourceSchema = z
  .object({
    id: employmentSourceIdSchema,
    organizationId: organizationIdSchema,
    name: storedEmploymentSourceNameSchema,
    adapterKey: employmentSourceAdapterKeySchema,
    config: z.record(z.string(), z.unknown()),
    configSchemaVersion: z.number().int().positive(),
    enabled: z.boolean(),
  })
  .strict();

export const employmentSourceSchema = newEmploymentSourceSchema.extend({
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmploymentSourceId = z.infer<typeof employmentSourceIdSchema>;
export type CreateEmploymentSourceInput = z.input<
  typeof createEmploymentSourceInputSchema
>;
export type NewEmploymentSource = z.infer<typeof newEmploymentSourceSchema>;
export type EmploymentSource = z.infer<typeof employmentSourceSchema>;
