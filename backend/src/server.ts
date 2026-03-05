import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

import { authRoutes } from './routes/auth.routes';
import { reportsRoutes } from './routes/reports.routes';
import { categoriesRoutes } from './routes/categories.routes';
import { usersRoutes } from './routes/users.routes';
import { saveUploadedFile, ensureUploadDir } from './services/files.service';
import { authenticate } from './middleware/auth.middleware';
import { MAX_FILES_PER_REPORT, MAX_FILE_SIZE } from './utils/constants';

const PORT = parseInt(process.env.PORT || '4000', 10);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  });

  // Multipart (file uploads)
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES_PER_REPORT,
    },
  });

  // Serve uploaded files statically
  await fastify.register(staticFiles, {
    root: UPLOAD_DIR,
    prefix: '/uploads/',
  });

  // Global error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    });
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(reportsRoutes, { prefix: '/reports' });
  await fastify.register(categoriesRoutes, { prefix: '/categories' });
  await fastify.register(usersRoutes, { prefix: '/users' });

  // File upload endpoint
  fastify.post(
    '/upload',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        await ensureUploadDir();
        const parts = request.files();
        const paths: string[] = [];

        for await (const file of parts) {
          if (paths.length >= MAX_FILES_PER_REPORT) break;
          const filePath = await saveUploadedFile(file);
          paths.push(filePath);
        }

        return reply.send({ success: true, data: { paths } });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Upload Failed',
          message: e.message || 'File upload failed',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );

  return fastify;
}

async function start() {
  const server = await buildServer();

  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
