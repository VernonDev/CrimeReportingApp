import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { crimeCategories } from '../db/schema';
import { requireAdmin } from '../middleware/auth.middleware';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  severity: z.number().int().min(1).max(5),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  active: z.boolean().optional().default(true),
});

export async function categoriesRoutes(fastify: FastifyInstance) {
  // GET /categories - list all active categories
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = await db
      .select()
      .from(crimeCategories)
      .where(eq(crimeCategories.active, true))
      .orderBy(crimeCategories.name);

    return reply.send({ success: true, data: categories });
  });

  // POST /categories - admin only
  fastify.post(
    '/',
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = categorySchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.error.errors[0].message,
          statusCode: 400,
        });
      }

      const [category] = await db.insert(crimeCategories).values(result.data).returning();
      return reply.status(201).send({ success: true, data: category });
    },
  );

  // PATCH /categories/:id - admin only
  fastify.patch(
    '/:id',
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const categoryId = parseInt(id, 10);

      const result = categorySchema.partial().safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.error.errors[0].message,
          statusCode: 400,
        });
      }

      const [category] = await db
        .update(crimeCategories)
        .set(result.data)
        .where(eq(crimeCategories.id, categoryId))
        .returning();

      if (!category) {
        return reply.status(404).send({ error: 'Not Found', message: 'Category not found', statusCode: 404 });
      }

      return reply.send({ success: true, data: category });
    },
  );
}
