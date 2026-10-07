# AI Working Journal

## Application assessment

**Prompt/goal:** Review the supplied folder and explain the assessment expectations and architecture.

**Accepted:** Prioritise claim validation, status transitions, authorization, and one complete cross-service journey.

**Challenged or changed:** The brief refers to Angular, but source inspection showed Next.js and React. The testing approach was changed to React Testing Library and Vitest.

**Verification:** Recommendations were checked against the domain model, UI components, OpenAPI specification, Docker Compose files, and assessment brief.

## Environment setup

**Prompt/goal:** Explain Docker and help start the local stack on Windows.

**Accepted:** Use Docker Desktop with WSL 2; build the Java JARs before starting infrastructure and application Compose stacks.

**Changed:** Docker's initial WSL data disk was corrupted. A clean Docker Desktop reinstall and Docker-specific data reset were required. Application source and the Ubuntu distribution were preserved.

**Reasoning:** The full local stack is required for meaningful E2E coverage, while Docker itself is supporting infrastructure rather than the product under test.

## Java tests

**Prompt/goal:** Generate focused domain tests for claim validation and lifecycle rules.

**Accepted:** Boundary-value tests for amounts, descriptions, locations, dates, and status transitions.

**Reviewed:** Every expected result was checked against `Claim.java` and `ClaimStatus.java`. Shared construction helpers were used to reduce repeated setup.

**Verification:** Maven Surefire reported 16 tests, 0 failures, and 0 errors.

## Component tests

**Prompt/goal:** Configure Vitest and test the claim wizard from the user's perspective.

**Accepted:** Use accessible labels, alerts, and button roles rather than component internals.

**Overrode:** The initially suggested `@vitejs/plugin-react` install was removed after its current version conflicted with the Vite version used by Vitest. Vite's built-in TSX transform is sufficient for this suite.

**Verification:** Three component tests passed with Vitest.

## E2E tests

**Prompt/goal:** Cover authorization and the claimant-to-admin claim journey.

**Accepted:** Use unique test data, assert API responses, and verify resulting UI status.

**Refined:** Playwright strict-mode failures revealed ambiguous accessible names (`Password`, `Next`, and `Submit Claim`). Selectors were narrowed to exact names or the relevant wizard container. Direct navigation to the protected form removed an unreliable client-side navigation step from the main business-flow test.

**Verification:** The original authorization and claim-lifecycle journeys passed. The invalid-credentials scenario confirmed a `401` response and the expected error message; its ambiguous Next.js alert locator was narrowed and requires a final rerun before submission.

## Human sign-off

AI-generated changes were reviewed against the application source and executed locally. Suggestions were changed when they conflicted with installed dependencies or selected ambiguous UI elements. The submitted scope and deferred areas remain the candidate's responsibility to explain during the walkthrough.
