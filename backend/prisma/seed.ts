/**
 * Prisma seed script — restaurant_locations
 *
 * Run with:
 *   npx tsx prisma/seed.ts
 *
 * Seeds the initial restaurant GPS location used for customer geofencing.
 * Safe to re-run: uses upsert so it won't create duplicates.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Seeding restaurant_locations …');

  // Deactivate any pre-existing rows first
  await prisma.restaurantLocation.updateMany({
    where: { active: true },
    data: { active: false },
  });

  const location = await prisma.restaurantLocation.create({
    data: {
      name: 'Main Branch',
      latitude: 10.762622,   // ← update to your real latitude
      longitude: 106.660172, // ← update to your real longitude
      radius_meters: 50,
      geofence_enabled: true,
      active: true,
    },
  });

  console.log(`✅  Created restaurant location [id=${location.id}]:`);
  console.log(`    name             : ${location.name}`);
  console.log(`    latitude         : ${location.latitude}`);
  console.log(`    longitude        : ${location.longitude}`);
  console.log(`    radius_meters    : ${location.radius_meters}`);
  console.log(`    geofence_enabled : ${location.geofence_enabled}`);

}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
