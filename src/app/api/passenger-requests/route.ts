import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const originId = typeof body.originId === 'string' ? body.originId : '';
    const destinationId = typeof body.destinationId === 'string' ? body.destinationId : '';

    if (!originId || !destinationId) {
      return NextResponse.json(
        { error: 'Origin and destination are required.' },
        { status: 400 }
      );
    }

    if (originId === destinationId) {
      return NextResponse.json(
        { error: 'Origin and destination must be different.' },
        { status: 400 }
      );
    }

    const [originStation, destinationStation] = await Promise.all([
      prisma.station.findUnique({ where: { id: originId } }),
      prisma.station.findUnique({ where: { id: destinationId } }),
    ]);

    if (!originStation || !destinationStation) {
      return NextResponse.json(
        { error: 'One or more selected stations could not be found.' },
        { status: 404 }
      );
    }

    const matchingRoute = await prisma.route.findFirst({
      where: {
        AND: [
          { stops: { some: { stationId: originId } } },
          { stops: { some: { stationId: destinationId } } },
          { buses: { some: { active: true } } },
        ],
      },
      include: {
        stops: true,
      },
    });

    const originStop = matchingRoute?.stops.find(stop => stop.stationId === originId);
    const destinationStop = matchingRoute?.stops.find(
      stop => stop.stationId === destinationId
    );

    if (!originStop || !destinationStop || originStop.order >= destinationStop.order) {
      return NextResponse.json(
        { error: 'No active route can serve this origin and destination.' },
        { status: 422 }
      );
    }

    const passengerRequest = await prisma.passengerRequest.create({
      data: {
        stationId: originId,
        destinationId,
      },
    });

    const waitingCount = await prisma.passengerRequest.count({
      where: {
        stationId: originId,
        destinationId,
        status: 'WAITING',
      },
    });

    return NextResponse.json({
      requestId: passengerRequest.id,
      waitingCount,
      originName: originStation.name,
      destinationName: destinationStation.name,
      message: 'Passenger request created successfully.',
    });
  } catch (error) {
    console.error('Error creating passenger request:', error);
    return NextResponse.json(
      { error: 'Failed to create passenger request.' },
      { status: 500 }
    );
  }
}
