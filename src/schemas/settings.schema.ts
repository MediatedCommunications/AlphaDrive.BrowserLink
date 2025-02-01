import { z } from 'zod';

export const SettingsSchema = z.object({
  clio_open_docs: z.boolean().optional(),
  clio_enhance_docs: z.boolean().optional(),
  pacer_auto_save_and_archive: z.boolean().optional(),
  pacer_notify_when_archived: z.boolean().optional(),
});

export type SettingsSchemaType = z.infer<typeof SettingsSchema>;
