import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type DriverStopDemand = {
  stationId: string;
  name: string;
  order: number;
  waitingCount: number;
  isCurrentBusStop: boolean;
};

export type DriverRouteSummary = {
  id: string;
  name: string;
  description: string | null;
  totalWaiting: number;
  activeBuses: number;
  currentStations: string[];
  buses: Array<{
    id: string;
    currentStationName: string;
    nextStationName: string;
  }>;
  stops: DriverStopDemand[];
  hotspots: DriverStopDemand[];
};

export type DriverRecentRequest = {
  id: string;
  originName: string;
  destinationName: string;
  timestamp: string;
  status: string;
  recommendedRoutes: string[];
};

export type DriverDashboardData = {
  generatedAt: string;
  totalWaitingRequests: number;
  routeSummaries: DriverRouteSummary[];
  recentRequests: DriverRecentRequest[];
};

type WaitingRequestForDashboard = {
  id: string;
  stationId: string;
  destinationId: string | null;
};

type RouteStopForDashboard = {
  stationId: string;
  order: number;
};

function canRouteServeRequest(
  routeStops: RouteStopForDashboard[],
  request: WaitingRequestForDashboard
) {
  if (!request.destinationId) {
    return false;
  }

  const originStop = routeStops.find(stop => stop.stationId === request.stationId);
  const destinationStop = routeStops.find(
    stop => stop.stationId === request.destinationId
  );

  return Boolean(originStop && destinationStop && originStop.order < destinationStop.order);
}

export async function getDriverDashboardData(): Promise<DriverDashboardData> {
  const [routes, waitingRequests] = await Promise.all([
    prisma.route.findMany({
      include: {
        buses: {
          where: { active: true },
          include: {
            currentStation: true,
          },
        },
        stops: {
          include: {
            station: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.passengerRequest.findMany({
      where: {
        status: 'WAITING',
      },
      include: {
        station: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    }),
  ]);

  const destinationIds = Array.from(
    new Set(
      waitingRequests
        .map(request => request.destinationId)
        .filter((value): value is string => Boolean(value))
    )
  );

  const destinationStations = destinationIds.length
    ? await prisma.station.findMany({
        where: {
          id: {
            in: destinationIds,
          },
        },
      })
    : [];

  const destinationNameById = new Map(
    destinationStations.map(station => [station.id, station.name])
  );

  const routeSummaries = routes
    .filter(route => route.buses.length > 0)
    .map(route => {
      const routeWaitingRequests = waitingRequests.filter(request =>
        canRouteServeRequest(route.stops, request)
      );
      const routeWaitingByStationId = routeWaitingRequests.reduce<Record<string, number>>(
        (acc, request) => {
          acc[request.stationId] = (acc[request.stationId] || 0) + 1;
          return acc;
        },
        {}
      );
      const stopDemand = route.stops
        .map(stop => ({
          stationId: stop.station.id,
          name: stop.station.name,
          order: stop.order,
          waitingCount: routeWaitingByStationId[stop.station.id] || 0,
          isCurrentBusStop: route.buses.some(
            bus => bus.currentStation?.id === stop.station.id
          ),
        }))
        .filter(stop => stop.waitingCount > 0 || stop.isCurrentBusStop);

      const totalWaiting = routeWaitingRequests.length;

      return {
        id: route.id,
        name: route.name,
        description: route.description,
        totalWaiting,
        activeBuses: route.buses.length,
        currentStations: route.buses
          .map(bus => bus.currentStation?.name)
          .filter((value): value is string => Boolean(value)),
        buses: route.buses.map(bus => {
          const currentStopIndex = route.stops.findIndex(
            stop => stop.stationId === bus.currentStationId
          );
          const nextStop =
            currentStopIndex >= 0
              ? route.stops[(currentStopIndex + 1) % route.stops.length]
              : route.stops[0];

          return {
            id: bus.id,
            currentStationName: bus.currentStation?.name || 'Current stop unknown',
            nextStationName: nextStop?.station.name || 'Next stop unknown',
          };
        }),
        stops: route.stops.map(stop => ({
          stationId: stop.station.id,
          name: stop.station.name,
          order: stop.order,
          waitingCount: routeWaitingByStationId[stop.station.id] || 0,
          isCurrentBusStop: route.buses.some(
            bus => bus.currentStation?.id === stop.station.id
          ),
        })),
        hotspots: stopDemand.sort((a, b) => b.waitingCount - a.waitingCount),
      };
    });

  const recentRequests = waitingRequests.slice(0, 10).map(request => {
    const recommendedRoutes = routes
      .filter(route => route.buses.length > 0)
      .filter(route => {
        const originStop = route.stops.find(stop => stop.stationId === request.stationId);
        const destinationStop = route.stops.find(
          stop => stop.stationId === request.destinationId
        );

        return originStop && destinationStop && originStop.order < destinationStop.order;
      })
      .map(route => route.name);

    return {
      id: request.id,
      originName: request.station.name,
      destinationName:
        destinationNameById.get(request.destinationId ?? '') || 'Destination unknown',
      timestamp: request.timestamp.toISOString(),
      status: request.status,
      recommendedRoutes,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalWaitingRequests: waitingRequests.length,
    routeSummaries,
    recentRequests,
  };
}
