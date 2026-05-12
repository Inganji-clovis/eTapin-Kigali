# eTapin Kigali Documentation

## 1. Project Overview

eTapin Kigali is a smart public transport MVP built for Kigali city travel coordination. The current implementation focuses on a complete passenger-to-driver demand loop:

- Passenger selects origin and destination
- System returns matching active route(s)
- Passenger submits a waiting request
- Driver dashboard aggregates demand by route and stop
- Driver marks requests as boarded/cleared
- Driver can advance bus position stop-by-stop for live simulation

The product is designed to prove the core demand signaling model before scaling to production-grade transport operations.

---

## 2. Tech Stack

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Framer Motion (UI animation)
- Lucide React (icons)

### Backend

- Next.js Route Handlers (`src/app/api/**`)
- Prisma ORM
- SQLite database (`prisma/dev.db`)

### Tooling

- ESLint (Next config)
- Prisma seed scripts
- TSX for seed execution

---

## 3. Repository Structure

```text
src/
  app/
    page.tsx                         # Landing page
    passenger/page.tsx               # Passenger portal page
    driver/page.tsx                  # Driver portal page
    api/
      stations/route.ts              # Stations endpoint
      routes/route.ts                # Route search endpoint
      passenger-requests/route.ts    # Create passenger request
      passenger-requests/[requestId]/route.ts  # Update passenger request status
      driver-dashboard/route.ts      # Driver dashboard payload
      buses/[busId]/advance/route.ts # Simulate next-stop movement
  components/
    PassengerForm.tsx                # Passenger flow UI logic
    DriverDashboard.tsx              # Driver board UI logic
  lib/
    driverDashboard.ts               # Aggregation logic for driver view

prisma/
  schema.prisma                      # Data model
  seed.ts                            # Demo seed data
```

---

## 4. Core User Roles and Flows

## Passenger Flow

1. Passenger opens `/` (landing page)
2. Optionally searches a station from hero search input
3. Navigates to `/passenger` with optional `originId` prefill
4. Selects origin and destination
5. Searches matching routes
6. Expands route details and submits passenger request
7. Optionally cancels submitted request

## Driver Flow

1. Driver opens `/driver`
2. Dashboard loads route pressure summaries
3. Driver sees waiting counts per route and stop
4. Driver marks request as `BOARDED` or `CANCELLED`
5. Driver advances a bus to next route stop for simulation
6. Dashboard refreshes every 20 seconds (and manual refresh is available)

---

## 5. Detailed Feature Inventory (Current)

## 5.1 Landing Page Features

- Multilingual hero copy: English, Kinyarwanda, French, Swahili
- Station-aware hero search with:
  - exact name match
  - partial name match
  - datalist suggestion support
- Quick entry points:
  - Passenger route finder
  - Driver demand board
- Route prefill support to passenger page via query string

## 5.2 Passenger Portal Features

- Origin and destination selectors grouped by:
  - major hubs
  - bus stops
- Duplicate station prevention (cannot choose same station in both fields)
- Async station loading with fallback error message
- Route search with loading and error state handling
- Route cards with:
  - route metadata
  - bus current station context
  - stop-by-stop visual tracker
  - travel insight text (bus before origin, at origin, between origin and destination, beyond destination)
- Expand/collapse route details per card
- Passenger request creation per route panel
- Passenger request cancellation
- Per-route request status feedback:
  - submitting
  - done
  - cancelling
  - cancelled

## 5.3 Driver Dashboard Features

- Real-time-ish board behavior with:
  - auto refresh every 20 seconds
  - manual refresh button
- KPI tiles:
  - total waiting requests
  - active buses
  - route count on board
  - highest-pressure route
- Per-route operational cards:
  - active bus count
  - current station list
  - per-bus current and next stop
  - next-stop control button
  - stop chips with waiting count and current-bus marker
  - priority hotspot list sorted by demand
- Waiting requests side panel:
  - origin, destination, timestamp
  - route recommendations
  - quick action buttons (Boarded/Clear)

## 5.4 API and Backend Features

- Station catalog serving grouped response (hubs vs stops)
- Route-matching logic requiring:
  - origin present on route
  - destination present on route
  - origin order before destination
  - at least one active bus on route
- Passenger request validation:
  - origin required
  - destination required
  - origin and destination must differ
  - station existence verification
  - route viability verification
- Passenger request status transitions via PATCH endpoint
- Driver dashboard aggregator for route summaries and hotspots
- Bus advancement simulation with circular route progression

## 5.5 Data Features

- Structured route-stop sequencing model (`order` field)
- Active/inactive bus support
- Hub vs stop classification
- Destination-aware passenger demand tracking
- Timestamped request records for chronological views

---

## 6. Database Model Documentation

## Station

