# Running the Automated Tests

## Execution approach

Run each test layer separately. This makes failures easier to diagnose and avoids exhausting local memory while Docker Desktop is running. The Java and React component tests do not require the Docker application; Playwright does.

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker Desktop with the WSL 2 engine

## Java domain tests

From `demo-app`:

```powershell
mvn -f code/claims-service/pom.xml test
```

Expected assessment suite result: 16 `ClaimTest` tests with zero failures and errors.

## React component tests

From `code/demo-app-ui`:

```powershell
npm install
npm test
```

## E2E prerequisites

Build the Java services from `demo-app`:

```powershell
mvn -f code/claims-service/pom.xml package "-Dmaven.test.skip=true" "-Dcheckstyle.skip=true" "-Dpmd.skip=true"
mvn -f code/bff-service/pom.xml package "-Dmaven.test.skip=true" "-Dcheckstyle.skip=true" "-Dpmd.skip=true"
```

Start infrastructure and application services:

```powershell
docker compose -f docker-compose.infra.yml up -d
docker compose -f docker-compose.apps.yml up --build -d
```

Confirm `http://localhost:3001` is available. From `code/demo-app-ui`, install the browser once and run Playwright:

```powershell
npx playwright install chromium
npm run test:e2e
```

Useful variants:

```powershell
npx playwright test --headed
npx playwright test --grep "invalid credentials"
npm run test:e2e:report
```

## Stop the environment

From `demo-app`:

```powershell
docker compose -f docker-compose.apps.yml down
docker compose -f docker-compose.infra.yml down
```

Do not add `-v` unless intentionally deleting all local test database data.
