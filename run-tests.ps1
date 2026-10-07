$ErrorActionPreference = 'Stop'

# Resolve every path from this script's location so it works from any terminal folder.
$projectRoot = $PSScriptRoot
$claimsPom = Join-Path $projectRoot 'code\claims-service\pom.xml'
$uiDirectory = Join-Path $projectRoot 'code\demo-app-ui'

function Assert-LastCommandSucceeded {
    param([string]$TestLayer)

    if ($LASTEXITCODE -ne 0) {
        throw "$TestLayer failed with exit code $LASTEXITCODE. Remaining test layers were not run."
    }
}

Write-Host "`n[1/3] Running Java domain unit tests..." -ForegroundColor Cyan
# Run Surefire in Maven's JVM to avoid allocating another JVM while Docker uses memory.
# Limit this local runner to the assessment test class and skip coverage instrumentation.
# The normal Maven command remains available when full coverage/CI resources are available.
$previousMavenOpts = $env:MAVEN_OPTS
$env:MAVEN_OPTS = '-Xms64m -Xmx384m -XX:+UseSerialGC'
try {
    & mvn -f $claimsPom '-Dtest=ClaimTest' '-DforkCount=0' '-Djacoco.skip=true' test
    Assert-LastCommandSucceeded 'Java domain unit tests'
} finally {
    $env:MAVEN_OPTS = $previousMavenOpts
}

Push-Location $uiDirectory
try {
    Write-Host "`n[2/3] Running React component tests..." -ForegroundColor Cyan
    & npm test
    Assert-LastCommandSucceeded 'React component tests'

    Write-Host "`nChecking that the local application is available for E2E tests..." -ForegroundColor Cyan
    try {
        $null = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 10
    } catch {
        throw "The UI is not reachable at http://localhost:3001. Start both Docker Compose stacks before running E2E tests."
    }

    Write-Host "`n[3/3] Running Playwright E2E tests..." -ForegroundColor Cyan
    & npm run test:e2e
    Assert-LastCommandSucceeded 'Playwright E2E tests'
} finally {
    Pop-Location
}

Write-Host "`nAll three test layers passed." -ForegroundColor Green
