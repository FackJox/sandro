import { z } from 'zod';

const slugSchema = z.string().min(1, 'Slug is required');
const nonEmptyString = z.string().min(1);
const absolutePathSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith('/'), 'Path must start with "/"');

const urlSchema = z.string().url();

export const photoItemSchema = z.object({
  slug: slugSchema,
  title: nonEmptyString,
  image: absolutePathSchema
});

export const filmItemSchema = z.object({
  slug: slugSchema,
  title: nonEmptyString,
  poster: absolutePathSchema,
  externalUrl: urlSchema
});

const aboutPanelSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('text'),
      id: nonEmptyString
    })
    .passthrough(),
  z
    .object({
      kind: z.literal('media'),
      src: absolutePathSchema,
      alt: nonEmptyString
    })
    .passthrough()
]);

const baseRow = z.object({
  slug: slugSchema,
  title: nonEmptyString.optional()
});

const heroRowSchema = baseRow.extend({
  type: z.literal('hero')
});

const contactRowSchema = baseRow.extend({
  type: z.literal('contact')
});

const aboutRowSchema = baseRow.extend({
  type: z.literal('about'),
  panels: z.array(aboutPanelSchema).min(1)
});

const showreelRowSchema = baseRow.extend({
  type: z.literal('showreel'),
  stills: z.array(absolutePathSchema).min(1),
  externalUrl: urlSchema
});

const servicesRowSchema = baseRow.extend({
  type: z.literal('services'),
  items: z.array(nonEmptyString).min(1),
  shutterstockUrl: urlSchema,
  shutterstockLogo: absolutePathSchema
});

const photoGalleryRowSchema = baseRow.extend({
  type: z.literal('photoGallery'),
  items: z.array(photoItemSchema).min(1)
});

const filmGalleryRowSchema = baseRow.extend({
  type: z.literal('filmGallery'),
  items: z.array(filmItemSchema).min(1)
});

export const rowSchema = z.discriminatedUnion('type', [
  heroRowSchema,
  contactRowSchema,
  aboutRowSchema,
  showreelRowSchema,
  servicesRowSchema,
  photoGalleryRowSchema,
  filmGalleryRowSchema
]);

export const contentSchema = z
  .object({
    rows: z.array(rowSchema).min(1)
  })
  .superRefine((data, ctx) => {
    const seenSlugs = new Map<string, number>();
    data.rows.forEach((row, index) => {
      if (seenSlugs.has(row.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate row slug '${row.slug}'`,
          path: ['rows', index, 'slug']
        });
      } else {
        seenSlugs.set(row.slug, index);
      }
    });

    const photoRows = data.rows.filter((row) => row.type === 'photoGallery');
    if (photoRows.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing photoGallery row',
        path: ['rows']
      });
    } else if (photoRows.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one photoGallery row is supported',
        path: ['rows']
      });
    }

    const filmRows = data.rows.filter((row) => row.type === 'filmGallery');
    if (filmRows.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing filmGallery row',
        path: ['rows']
      });
    } else if (filmRows.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one filmGallery row is supported',
        path: ['rows']
      });
    }
  });

export type PhotoItem = z.infer<typeof photoItemSchema>;
export type FilmItem = z.infer<typeof filmItemSchema>;
export type Row = z.infer<typeof rowSchema>;
export type Content = z.infer<typeof contentSchema>;
