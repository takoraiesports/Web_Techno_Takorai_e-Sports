# University E-Sports Club Web Portal

A comprehensive, modern, scalable E-Sports Club Web Portal for a university.

## Tech Stack

- **Frontend**: Next.js App Router, React, TypeScript, responsive custom CSS
- **Backend**: Golang 1.27+ (Gin Web Framework, GORM ORM, Gorilla WebSockets)
- **Database**: PostgreSQL 16 (Relational DB with GORM auto-migrations)
- **Cache & Pub/Sub**: Redis 7 (Session cache, Rate Limiting, Live score Pub/Sub)
- **Object Storage**: S3 / MinIO (Student ID verification cards, team logos, game banners)
- **Real-Time Communication**: WebSockets (`/ws`) for live match score updates, tournament bracket changes & instant notifications

---

## Monorepo Architecture

```
e-sports/
├── apps/
│   ├── frontend/         ← Next.js App Router (Arena Campus UI)
│   └── backend/          ← Golang 1.27+ (Gin, GORM, WebSockets)
│       ├── cmd/
│       │   └── server/   ← Entrypoint main.go
│       ├── internal/
│       │   ├── config/   ← Environment loader (.env)
│       │   ├── domain/   ← Models, structs & DTOs
│       │   ├── handler/  ← Gin REST API Handlers & Routers
│       │   ├── middleware/ ← JWT Auth, CORS & Logging
│       │   ├── repository/ ← PostgreSQL (GORM) & Redis
│       │   ├── service/  ← Domain Business Logic
│       │   ├── storage/  ← AWS S3 / MinIO File Uploader
│       │   └── websocket/ ← Real-Time Score & Bracket Hub
│       ├── Dockerfile
│       ├── package.json  ← Workspace scripts for Go tools
│       ├── go.mod
│       └── go.sum
├── docker/
│   ├── docker-compose.yml ← Postgres, Redis, MinIO S3 & Go Backend
│   └── .env
└── packages/
    └── shared/           ← Shared TypeScript types & Enums for Frontend
```

---

## API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/health` | Server Health Status | No |
| GET | `/ws` | Real-Time WebSocket Connection | No |
| POST | `/api/v1/auth/register` | Register New Student / Player | No |
| POST | `/api/v1/auth/login` | Login & Obtain JWT | No |
| GET | `/api/v1/games` | List Active E-Sports Games | No |
| POST | `/api/v1/games` | Add New Game | Yes (Admin) |
| GET | `/api/v1/tournaments` | List All Tournaments | No |
| GET | `/api/v1/tournaments/:id` | Tournament Details & Matches | No |
| GET | `/api/v1/teams` | List E-Sports Teams | No |
| POST | `/api/v1/teams` | Create New Team | Yes |
| POST | `/api/v1/matches/score` | Update Live Match Score & Broadcast WS | Yes |
| POST | `/api/v1/upload` | Upload Image / File to S3 Storage | Yes |

---

## Getting Started

### 1. Install dependencies and start the frontend
```bash
npm install
npm run dev:frontend
```

The site runs at `http://localhost:3000`. To use a different backend URL, copy
`apps/frontend/.env.example` to `apps/frontend/.env.local` and edit
`NEXT_PUBLIC_API_URL`. The default backend address is `http://localhost:8080`.

### Vercel frontend + separately hosted Go API

For the existing Vercel site, set `NEXT_PUBLIC_API_URL` in the Vercel project to the public
HTTPS base URL of the deployed Go backend (for example `https://api.your-domain.example`, with
no `/api/v1` suffix), then redeploy the frontend. On the backend, set `FRONTEND_URLS` to the
exact frontend origin `https://ttes-club.vercel.app` (and any other production domains that
should be allowed). Keep `FRONTEND_URL` set to its primary HTTPS origin. The frontend will no
longer silently send production traffic to `localhost` when the API URL is missing.

On backend startup, the database adds the competitive game catalog when a slug is not already
present. It includes the official Esports Nations Cup 2026 title lineup and additional established
regional esports titles. Existing team, tournament, result, and store records are not generated.

The frontend uses a minimal white, orange, and black theme. Products come from the backend
database; the catalog starts empty so an administrator can add verified items, prices, variants,
images, and stock after deployment. Orders and payments are intentionally unavailable until a
real payment and fulfillment flow is configured. Other sections show live API data or an empty
state; they do not insert demonstration records.

### 2. Run Infrastructure with Docker Compose
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Run Go Backend Locally
```bash
cd apps/backend
go run ./cmd/server
```

Server runs on: `http://localhost:8080`
WebSocket endpoint: `ws://localhost:8080/ws`

### 4. Build and typecheck
```bash
npm run typecheck
npm run build:frontend
```

## Production deployment (Docker on a VPS)

1. Point both `DOMAIN` and `api.DOMAIN` DNS records to the VPS public IP and allow inbound TCP
   ports 80 and 443.
2. Copy `docker/.env.production.example` to `docker/.env.production`. Replace every `REPLACE_...`
   value with a unique, randomly generated secret. Set a real initial admin email and username.
3. Start the services from the repository root:

   ```bash
   docker compose --env-file docker/.env.production -f docker/docker-compose.production.yml up -d --build
   ```

   Caddy obtains HTTPS certificates. PostgreSQL, Redis, and MinIO are only exposed on the private
   Compose network. Persistent volumes hold application data; configure off-host backups before
   relying on the server for club records.
4. Sign in with the one-time initial administrator account, add real games/products, then remove
   `INITIAL_ADMIN_PASSWORD` from the server environment and restart the backend.

The storefront has no sample products and does not place orders. The admin catalog supports real
product details, variants, stock, and image URLs. Image URLs must be publicly reachable HTTPS URLs;
uploading product images through the admin interface is not yet wired to a public media endpoint.
Payment, shipping/pickup fulfillment, tournament registration, bracket generation, and dispute
resolution still need their production workflows before those features can be offered. CI checks
frontend type/build and backend test/vet/build on pushes and pull requests.
