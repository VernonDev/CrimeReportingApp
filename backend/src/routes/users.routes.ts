import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { authenticate } from '../middleware/auth.middleware';
import { updateUserSchema } from '../schemas/user.schema';
import { getUserReports } from '../services/reports.service';

export async function usersRoutes(fastify: FastifyInstance) {
  // GET /users/me
  fastify.get(
    '/me',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, request.user!.userId))
        .limit(1);

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found', statusCode: 404 });
      }

      return reply.send({ success: true, data: user });
    },
  );

  // PATCH /users/me
  fastify.patch(
    '/me',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = updateUserSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.error.errors[0].message,
          statusCode: 400,
        });
      }

      const [user] = await db
        .update(users)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(users.id, request.user!.userId))
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          role: users.role,
        });

      return reply.send({ success: true, data: user });
    },
  );

  // GET /users/me/reports
  fastify.get(
    '/me/reports',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const reports = await getUserReports(request.user!.userId);
      return reply.send({ success: true, data: reports });
    },
  );
}
