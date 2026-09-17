import { z } from 'zod';

export const employmentSourceAdapterKeys = ['greenhouse'] as const;

export const employmentSourceAdapterKeySchema = z.enum(
  employmentSourceAdapterKeys,
);

export type EmploymentSourceAdapterKey = z.infer<
  typeof employmentSourceAdapterKeySchema
>;

export type ValidatedAdapterConfig = Readonly<Record<string, unknown>>;

export interface EmploymentSourceAdapter {
  readonly key: EmploymentSourceAdapterKey;
  readonly currentConfigSchemaVersion: number;
  validateConfig(
    config: unknown,
    schemaVersion: number,
  ): ValidatedAdapterConfig;
}

const greenhouseConfigV1Schema = z
  .object({
    boardToken: z.string().trim().min(1).max(100),
  })
  .strict();

const greenhouseAdapter: EmploymentSourceAdapter = {
  key: 'greenhouse',
  currentConfigSchemaVersion: 1,
  validateConfig(config, schemaVersion) {
    if (schemaVersion !== 1) {
      throw new UnsupportedAdapterConfigVersionError(
        this.key,
        schemaVersion,
      );
    }

    return greenhouseConfigV1Schema.parse(config);
  },
};

const adapters: Readonly<
  Record<EmploymentSourceAdapterKey, EmploymentSourceAdapter>
> = {
  greenhouse: greenhouseAdapter,
};

export function getEmploymentSourceAdapter(
  candidateKey: unknown,
): EmploymentSourceAdapter {
  const key = employmentSourceAdapterKeySchema.parse(candidateKey);
  return adapters[key];
}

export class UnsupportedAdapterConfigVersionError extends Error {
  constructor(
    readonly adapterKey: EmploymentSourceAdapterKey,
    readonly configSchemaVersion: number,
  ) {
    super(
      `Adapter ${adapterKey} does not support config schema version ${configSchemaVersion}`,
    );
    this.name = 'UnsupportedAdapterConfigVersionError';
  }
}
