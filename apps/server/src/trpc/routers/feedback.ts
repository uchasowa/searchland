import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { feedback } from '../../db/schema.js';
import { unlinkUploadPaths } from '../../upload.js';
import { publicProcedure, router } from '../trpc.js';

const statusZ = z.enum(['new', 'reviewing', 'resolved', 'archived']);
const categoryZ = z.enum(['bug', 'feature', 'improvement', 'question', 'other']);
const priorityZ = z.enum(['low', 'medium', 'high']);

/** Trim; empty string → null for optional DB text columns */
function optionalText(value: string | undefined | null, max: number): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  if (t === '') return null;
  return t.length > max ? t.slice(0, max) : t;
}

/** Local disk `/uploads/...` or Supabase Storage public HTTPS URL */
const storedImageUrlZ = z
  .string()
  .max(2048)
  .refine(
    (s) => /^\/uploads\/[a-zA-Z0-9._-]+$/.test(s) || /^https:\/\/.+/.test(s),
    { message: 'Invalid image URL' }
  );

const feedbackBody = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10000),
  category: categoryZ,
  status: statusZ,
  userName: z.string().min(1).max(200),
  userEmail: z.string().email().max(320),
  priority: priorityZ,
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  imageUrls: z.array(storedImageUrlZ).max(5).optional(),
});

function rowValues(input: z.infer<typeof feedbackBody>) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status,
    userName: input.userName,
    userEmail: input.userEmail,
    priority: input.priority,
    company: optionalText(input.company, 200),
    phone: optionalText(input.phone, 50),
    notes: optionalText(input.notes, 5000),
    imageUrls: input.imageUrls ?? [],
  };
}

const feedbackPatch = feedbackBody.partial();

export const feedbackRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          status: statusZ.optional(),
          category: categoryZ.optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.status) conditions.push(eq(feedback.status, input.status));
      if (input?.category) conditions.push(eq(feedback.category, input.category));

      const base = ctx.db.select().from(feedback);
      if (conditions.length === 0) {
        return base.orderBy(desc(feedback.createdAt));
      }
      return base.where(and(...conditions)).orderBy(desc(feedback.createdAt));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.select().from(feedback).where(eq(feedback.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: publicProcedure.input(feedbackBody).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db.insert(feedback).values(rowValues(input)).returning();
    return row;
  }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: feedbackPatch,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const d = input.data;
      const patch: Record<string, unknown> = { updatedAt: new Date() };

      if (d.imageUrls !== undefined) {
        const [old] = await ctx.db
          .select({ imageUrls: feedback.imageUrls })
          .from(feedback)
          .where(eq(feedback.id, input.id))
          .limit(1);
        const prev = old?.imageUrls ?? [];
        const removed = prev.filter((u) => !d.imageUrls!.includes(u));
        unlinkUploadPaths(removed);
        patch.imageUrls = d.imageUrls;
      }

      if (d.title !== undefined) patch.title = d.title;
      if (d.description !== undefined) patch.description = d.description;
      if (d.category !== undefined) patch.category = d.category;
      if (d.status !== undefined) patch.status = d.status;
      if (d.userName !== undefined) patch.userName = d.userName;
      if (d.userEmail !== undefined) patch.userEmail = d.userEmail;
      if (d.priority !== undefined) patch.priority = d.priority;
      if (d.company !== undefined) patch.company = optionalText(d.company, 200);
      if (d.phone !== undefined) patch.phone = optionalText(d.phone, 50);
      if (d.notes !== undefined) patch.notes = optionalText(d.notes, 5000);

      const [row] = await ctx.db
        .update(feedback)
        .set(patch)
        .where(eq(feedback.id, input.id))
        .returning();
      return row ?? null;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.delete(feedback).where(eq(feedback.id, input.id)).returning();
      if (row?.imageUrls?.length) {
        unlinkUploadPaths(row.imageUrls);
      }
      return { deleted: Boolean(row) };
    }),
});
