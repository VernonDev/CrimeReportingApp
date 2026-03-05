import { db, pool } from './index';
import { crimeCategories, users } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  // Seed crime categories
  await db
    .insert(crimeCategories)
    .values([
      { name: 'Theft', description: 'Stealing of property', severity: 3, color: '#FF6B6B', icon: 'theft' },
      { name: 'Assault', description: 'Physical attack on a person', severity: 5, color: '#DC143C', icon: 'assault' },
      { name: 'Vandalism', description: 'Damage to property', severity: 2, color: '#FFA500', icon: 'vandalism' },
      { name: 'Vehicle Crime', description: 'Car theft or break-ins', severity: 3, color: '#4ECDC4', icon: 'vehicle' },
      { name: 'Robbery', description: 'Theft using force or threats', severity: 5, color: '#8B0000', icon: 'robbery' },
      { name: 'Suspicious Activity', description: 'Suspicious behaviour or persons', severity: 1, color: '#FFD700', icon: 'suspicious' },
      { name: 'Drug Activity', description: 'Drug use or dealing', severity: 3, color: '#9370DB', icon: 'drug' },
      { name: 'Other', description: 'Other types of crime', severity: 2, color: '#808080', icon: 'other' },
    ])
    .onConflictDoNothing();

  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await db
    .insert(users)
    .values({
      email: 'admin@local.dev',
      username: 'admin',
      passwordHash,
      role: 'admin',
    })
    .onConflictDoNothing();

  console.log('Seeding complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
