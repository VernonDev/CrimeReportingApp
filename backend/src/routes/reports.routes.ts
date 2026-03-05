import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createReportSchema,
  updateReportSchema,
  reportQuerySchema,
  flagReportSchema,
} from '../schemas/report.schema';
import * as reportsService from '../services/reports.service';
import { authenticate, requireModerator } from '../middleware/auth.middleware';
import { TokenPayload } from '../types';

export async function reportsRoutes(fastify: FastifyInstance) {
  // GET /reports - list reports with filters
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = reportQuerySchema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: result.error.errors[0].message,
        statusCode: 400,
      });
    }

    // Check if requester is a moderator (to see all statuses)
    let data;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && result.data.status) {
      try {
        const { verifyToken } = await import('../utils/jwt');
        const payload = verifyToken(authHeader.slice(7)) as TokenPayload;
        if (payload.role === 'moderator' || payload.role === 'admin') {
          data = await reportsService.getAllReportsForModerators(result.data);
        } else {
          data = await reportsService.getAllReports(result.data);
        }
      } catch {
        data = await reportsService.getAllReports(result.data);
      }
    } else {
      data = await reportsService.getAllReports(result.data);
    }

    return reply.send({
      success: true,
      data: data.reports,
      pagination: {
        total: data.total,
        limit: data.limit,
        offset: data.offset,
      },
    });
  });

  // POST /reports - create report (auth required)
  fastify.post(
    '/',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = createReportSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.error.errors[0].message,
          statusCode: 400,
        });
      }

      try {
        const report = await reportsService.createReport(result.data, request.user!.userId);
        return reply.status(201).send({ success: true, data: report });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Create Failed',
          message: e.message || 'An error occurred',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );

  // GET /reports/:id - get single report
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid report ID', statusCode: 400 });
    }

    try {
      const report = await reportsService.getReportById(reportId);
      return reply.send({ success: true, data: report });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.status(e.statusCode || 500).send({
        error: 'Not Found',
        message: e.message || 'An error occurred',
        statusCode: e.statusCode || 500,
      });
    }
  });

  // PATCH /reports/:id - update report
  fastify.patch(
    '/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const reportId = parseInt(id, 10);
      if (isNaN(reportId)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid report ID', statusCode: 400 });
      }

      const result = updateReportSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.error.errors[0].message,
          statusCode: 400,
        });
      }

      try {
        const report = await reportsService.updateReport(reportId, result.data, request.user!);
        return reply.send({ success: true, data: report });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Update Failed',
          message: e.message || 'An error occurred',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );

  // DELETE /reports/:id - admin only
  fastify.delete(
    '/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const reportId = parseInt(id, 10);
      if (isNaN(reportId)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid report ID', statusCode: 400 });
      }

      try {
        await reportsService.deleteReport(reportId, request.user!);
        return reply.send({ success: true, data: null, message: 'Report deleted' });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Delete Failed',
          message: e.message || 'An error occurred',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );

  // POST /reports/:id/verify - moderator/admin only
  fastify.post(
    '/:id/verify',
    { preHandler: requireModerator },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const reportId = parseInt(id, 10);

      try {
        const report = await reportsService.verifyReport(reportId, request.user!.userId);
        return reply.send({ success: true, data: report, message: 'Report verified' });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Verify Failed',
          message: e.message || 'An error occurred',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );

  // POST /reports/:id/reject - moderator/admin only
  fastify.post(
    '/:id/reject',
    { preHandler: requireModerator },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const reportId = parseInt(id, 10);

      try {
        const report = await reportsService.rejectReport(reportId);
        return reply.send({ success: true, data: report, message: 'Report rejected' });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Reject Failed',
          message: e.message || 'An error occurred',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );

  // POST /reports/:id/flag - auth required
  fastify.post(
    '/:id/flag',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const reportId = parseInt(id, 10);

      const result = flagReportSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.error.errors[0].message,
          statusCode: 400,
        });
      }

      try {
        const flag = await reportsService.flagReport(reportId, request.user!.userId, result.data);
        return reply.status(201).send({ success: true, data: flag });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.status(e.statusCode || 500).send({
          error: 'Flag Failed',
          message: e.message || 'An error occurred',
          statusCode: e.statusCode || 500,
        });
      }
    },
  );
}