Represents both major bus hubs and regular stops.

Fields:

- `id`: unique station id
- `name`: station name
- `latitude`: geo coordinate
- `longitude`: geo coordinate
- `placeId`: optional external place reference
- `isHub`: hub classification flag

Relations:

- has many `RouteStop`
- has many `PassengerRequest` (as origin)
- has many `Bus` (as current position)

## Route

Represents a transport line.

Fields:

- `id`
- `name` (for example Route 201)
- `description`

Relations:

- has many ordered `RouteStop`
- has many `Bus`

## RouteStop

Join model mapping station sequence on a route.

Fields:

- `id`
- `routeId`
- `stationId`
- `order` (stop sequence)

Constraints:

- unique pair: `routeId + stationId`

## PassengerRequest

Demand signal from passenger for a specific origin and destination.

Fields:

- `id`
- `stationId` (origin)
- `destinationId`
- `status` (`WAITING`, `BOARDED`, `CANCELLED`)
- `timestamp`

## Bus

Operational bus entity assigned to a route.

Fields:

- `id`
- `routeId`
- `currentStationId`
- `capacity`
- `active`

---

## 7. API Reference

All endpoints are served under `/api`.

## 7.1 GET /api/stations

Returns all stations grouped by hub type.

Success response:

```json
{
  "hubs": [{ "id": "...", "name": "Nyabugogo Bus Park", "isHub": true }],
  "stops": [{ "id": "...", "name": "Gishushu", "isHub": false }]
}
```

Error:

- `500` on server/database failure

## 7.2 GET /api/routes?originId=...&destinationId=...

Returns active routes that can serve the passenger direction from origin to destination.

Validation:

- `originId` required
- `destinationId` required

Behavior:

- filters out routes without active buses
- filters out routes where origin comes after destination

Errors:

- `400` when query params missing
- `500` on server/database failure

## 7.3 POST /api/passenger-requests

Creates a waiting request.

Request body:

```json
{
  "originId": "station-id",
  "destinationId": "station-id"
}
```

Success response:

```json
{
  "requestId": "...",
  "waitingCount": 3,
  "originName": "Nyabugogo Bus Park",
  "destinationName": "Kimironko Bus Park",
  "message": "Passenger request created successfully."
}
```

Validation and errors:

- `400` missing origin/destination
- `400` origin equals destination
- `404` station not found
- `422` no active route can serve direction
- `500` server/database failure

## 7.4 PATCH /api/passenger-requests/[requestId]

Updates request status.

Request body:

```json
{
  "status": "BOARDED"
}
```

Allowed statuses:

- `WAITING`
- `BOARDED`
- `CANCELLED`

Success response:

```json
{
  "id": "...",
  "status": "BOARDED"
}
```

Errors:

- `400` missing request id
- `400` invalid status
- `404` request not found
- `500` server/database failure

## 7.5 GET /api/driver-dashboard

Returns aggregated operational board payload.

Includes:

- generation timestamp
- total waiting requests
- route summaries (waiting, buses, current stops, hotspots)
- recent waiting requests with route recommendations

Errors:

- `500` if aggregation fails

## 7.6 PATCH /api/buses/[busId]/advance

Moves a bus to next stop in route order.

Behavior:

- current stop index located in route stop list
- next stop chosen using circular progression
- if current station unknown, starts from first route stop

Success response:

```json
{
  "id": "...",
  "currentStationId": "...",
  "currentStationName": "Gishushu"
}
```

Errors:

- `400` missing bus id
- `400` route has no configured stops
- `404` bus not found
- `500` server/database failure

---

## 8. Driver Dashboard Aggregation Logic

The dashboard data builder in `src/lib/driverDashboard.ts` performs the following:

1. Fetches routes with active buses and ordered stops
2. Fetches all `WAITING` passenger requests
3. Loads destination station names for lookup
4. Determines route-request compatibility by verifying origin stop order is before destination stop order
5. Computes per-route:
   - total waiting requests
   - waiting counts per stop
   - active bus locations
   - next stop for each bus
   - hotspot ranking by waiting count
6. Builds recent request list with recommended routes

This creates a dispatch-like operational snapshot for the driver UI.

---

## 9. Seed Data and Demo Scenario

The seed script provisions:

- 4 major hubs:
  - Nyabugogo Bus Park
  - Remera Bus Park
  - Kimironko Bus Park
  - Downtown Station
- 6 intermediate stops:
  - KBC (Kimihurura)
  - Gishushu
  - Kisimenti
  - Rwandex
  - Sonatubes
  - Giporoso
- 3 routes:
  - Route 104: Downtown -> KBC -> Gishushu -> Kisimenti -> Remera
  - Route 201: Nyabugogo -> KBC -> Gishushu -> Kimironko
  - Route 305: Downtown -> Rwandex -> Sonatubes -> Giporoso
