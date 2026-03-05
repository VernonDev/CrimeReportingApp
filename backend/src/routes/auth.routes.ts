import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema, signupSchema } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/signup
  fastify.post('/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = signupSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: result.error.errors[0].message,
        statusCode: 400,
      });
    }

    try {
      const data = await authService.signup(result.data);
      return reply.status(201).send({ success: true, data, message: 'Account created successfully' });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.status(e.statusCode || 500).send({
        error: 'Signup Failed',
        message: e.message || 'An error occurred',
        statusCode: e.statusCode || 500,
      });
    }
  });

  // POST /auth/login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: result.error.errors[0].message,
        statusCode: 400,
      });
    }

    try {
      const data = await authService.login(result.data);
      return reply.send({ success: true, data });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.status(e.statusCode || 500).send({
        error: 'Login Failed',
        message: e.message || 'An error occurred',
        statusCode: e.statusCode || 500,
      });
    }
  });

  // GET /auth/me
  fastify.get('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await authService.getUserById(request.user!.userId);
      return reply.send({ success: true, data: user });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.status(e.statusCode || 500).send({
        error: 'Not Found',
        message: e.message || 'An error occurred',
        statusCode: e.statusCode || 500,
      });
    }
  });
}
