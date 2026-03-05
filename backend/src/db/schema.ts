import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);
export const reportStatusEnum = pgEnum('report_status', [
  'pending',
  'verified',
  'flagged',
  'rejected',
  'archived',
]);
export const flagStatusEnum = pgEnum('flag_status', ['pending', 'reviewed', 'dismissed']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Crime categories table
export const crimeCategories = pgTable('crime_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
  severity: integer('severity').notNull(),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Crime reports table
export const crimeReports = pgTable(
  'crime_reports',
  {
    id: serial('id').primaryKey(),
    reporterId: integer('reporter_id').references(() => users.id),
    categoryId: integer('category_id')
      .references(() => crimeCategories.id)
      .notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
    address: text('address'),
    neighborhood: varchar('neighborhood', { length: 255 }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    incidentDate: timestamp('incident_date').notNull(),
    status: reportStatusEnum('status').default('pending').notNull(),
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    photoPaths: text('photo_paths').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    verifiedAt: timestamp('verified_at'),
    verifiedBy: integer('verified_by').references(() => users.id),
  },
  (table) => ({
    latLngIdx: index('crime_reports_lat_lng_idx').on(table.latitude, table.longitude),
    statusIdx: index('crime_reports_status_idx').on(table.status),
    incidentDateIdx: index('crime_reports_incident_date_idx').on(table.incidentDate),
    categoryIdx: index('crime_reports_category_idx').on(table.categoryId),
  }),
);

// Report flags table
export const reportFlags = pgTable('report_flags', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id')
    .references(() => crimeReports.id)
    .notNull(),
  flaggerId: integer('flagger_id').references(() => users.id),
  reason: varchar('reason', { length: 255 }).notNull(),
  details: text('details'),
  status: flagStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
});

// Types inferred from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CrimeCategory = typeof crimeCategories.$inferSelect;
export type NewCrimeCategory = typeof crimeCategories.$inferInsert;
export type CrimeReport = typeof crimeReports.$inferSelect;
export type NewCrimeReport = typeof crimeReports.$inferInsert;
export type ReportFlag = typeof reportFlags.$inferSelect;
export type NewReportFlag = typeof reportFlags.$inferInsert;

// Custom type for PostGIS location (used in raw SQL)
export const createLocationSQL = (lat: number, lng: number) =>
  sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
