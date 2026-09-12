import { z } from 'zod';

export const organizationIdSchema = z.uuid().brand<'OrganizationId'>();

export const organizationStatusSchema = z.enum(['active', 'archived']);

const storedOrganizationNameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine((name) => name === name.trim(), 'Organization name must be trimmed');

export const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const newOrganizationSchema = z.object({
  id: organizationIdSchema,
  name: storedOrganizationNameSchema,
  status: organizationStatusSchema,
});

export const organizationSchema = newOrganizationSchema.extend({
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrganizationId = z.infer<typeof organizationIdSchema>;
export type CreateOrganizationInput = z.input<typeof createOrganizationInputSchema>;
export type NewOrganization = z.infer<typeof newOrganizationSchema>;
export type Organization = z.infer<typeof organizationSchema>;
