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

**Verification:** All three Playwright scenarios passed. The invalid-credentials scenario passed after its locator was narrowed to the alert containing the expected error message.

## Local test execution

**Prompt/goal:** Provide one command that runs the Java, React component, and Playwright suites.

**Accepted initially:** A PowerShell runner was created to execute the three layers in sequence and stop after the first failure.

**Challenged or changed:** Running Maven while Docker Desktop and the application containers were active caused Windows to reject a forked Surefire JVM because the paging file was too small. This was an environment resource failure rather than a test assertion or application defect. The final documented approach runs each test layer separately, with Docker required only for Playwright.

**Reasoning:** Separate commands use fewer local resources, make the failing layer immediately clear, and avoid coupling fast unit and component tests to the Docker environment.

## Authentication coverage

**Prompt/goal:** Determine whether invalid login credentials were covered and add the missing scenario.

**Accepted:** Add a Playwright test using a real account email and an incorrect password. Assert the `401` response, visible error message, unchanged login URL, and rejection from a protected route.

**Refined:** The first run found two elements with `role="alert"`: the actual login error and Next.js's empty route announcer. The locator was narrowed to the alert containing `Invalid email or password`. The failure improved the selector and did not expose a product defect.

## Git history

**Prompt/goal:** Prepare a meaningful commit history for a supplied archive that did not contain Git history.

**Accepted:** Organize the final repository into logical checkpoints for the supplied application baseline, Java domain tests, frontend component/E2E tests, and assessment documentation.

**Reviewed:** Generated output such as `node_modules`, Maven `target`, Playwright reports, test results, logs, and TypeScript build metadata is excluded from version control.

## Human sign-off

AI-generated changes were reviewed against the application source and executed locally. Suggestions were changed when they conflicted with installed dependencies or selected ambiguous UI elements. The submitted scope and deferred areas remain the candidate's responsibility to explain during the walkthrough.
