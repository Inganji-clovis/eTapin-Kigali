import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  _request: Request,
  context: { params: { busId: string } }
) {
  try {
    const busId = context.params.busId;

    if (!busId) {
      return NextResponse.json({ error: 'Bus id is required.' }, { status: 400 });
    }

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        route: {
          include: {
            stops: {
              include: {
                station: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found.' }, { status: 404 });
    }

    if (!bus.route.stops.length) {
      return NextResponse.json(
        { error: 'This bus route does not have stops configured.' },
        { status: 400 }
      );
    }

    const currentStopIndex = bus.route.stops.findIndex(
      stop => stop.stationId === bus.currentStationId
    );
    const nextStop =
      currentStopIndex >= 0
        ? bus.route.stops[(currentStopIndex + 1) % bus.route.stops.length]
        : bus.route.stops[0];

    const updatedBus = await prisma.bus.update({
      where: { id: busId },
      data: {
        currentStationId: nextStop.stationId,
      },
      include: {
        currentStation: true,
      },
    });

    return NextResponse.json({
      id: updatedBus.id,
      currentStationId: updatedBus.currentStationId,
      currentStationName: updatedBus.currentStation?.name ?? 'Current stop unknown',
    });
  } catch (error) {
    console.error('Error advancing bus:', error);
    return NextResponse.json(
      { error: 'Failed to advance bus.' },
      { status: 500 }
    );
  }
}
