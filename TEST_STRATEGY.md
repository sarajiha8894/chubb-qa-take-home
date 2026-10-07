# Test Strategy

## Objective

Provide focused confidence in the highest-risk claims-management behaviour within the assessment time box. The suite uses fast domain tests for business rules, browser-level component tests for user-facing validation, and Playwright tests for critical cross-service journeys.

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

These were deferred to keep the submission focused on business-critical behaviour. With more time, authorization at the API boundary, contract tests, and event-delivery reliability would be next.

## Test design principles

- Test names state observable behaviour.
- Boundary rules are concentrated at the domain layer.
- Component tests use accessible user-facing selectors.
- E2E data includes a timestamp to avoid collisions between runs.
- Playwright retains screenshots, videos, and traces for failures.
- Fixed sleeps are avoided; tests wait for observable UI or network conditions.
