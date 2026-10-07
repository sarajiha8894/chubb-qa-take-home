# Test Strategy

## Objective

Provide focused confidence in the highest-risk claims-management behaviour within the assessment time box. The suite uses fast domain tests for business rules, browser-level component tests for user-facing validation, and Playwright tests for critical cross-service journeys.

## Assessment approach

1. Read the assessment brief, application documentation, source code, and API specifications to understand the intended features and architecture.
2. Start the application and explore the claimant and administrator journeys manually. This black-box exploration established the expected behaviour before automation was added.
3. Use AI to summarize requirements, identify candidate risks, and generate an initial test implementation.
4. Review every suggestion against the source code and observed application behaviour. Generated tests were changed when dependencies conflicted, selectors were ambiguous, or an assertion did not prove the intended outcome.
5. Prioritize a small smoke path and high-impact negative scenarios. E2E received additional attention because it provides confidence across the UI and services, while unit and component tests cover rules more efficiently at lower layers.

The goal is meaningful risk coverage rather than attempting to automate every requirement. When a test fails, the failure is first classified as a product defect, test-code problem, or environment issue before changing the assertion or implementation.

## Highest-risk areas

1. Claim validation boundaries. Invalid dates, amounts, locations, or descriptions could create incorrect financial records.
2. Claim status transitions. Skipping required states or changing a closed claim could corrupt the claim lifecycle.
3. Authorization. Claimants must not gain access to administrative functions.
4. Cross-service claim processing. Login, UI, BFF, claims service, persistence, and status updates must work together.
5. Event delivery. Kafka and WebSocket failures could leave users viewing stale claim status.

## Automated coverage

### Java domain tests

`ClaimTest` covers:

- Valid claim creation and initial `SUBMITTED` status.
- Amount boundaries: `0.01` and `1,000,000` accepted; zero, negative, and over-limit values rejected.
- Description boundaries: 10 and 1,000 characters accepted; 9 and 1,001 rejected.
- Location boundaries: 5 and 200 characters accepted; 4 and 201 rejected.
- Today and past incident dates accepted; future dates rejected.
- Approved and rejected lifecycle paths.
- Direct invalid transitions and all transitions from `CLOSED` rejected.

### React component tests

`WizardStep1` is exercised through visible labels, messages, and buttons:

- Short location displays a validation message.
- Future incident date displays a validation message.
- Valid values are stored and advance the wizard to step two.

### Playwright E2E tests

- Invalid credentials return `401`, show a clear error, and do not allow access to a protected page.
- A claimant attempting to access the admin claims page is redirected to their claims page.
- A claimant submits a uniquely identifiable claim.
- The created claim appears with `Submitted` status.
- An administrator finds the same claim and moves it to `Under Review`.
- The tests assert relevant API responses and resulting UI state.

## Deliberately deferred

- Kafka delivery, duplicate-message handling, and WebSocket reconnection testing.
- Redis cache consistency and invalidation tests.
- Contract testing between the BFF and claims service.
- Cross-browser and mobile coverage beyond Chromium.
- Load, visual regression, accessibility, and resilience testing.
- Exhaustive UI duplication of domain boundary cases.

These were deferred to keep the submission focused on business-critical behaviour.

## With more time

The next work would be prioritized as follows:

1. Repeat the suite across clean runs and remove any sources of flakiness.
2. Add API-level authorization tests, including cross-user claim access and expired or malformed sessions.
3. Add contract tests between the UI, BFF, and claims service.
4. Test Kafka delivery, duplicate-message handling, WebSocket reconnection, and Redis cache consistency.
5. Add database-level verification for persistence, ownership, and status updates.
6. Expand exploratory scenarios around refresh, hard refresh, multiple tabs, cookies, local storage, and session storage.
7. Add concurrency tests for duplicate submissions and simultaneous status changes.
8. Add cross-browser, accessibility, performance, and resilience coverage based on production usage expectations.

## Test design principles

- Test names state observable behaviour.
- Boundary rules are concentrated at the domain layer.
- Component tests use accessible user-facing selectors.
- E2E data includes a timestamp to avoid collisions between runs.
- Playwright retains screenshots, videos, and traces for failures.
- Fixed sleeps are avoided; tests wait for observable UI or network conditions.
