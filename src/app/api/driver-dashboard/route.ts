import { NextResponse } from 'next/server';
import { getDriverDashboardData } from '@/lib/driverDashboard';

export async function GET() {
  try {
    const data = await getDriverDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error building driver dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to load driver dashboard.' },
      { status: 500 }
    );
  }
}
