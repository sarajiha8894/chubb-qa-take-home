# Findings and Quality Concerns

## 1. Frontend and backend handle surrounding whitespace differently

**Type:** Quality concern found through code review

The frontend Zod schemas validate raw string length. The backend trims location and description before applying its length rules. An input containing enough surrounding spaces can therefore pass client validation and be rejected by the backend.

Example:

- Enter a location such as four spaces followed by `A`.
- The frontend sees five characters and may allow the user to continue.
- The backend trims the value to `A` and rejects it as shorter than five characters.

Recommended resolution: trim strings in the frontend schema before validating length, while retaining backend validation as the source of truth.

## 2. Assessment documentation does not match the supplied frontend

**Type:** Documentation issue

The candidate brief describes an Angular frontend, while the supplied application uses Next.js 16 and React 19. The test implementation follows the actual codebase and uses React Testing Library.

## 3. Supplied testing documentation does not match the archive

**Type:** Documentation/setup issue

The project README says unit tests are supplied and that E2E scaffolding exists. The supplied archive contained test dependencies and scripts but no usable test source or Vitest/Playwright configuration. Test configuration and coverage were therefore created as part of this submission.

## 4. Java test execution can fail when local memory is constrained

**Type:** Local environment/tooling constraint

When the Java tests were started while Docker Desktop and the application containers were running, Maven Surefire attempted to start additional forked JVMs and Windows reported that the paging file was too small. Surefire then reported that the forked VM terminated before running the tests.

This was a machine resource failure rather than a failed test assertion or product defect. The Java domain tests passed when executed separately with sufficient memory available.

Recommended workaround: execute the Java, React component, and Playwright E2E layers separately. Stop Docker before the Java tests when local memory is limited, then start the application containers again for Playwright testing. Increasing the Windows paging-file allocation is another environment-level option.

## Confirmed runtime defects

No product runtime defect was confirmed by the implemented automated suite. The tests currently pass when their required services and machine resources are available. Findings 1–3 concern the product or supplied documentation; finding 4 records a local execution constraint.
