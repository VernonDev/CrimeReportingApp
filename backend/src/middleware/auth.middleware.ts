import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { TokenPayload } from '../types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
      statusCode: 401,
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    request.user = payload;
  } catch {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
}

export async function requireModerator(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = request.user?.role;
  if (role !== 'moderator' && role !== 'admin') {
    reply.status(403).send({
      error: 'Forbidden',
      message: 'Moderator or admin role required',
      statusCode: 403,
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;

  if (request.user?.role !== 'admin') {
    reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin role required',
      statusCode: 403,
    });
  }
}
