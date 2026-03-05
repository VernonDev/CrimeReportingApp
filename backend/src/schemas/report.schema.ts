import { z } from 'zod';

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
};

export const createReportSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  categoryId: z.number().int().positive(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  incidentDate: z
    .string()
    .datetime()
    .refine(
      (val) => new Date(val) <= new Date(),
      'Incident date cannot be in the future',
    )
    .refine(
      (val) => new Date(val) >= thirtyDaysAgo(),
      'Incident date cannot be more than 30 days in the past',
    ),
  isAnonymous: z.boolean().optional().default(false),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  photoPaths: z.array(z.string()).optional(),
});

export const updateReportSchema = createReportSchema.partial();

export const reportQuerySchema = z.object({
  status: z.enum(['pending', 'verified', 'flagged', 'rejected', 'archived']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  neLat: z.coerce.number().optional(),
  neLng: z.coerce.number().optional(),
  swLat: z.coerce.number().optional(),
  swLng: z.coerce.number().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const flagReportSchema = z.object({
  reason: z.string().min(1).max(255),
  details: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type FlagReportInput = z.infer<typeof flagReportSchema>;
