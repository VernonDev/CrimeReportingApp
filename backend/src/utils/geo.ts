import { sql } from 'drizzle-orm';

export function createPoint(lat: number, lng: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

export function withinBounds(neLat: number, neLng: number, swLat: number, swLng: number) {
  return sql`ST_Within(
    ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326),
    ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
  )`;
}
