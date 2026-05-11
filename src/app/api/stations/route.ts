import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    const hubs = stations.filter(s => s.isHub);
    const stops = stations.filter(s => !s.isHub);

    return NextResponse.json({ hubs, stops });
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}
