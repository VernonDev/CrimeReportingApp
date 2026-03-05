import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { crimeReports, crimeCategories, users, reportFlags } from '../db/schema';
import { CreateReportInput, UpdateReportInput, ReportQueryInput, FlagReportInput } from '../schemas/report.schema';
import { TokenPayload } from '../types';

export async function getAllReports(query: ReportQueryInput) {
  const conditions = [];

  if (query.status) {
    conditions.push(eq(crimeReports.status, query.status));
  } else {
    // Default: only show verified reports on public map
    conditions.push(eq(crimeReports.status, 'verified'));
  }

  if (query.categoryId) {
    conditions.push(eq(crimeReports.categoryId, query.categoryId));
  }

  // Bounding box filter
  if (query.neLat !== undefined && query.neLng !== undefined &&
      query.swLat !== undefined && query.swLng !== undefined) {
    conditions.push(gte(crimeReports.latitude, String(query.swLat)));
    conditions.push(lte(crimeReports.latitude, String(query.neLat)));
    conditions.push(gte(crimeReports.longitude, String(query.swLng)));
    conditions.push(lte(crimeReports.longitude, String(query.neLng)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [reports, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: crimeReports.id,
        title: crimeReports.title,
        description: crimeReports.description,
        latitude: crimeReports.latitude,
        longitude: crimeReports.longitude,
        address: crimeReports.address,
        neighborhood: crimeReports.neighborhood,
        incidentDate: crimeReports.incidentDate,
        status: crimeReports.status,
        isAnonymous: crimeReports.isAnonymous,
        photoPaths: crimeReports.photoPaths,
        createdAt: crimeReports.createdAt,
        category: {
          id: crimeCategories.id,
          name: crimeCategories.name,
          color: crimeCategories.color,
          severity: crimeCategories.severity,
          icon: crimeCategories.icon,
        },
      })
      .from(crimeReports)
      .innerJoin(crimeCategories, eq(crimeReports.categoryId, crimeCategories.id))
      .where(whereClause)
      .orderBy(desc(crimeReports.incidentDate))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ value: count() })
      .from(crimeReports)
      .where(whereClause),
  ]);

  return { reports, total: Number(total), limit: query.limit, offset: query.offset };
}

export async function getAllReportsForModerators(query: ReportQueryInput) {
  const conditions = [];

  if (query.status) {
    conditions.push(eq(crimeReports.status, query.status));
  }

  if (query.categoryId) {
    conditions.push(eq(crimeReports.categoryId, query.categoryId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [reports, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: crimeReports.id,
        title: crimeReports.title,
        description: crimeReports.description,
        latitude: crimeReports.latitude,
        longitude: crimeReports.longitude,
        address: crimeReports.address,
        neighborhood: crimeReports.neighborhood,
        incidentDate: crimeReports.incidentDate,
        status: crimeReports.status,
        isAnonymous: crimeReports.isAnonymous,
        photoPaths: crimeReports.photoPaths,
        createdAt: crimeReports.createdAt,
        category: {
          id: crimeCategories.id,
          name: crimeCategories.name,
          color: crimeCategories.color,
          severity: crimeCategories.severity,
          icon: crimeCategories.icon,
        },
      })
      .from(crimeReports)
      .innerJoin(crimeCategories, eq(crimeReports.categoryId, crimeCategories.id))
      .where(whereClause)
      .orderBy(desc(crimeReports.createdAt))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ value: count() })
      .from(crimeReports)
      .where(whereClause),
  ]);

  return { reports, total: Number(total), limit: query.limit, offset: query.offset };
}

export async function createReport(data: CreateReportInput, userId: number) {
  const [report] = await db
    .insert(crimeReports)
    .values({
      reporterId: userId,
      categoryId: data.categoryId,
      latitude: String(data.location.lat),
      longitude: String(data.location.lng),
      address: data.address,
      neighborhood: data.neighborhood,
      title: data.title,
      description: data.description,
      incidentDate: new Date(data.incidentDate),
      isAnonymous: data.isAnonymous ?? false,
      photoPaths: data.photoPaths,
      status: 'pending',
    })
    .returning();

  return report;
}

