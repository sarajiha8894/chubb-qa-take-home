# Demo App — Insurance Claims Management

A three-tier microservices application used as a QA assessment platform. The app is fully functional and ships with unit tests. The QA team's task is to extend test coverage across all layers — integration, contract, E2E, load, and beyond.

---

## Architecture

![Architecture](ss-demo-app.png)

| Tier | Technology | Port |
|------|-----------|------|
| UI | Next.js 16 + React 19 | 3001 |
| BFF | Spring Boot 4 + Java 21 | 8090 |
| Claims Service | Spring Boot 4 + Java 21 | 8080 |
| Auth | Keycloak 26 (OAuth2/OIDC) | 8180 |
| Database | PostgreSQL 15 | 5432 |
| Cache | Redis 7 | 6379 |
| Event Streaming | Apache Kafka | 9092 |
| Kafka UI | provectuslabs/kafka-ui | 9093 |
| CDC (optional) | Debezium 2.4 | 8083 |

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

---

## Prerequisites

| Tool | Min version | Check | Install |
|------|-------------|-------|---------|
| **Docker Desktop** | 24+ | `docker --version` | https://docs.docker.com/get-docker/ |
| **Java (JDK)** | 21 | `java -version` | https://adoptium.net |
| **Maven** | 3.9+ | `mvn -version` | https://maven.apache.org/download.cgi |
| **Node.js** | 20+ | `node --version` | https://nodejs.org |

> **macOS:** `brew install --cask docker && brew install temurin@21 maven node`

---

## Quick Start

```bash
./start-infra.sh   # Start PostgreSQL, Kafka, Redis, Keycloak
./start-app.sh     # Build JARs + start Claims Service, BFF, UI
```

> First run: ~2–3 min (image downloads). Subsequent starts: ~30 seconds.

### URLs

| What | URL | Credentials |
|------|-----|-------------|
| **Demo App UI** | http://localhost:3001 | See test users below |
| BFF Swagger | http://localhost:8090/swagger-ui.html | — |
| Claims Swagger | http://localhost:8080/swagger-ui.html | — |
| Keycloak Admin | http://localhost:8180 | `admin` / `Admin123!` |
| Kafka UI | http://localhost:9093 | — |

### Test Users

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin@demo.com` | `Admin123!` |
| Claimant | `claimant@demo.com` | `Claimant123!` |

---

## Stop

```bash
./stop-app.sh
./stop-infra.sh

# Wipe all data for a clean slate:
./stop-app.sh && ./stop-infra.sh -v
```

---

## Real-Time Events — Two Modes

Claim events are pushed to the UI in real time via WebSocket. There are two ways to generate those events — choose one. Running both simultaneously causes duplicate notifications.

### Mode 1: Direct Kafka (default)

The Claims Service publishes events directly to Kafka after each write. No extra setup needed.

`APP_EVENTS_CDC_ENABLED=false` is set by default in `docker-compose.apps.yml`. Just run the normal startup above.

---

### Mode 2: Change Data Capture via Debezium

Debezium monitors the PostgreSQL WAL (write-ahead log) and publishes database changes to Kafka. The BFF consumes these CDC events.

**Step 1** — In `docker-compose.apps.yml`, set:
```yaml
APP_EVENTS_CDC_ENABLED: "true"
```

**Step 2** — Start the app (infra + app must be running first):
```bash
./start-app.sh
```

**Step 3** — Start Debezium after the app is healthy:
```bash
./start-cdc.sh
```

**Verify connector is running:**
```bash
curl http://localhost:8083/connectors/claims-connector/status | python3 -m json.tool
```
You should see `"state": "RUNNING"` for both the connector and its task.

**Stop CDC:**
```bash
./stop-cdc.sh
```

> To switch back to direct Kafka: set `APP_EVENTS_CDC_ENABLED=false` and run `./start-app.sh`.

---

## Testing

### Assessment coverage

The assessment adds focused automated coverage at the domain, React component, and full-system levels.

| Layer | Framework | Status |
|-------|-----------|--------|
| Claims domain tests | JUnit 5, AssertJ | 16 validation and lifecycle tests |
| React component tests | Vitest, Testing Library | 3 claim-wizard behaviour tests |
| E2E tests | Playwright | Authentication, authorization, and claim lifecycle |
| Contract, Kafka, and load tests | Deferred | Prioritized in the test strategy |

### What's been disabled

To keep the build simple and focused on the app itself, the following have been turned off in `pom.xml` (but the code/config remains for the QA team to re-enable and work with):

| Feature | Property | Notes |
|---------|----------|-------|
| WireMock stub generation | `skipWiremockGeneration=true` | Stubs exist in `code/bff-service/mocks/` |
| AsyncAPI doc generation | `skipAsyncApiGeneration=true` | Specs exist in `src/main/resources/asyncapi/` |
| Postman collection generation | `skipPostmanGeneration=true` | Can be re-enabled |
| Kafka schema validation | `kafka.producer.schema-validation.enabled=false` | Schema files exist in `asyncapi/schemas/` |
| Checkstyle / PMD | Skipped in Docker build | Still runs locally via `mvn verify` |

### Assessment documentation

The rationale, exclusions, findings, AI decisions, and exact commands are documented in:

- [`TEST_STRATEGY.md`](TEST_STRATEGY.md)
- [`BUGS.md`](BUGS.md)
- [`AI_JOURNAL.md`](AI_JOURNAL.md)
- [`TESTING.md`](TESTING.md)

Run the Java, React, and Playwright layers separately using the commands in `TESTING.md`. Playwright requires the full Docker stack; the Java and React suites do not.

---

## Diagnostics

```bash
# Container status
docker compose -f docker-compose.infra.yml ps
docker compose -f docker-compose.apps.yml ps

# Service logs
docker compose -f docker-compose.apps.yml logs -f claims-service
docker compose -f docker-compose.apps.yml logs -f bff-service
docker compose -f docker-compose.apps.yml logs -f ui

# Health checks
curl http://localhost:8080/actuator/health   # Claims Service
curl http://localhost:8090/actuator/health   # BFF Service
```

---

## Running Services Locally (IDE / Debugging)

Start infra via Docker, then run services on your machine:

```bash
./start-infra.sh

# Terminal 1
cd code/claims-service && mvn spring-boot:run

# Terminal 2
cd code/bff-service && mvn spring-boot:run

# Terminal 3
cd code/demo-app-ui
npm install   # first time only
npm run dev -- --port 3001
```

---

## Rebuilding After Code Changes

```bash
# Full rebuild (Maven + Docker)
./start-app.sh

# Rebuild a single service image only
docker compose -f docker-compose.apps.yml up --build --pull never claims-service
docker compose -f docker-compose.apps.yml up --build --pull never bff-service
docker compose -f docker-compose.apps.yml up --build --pull never ui
```
