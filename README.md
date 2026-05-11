# eTapin

Smart public transport MVP for Kigali. The app currently focuses on a complete passenger-to-driver demand loop:

- passengers search a route from their current station to a destination
- matching routes show active bus position and stop-by-stop progress
- passengers can submit or cancel a waiting request
- drivers see demand pressure by route and stop
- drivers can mark requests as boarded or clear them
- drivers can advance demo buses to the next stop to simulate live movement

## Run Locally

```bash
npm install
npm run dev
```

If port `3000` is busy, Next.js will use another port such as `3001`.

## Useful Commands

```bash
npm run build
npx prisma db seed
```

## Demo Flow

1. Open `/`.
2. Type a station such as `Nyabugogo Bus Park` in the hero search and submit.
3. Choose a destination such as `Kimironko Bus Park`.
4. Search for a route, expand the result, and send a passenger request.
5. Open `/driver` to see the demand appear on the driver board.
6. Use `Next stop` to move a bus through its route.
7. Mark passenger requests as `Boarded` or `Clear`.

## Main Routes

- `/` landing page and station search
- `/passenger` passenger route finder
- `/driver` driver demand board
- `/api/stations` station data
- `/api/routes` matching route search
- `/api/passenger-requests` passenger demand creation
- `/api/passenger-requests/[requestId]` passenger demand status update
- `/api/buses/[busId]/advance` demo bus movement

## Current Data

The Prisma seed creates Kigali stations, three demo routes, and active buses:

- Route 104: Downtown to Remera via KBC
- Route 201: Nyabugogo to Kimironko via Gishushu
- Route 305: Downtown to Sonatubes via Rwandex
