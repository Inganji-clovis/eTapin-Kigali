import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const allowedStatuses = new Set(['WAITING', 'BOARDED', 'CANCELLED']);

export async function PATCH(
  request: Request,
  context: { params: { requestId: string } }
) {
  try {
    const requestId = context.params.requestId;
    const body = await request.json();
    const status = typeof body.status === 'string' ? body.status.toUpperCase() : '';

    if (!requestId) {
      return NextResponse.json({ error: 'Request id is required.' }, { status: 400 });
    }

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: 'Invalid request status.' }, { status: 400 });
    }

    const existingRequest = await prisma.passengerRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Passenger request not found.' }, { status: 404 });
    }

    const updatedRequest = await prisma.passengerRequest.update({
      where: { id: requestId },
      data: { status },
    });

    return NextResponse.json({
      id: updatedRequest.id,
      status: updatedRequest.status,
    });
  } catch (error) {
    console.error('Error updating passenger request:', error);
    return NextResponse.json(
      { error: 'Failed to update passenger request.' },
      { status: 500 }
    );
  }
}
