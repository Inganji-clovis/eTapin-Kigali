import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originId = searchParams.get('originId');
  const destinationId = searchParams.get('destinationId');

  if (!originId || !destinationId) {
    return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 });
  }

  try {
    // Find all routes that contain BOTH the origin and destination station
    // and have at least one active bus assigned.
    const routes = await prisma.route.findMany({
      where: {
        AND: [
          { stops: { some: { stationId: originId } } },
          { stops: { some: { stationId: destinationId } } },
          { buses: { some: { active: true } } }
        ]
      },
      include: {
        buses: {
          where: { active: true },
          include: {
            currentStation: true
          }
        },
        stops: {
          include: {
            station: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    // Filter routes to ensure the origin comes BEFORE the destination in the order
    const validRoutes = routes.filter(route => {
      const originStop = route.stops.find(stop => stop.stationId === originId);
      const destStop = route.stops.find(stop => stop.stationId === destinationId);
      
      // Valid if both exist and origin is before destination
      return originStop && destStop && originStop.order < destStop.order;
    });

    return NextResponse.json(validRoutes);
  } catch (error) {
    console.error('Error fetching transit routes:', error);
    return NextResponse.json({ error: 'Failed to fetch transit routes' }, { status: 500 });
  }
}
