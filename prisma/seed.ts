import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding with expanded Kigali data...');

  // 1. Clear existing data
  await prisma.routeStop.deleteMany();
  await prisma.passengerRequest.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.route.deleteMany();
  await prisma.station.deleteMany();

  // 2. Create Kigali Bus Hubs (Major Stations)
  console.log('Creating Kigali Bus Hubs...');
  const nyabugogo = await prisma.station.create({ data: { name: 'Nyabugogo Bus Park', latitude: -1.9366, longitude: 30.0536, placeId: 'hub_nyabugogo', isHub: true } });
  const remera = await prisma.station.create({ data: { name: 'Remera Bus Park', latitude: -1.9572, longitude: 30.1177, placeId: 'hub_remera', isHub: true } });
  const kimironko = await prisma.station.create({ data: { name: 'Kimironko Bus Park', latitude: -1.9402, longitude: 30.1261, placeId: 'hub_kimironko', isHub: true } });
  const downtown = await prisma.station.create({ data: { name: 'Downtown Station', latitude: -1.9441, longitude: 30.0619, placeId: 'hub_downtown', isHub: true } });

  // 3. Create Intermediate Bus Stops
  console.log('Creating Intermediate Bus Stops...');
  const kbc = await prisma.station.create({ data: { name: 'KBC (Kimihurura)', latitude: -1.954, longitude: 30.090, placeId: 'stop_kbc', isHub: false } });
  const gishushu = await prisma.station.create({ data: { name: 'Gishushu', latitude: -1.953, longitude: 30.100, placeId: 'stop_gishushu', isHub: false } });
  const kisimenti = await prisma.station.create({ data: { name: 'Kisimenti', latitude: -1.958, longitude: 30.112, placeId: 'stop_kisimenti', isHub: false } });
  const rwandex = await prisma.station.create({ data: { name: 'Rwandex', latitude: -1.960, longitude: 30.080, placeId: 'stop_rwandex', isHub: false } });
  const sonatubes = await prisma.station.create({ data: { name: 'Sonatubes', latitude: -1.968, longitude: 30.108, placeId: 'stop_sonatubes', isHub: false } });
  const giporoso = await prisma.station.create({ data: { name: 'Giporoso', latitude: -1.965, longitude: 30.120, placeId: 'stop_giporoso', isHub: false } });

  // 4. Create Routes
  console.log('Creating Transit Routes...');
  const route104 = await prisma.route.create({ data: { name: 'Route 104', description: 'Downtown to Remera via KBC' } });
  const route201 = await prisma.route.create({ data: { name: 'Route 201', description: 'Nyabugogo to Kimironko via Gishushu' } });
  const route305 = await prisma.route.create({ data: { name: 'Route 305', description: 'Downtown to Sonatubes via Rwandex' } });

  // 5. Map Stations/Stops to Routes (RouteStops)
  console.log('Mapping Stops to Routes...');
  
  // Route 104 (Downtown -> KBC -> Gishushu -> Kisimenti -> Remera)
  await prisma.routeStop.createMany({
    data: [
      { routeId: route104.id, stationId: downtown.id, order: 1 },
      { routeId: route104.id, stationId: kbc.id, order: 2 },
      { routeId: route104.id, stationId: gishushu.id, order: 3 },
      { routeId: route104.id, stationId: kisimenti.id, order: 4 },
      { routeId: route104.id, stationId: remera.id, order: 5 },
    ]
  });

  // Route 201 (Nyabugogo -> KBC -> Gishushu -> Kimironko)
  await prisma.routeStop.createMany({
    data: [
      { routeId: route201.id, stationId: nyabugogo.id, order: 1 },
      { routeId: route201.id, stationId: kbc.id, order: 2 },
      { routeId: route201.id, stationId: gishushu.id, order: 3 },
      { routeId: route201.id, stationId: kimironko.id, order: 4 },
    ]
  });

  // Route 305 (Downtown -> Rwandex -> Sonatubes -> Giporoso)
  await prisma.routeStop.createMany({
    data: [
      { routeId: route305.id, stationId: downtown.id, order: 1 },
      { routeId: route305.id, stationId: rwandex.id, order: 2 },
      { routeId: route305.id, stationId: sonatubes.id, order: 3 },
      { routeId: route305.id, stationId: giporoso.id, order: 4 },
    ]
  });

  // 6. Create some active buses
  console.log('Deploying Buses...');
  await prisma.bus.create({ data: { routeId: route104.id, currentStationId: gishushu.id, capacity: 30, active: true } });
  await prisma.bus.create({ data: { routeId: route201.id, currentStationId: nyabugogo.id, capacity: 40, active: true } });
  await prisma.bus.create({ data: { routeId: route305.id, currentStationId: rwandex.id, capacity: 35, active: true } });

  console.log('Seeding completely finished. Expanded Kigali data is live.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
