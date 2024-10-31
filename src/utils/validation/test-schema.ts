import { z } from 'zod';

export const testSchema = z.object({
  CD_DIST: z.coerce.number().int().min(0),
  CD_LOCALIDADE: z.coerce.number().int().min(0),
  CD_BAIRRO: z.coerce.number().int().min(0).optional(),
  CD_IBGE: z.coerce.number().int().min(0),
});

export type TestSchema = z.infer<typeof testSchema>;