- 3 active buses with initial positions

This supports immediate simulation of passenger demand and bus movement.

---

## 10. Setup and Runbook

## Prerequisites

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Start development server

```bash
npm run dev
```

## Build production bundle

```bash
npm run build
```

## Seed database

```bash
npx prisma db seed
```

## Notes

- SQLite datasource is configured in Prisma schema (`file:./dev.db`)
- Seed command uses TSX and `.env` support if present

---

## 11. Product Boundaries (Current MVP)

The current implementation intentionally focuses on demo-scale operations.

Current limitations:

- Single-city static seed dataset
- No authentication or role access control
- No persistent real-time socket channel (polling-based refresh)
- No map tile rendering yet (route tracker is UI-only)
- No ETA prediction model
- No payment/ticketing integration
- No route optimization engine
- No admin control panel
- Bus movement is manual simulation

---

## 12. Possible Features and Expansion Roadmap

This section lists practical, high-impact features that can be implemented next.

## 12.1 Passenger Experience Enhancements

- Live map with moving buses and route overlays
- Estimated arrival times (ETA) per stop and per route
- Multi-leg journey planning with transfer suggestions
- Saved places (Home, Work, School)
- Favorite routes and one-tap re-request
- Push notifications:
  - bus approaching origin
  - route delays
  - request accepted/boarded
- Accessibility modes:
  - high-contrast UI
  - voice prompts
  - larger text controls
- Fare estimate and payment integration
- Offline-friendly stop cache for poor-network zones

## 12.2 Driver and Operations Enhancements

- Driver login and vehicle assignment
- Route adherence monitoring (off-route alerts)
- Driver shift management and handover workflows
- Occupancy capture and capacity-aware boarding logic
- Delay reporting with reason tags (traffic, breakdown, weather)
- Automatic hotspot recommendations (AI-assisted dispatch suggestions)
- One-click incident reporting with geotag
- Driver communication channel to control center

## 12.3 Dispatch and Admin Features

- Admin dashboard with system-wide KPIs
- Station-level demand heatmaps
- Real-time fleet overview
- Route creation and stop sequencing tools
- Dynamic route activation/deactivation
- Peak-hour scheduling templates
- SLA tracking (wait time targets)
- Data export for policy and planning teams

## 12.4 Data and Intelligence Features

- Historical analytics on request demand by hour/day/zone
- Demand forecasting model for proactive fleet distribution
- Congestion-aware route recommendations
- Anomaly detection (unexpected demand spikes)
- Stop quality scoring (response time, load balancing)
- A/B testing for UI and dispatch interventions

## 12.5 Platform and Engineering Features

- Authentication and authorization (passenger/driver/admin roles)
- Audit logs for operational actions
- API versioning and OpenAPI spec generation
- Background jobs for periodic aggregation and alerts
- Observability stack (logs, metrics, tracing)
- CI/CD pipeline and environment strategy
- Rate limiting and abuse protection
- Comprehensive test suites:
  - unit tests
  - API integration tests
  - end-to-end browser flows

## 12.6 Integration Features

- Integration with city transport feeds (GTFS/GTFS-Realtime)
- Mobile app clients (Android/iOS)
- SMS/USSD fallback for low-smartphone coverage
- Mobile money and card payment gateways
- Third-party navigation APIs for travel-time estimation
- Incident and emergency broadcast integration

---

## 13. Recommended Next Implementation Milestones

## Milestone 1: Reliability and Security

- Introduce auth and role-based access
- Add input validation schemas
- Add API rate limiting
- Add structured logging and error tracing

## Milestone 2: Real-Time Visibility

- Replace polling with WebSocket/SSE updates
- Add map-based visualization
- Add automatic bus telemetry ingestion

## Milestone 3: Intelligence Layer

- Build ETA engine
- Build demand prediction
- Add dispatch recommendation engine

## Milestone 4: Scale and Governance

- Introduce admin tooling and analytics warehouse
- Add multi-route/multi-city configuration support
- Publish API contracts and SDKs

---

## 14. Glossary

- Hub: Major station with high transfer activity
- Stop: Intermediate boarding/alighting point
- WAITING: Passenger request is active and pending pickup
- BOARDED: Passenger request is fulfilled
- CANCELLED: Passenger request is withdrawn or cleared
- Hotspot: Stop with relatively high waiting demand

---

## 15. Conclusion

eTapin Kigali already demonstrates the core transport-demand feedback loop in a clear and testable MVP. It provides a strong foundation for Kigali-focused transit digitization and can evolve into a real-time, city-scale operational platform by incrementally adding authentication, telemetry, mapping, prediction, and admin orchestration.