export async function getReportById(id: number) {
  const [report] = await db
    .select({
      id: crimeReports.id,
      reporterId: crimeReports.reporterId,
      title: crimeReports.title,
      description: crimeReports.description,
      latitude: crimeReports.latitude,
      longitude: crimeReports.longitude,
      address: crimeReports.address,
      neighborhood: crimeReports.neighborhood,
      incidentDate: crimeReports.incidentDate,
      status: crimeReports.status,
      isAnonymous: crimeReports.isAnonymous,
      photoPaths: crimeReports.photoPaths,
      createdAt: crimeReports.createdAt,
      updatedAt: crimeReports.updatedAt,
      verifiedAt: crimeReports.verifiedAt,
      category: {
        id: crimeCategories.id,
        name: crimeCategories.name,
        color: crimeCategories.color,
        severity: crimeCategories.severity,
        icon: crimeCategories.icon,
      },
    })
    .from(crimeReports)
    .innerJoin(crimeCategories, eq(crimeReports.categoryId, crimeCategories.id))
    .where(eq(crimeReports.id, id))
    .limit(1);

  if (!report) {
    throw { statusCode: 404, message: 'Report not found' };
  }

  return report;
}

export async function updateReport(
  id: number,
  data: UpdateReportInput,
  user: TokenPayload,
) {
  const [existing] = await db
    .select()
    .from(crimeReports)
    .where(eq(crimeReports.id, id))
    .limit(1);

  if (!existing) {
    throw { statusCode: 404, message: 'Report not found' };
  }

  const canEdit =
    user.role === 'admin' ||
    user.role === 'moderator' ||
    (existing.reporterId === user.userId && existing.status === 'pending');

  if (!canEdit) {
    throw { statusCode: 403, message: 'You do not have permission to edit this report' };
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.categoryId) updateData.categoryId = data.categoryId;
  if (data.incidentDate) updateData.incidentDate = new Date(data.incidentDate);
  if (data.isAnonymous !== undefined) updateData.isAnonymous = data.isAnonymous;
  if (data.address) updateData.address = data.address;
  if (data.neighborhood) updateData.neighborhood = data.neighborhood;
  if (data.location) {
    updateData.latitude = String(data.location.lat);
    updateData.longitude = String(data.location.lng);
  }

  const [updated] = await db
    .update(crimeReports)
    .set(updateData)
    .where(eq(crimeReports.id, id))
    .returning();

  return updated;
}

export async function deleteReport(id: number, user: TokenPayload) {
  if (user.role !== 'admin') {
    throw { statusCode: 403, message: 'Admin role required to delete reports' };
  }

  const [deleted] = await db
    .delete(crimeReports)
    .where(eq(crimeReports.id, id))
    .returning();

  if (!deleted) {
    throw { statusCode: 404, message: 'Report not found' };
  }

  return deleted;
}

export async function verifyReport(id: number, moderatorId: number) {
  const [report] = await db
    .update(crimeReports)
    .set({
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: moderatorId,
      updatedAt: new Date(),
    })
    .where(eq(crimeReports.id, id))
    .returning();

  if (!report) {
    throw { statusCode: 404, message: 'Report not found' };
  }

  return report;
}

export async function rejectReport(id: number) {
  const [report] = await db
    .update(crimeReports)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(eq(crimeReports.id, id))
    .returning();

  if (!report) {
    throw { statusCode: 404, message: 'Report not found' };
  }

  return report;
}

export async function flagReport(reportId: number, userId: number, input: FlagReportInput) {
  const [existing] = await db
    .select()
    .from(crimeReports)
    .where(eq(crimeReports.id, reportId))
    .limit(1);

  if (!existing) {
    throw { statusCode: 404, message: 'Report not found' };
  }

  // Mark the report as flagged
  await db
    .update(crimeReports)
    .set({ status: 'flagged', updatedAt: new Date() })
    .where(eq(crimeReports.id, reportId));

  const [flag] = await db
    .insert(reportFlags)
    .values({
      reportId,
      flaggerId: userId,
      reason: input.reason,
      details: input.details,
      status: 'pending',
    })
    .returning();

  return flag;
}

export async function getUserReports(userId: number) {
  return db
    .select({
      id: crimeReports.id,
      title: crimeReports.title,
      status: crimeReports.status,
      incidentDate: crimeReports.incidentDate,
      createdAt: crimeReports.createdAt,
      category: {
        id: crimeCategories.id,
        name: crimeCategories.name,
        color: crimeCategories.color,
      },
    })
    .from(crimeReports)
    .innerJoin(crimeCategories, eq(crimeReports.categoryId, crimeCategories.id))
    .where(eq(crimeReports.reporterId, userId))
    .orderBy(desc(crimeReports.createdAt));
}
