package com.example.demo.domain.claim;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ClaimTest {

    // Provides a known-good claim for tests that focus on status behaviour.
    private Claim validClaim() {
        return claim(
                LocalDate.now().minusDays(1),
                "Kuala Lumpur",
                "Vehicle damaged during an accident",
                new BigDecimal("1000.00")
        );
    }

    // Centralises claim construction so boundary tests only vary the field under test.
    private Claim claim(LocalDate incidentDate, String location,
                        String description, BigDecimal amount) {
        return new Claim(
                UUID.randomUUID(),
                UUID.randomUUID(),
                incidentDate,
                location,
                description,
                amount
        );
    }

    // Verifies the default status and domain event produced for a new valid claim.
    @Test
    void createsValidClaimAsSubmitted() {
        Claim claim = validClaim();

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.SUBMITTED);
        assertThat(claim.getDomainEvents()).hasSize(1);
    }

    // Incident dates in the future must be rejected by the domain model.
    @Test
    void rejectsFutureIncidentDate() {
        assertThatThrownBy(() -> new Claim(
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.now().plusDays(1),
                "Kuala Lumpur", "Vehicle damaged during an accident",
                new BigDecimal("1000.00")
        )).isInstanceOf(InvalidClaimException.class)
          .hasMessageContaining("future");
    }

    // Amount validation: zero, above maximum, and negative values are invalid.
    @Test
    void rejectsZeroClaimAmount() {
        assertThatThrownBy(() -> new Claim(
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.now(),
                "Kuala Lumpur", "Vehicle damaged during an accident", BigDecimal.ZERO
        )).isInstanceOf(InvalidClaimException.class)
          .hasMessageContaining("positive");
    }

    @Test
    void rejectsAmountAboveMaximum() {
        assertThatThrownBy(() -> new Claim(
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.now(),
                "Kuala Lumpur", "Vehicle damaged during an accident",
                new BigDecimal("1000000.01")
        )).isInstanceOf(InvalidClaimException.class);
    }

    @Test
    void acceptsMinimumAndMaximumClaimAmounts() {
        // Exercise both inclusive boundaries of the allowed amount range.
        Claim minimum = claim(LocalDate.now(), "Kuala Lumpur",
                "Vehicle damaged during an accident", new BigDecimal("0.01"));
        Claim maximum = claim(LocalDate.now(), "Kuala Lumpur",
                "Vehicle damaged during an accident", new BigDecimal("1000000"));

        assertThat(minimum.getClaimAmount()).isEqualByComparingTo("0.01");
        assertThat(maximum.getClaimAmount()).isEqualByComparingTo("1000000");
    }

    @Test
    void rejectsNegativeClaimAmount() {
        assertThatThrownBy(() -> claim(LocalDate.now(), "Kuala Lumpur",
                "Vehicle damaged during an accident", new BigDecimal("-0.01")))
                .isInstanceOf(InvalidClaimException.class);
    }

    @Test
    void acceptsDescriptionAtMinimumAndMaximumLength() {
        // String.repeat creates exact boundary lengths without large hard-coded strings.
        Claim minimum = claim(LocalDate.now(), "Kuala Lumpur", "D".repeat(10), BigDecimal.ONE);
        Claim maximum = claim(LocalDate.now(), "Kuala Lumpur", "D".repeat(1000), BigDecimal.ONE);

        assertThat(minimum.getDescription()).hasSize(10);
        assertThat(maximum.getDescription()).hasSize(1000);
    }

    @Test
    void rejectsDescriptionOutsideAllowedLength() {
        // Test one character below and one character above the valid range.
        assertThatThrownBy(() -> claim(LocalDate.now(), "Kuala Lumpur",
                "D".repeat(9), BigDecimal.ONE))
                .isInstanceOf(InvalidClaimException.class);
        assertThatThrownBy(() -> claim(LocalDate.now(), "Kuala Lumpur",
                "D".repeat(1001), BigDecimal.ONE))
                .isInstanceOf(InvalidClaimException.class);
    }

    @Test
    void acceptsLocationAtMinimumAndMaximumLength() {
        // Verify that both documented location boundaries are inclusive.
        Claim minimum = claim(LocalDate.now(), "L".repeat(5),
                "Vehicle damaged during an accident", BigDecimal.ONE);
        Claim maximum = claim(LocalDate.now(), "L".repeat(200),
                "Vehicle damaged during an accident", BigDecimal.ONE);

        assertThat(minimum.getIncidentLocation()).hasSize(5);
        assertThat(maximum.getIncidentLocation()).hasSize(200);
    }

    @Test
    void rejectsLocationOutsideAllowedLength() {
        // Verify values immediately outside both location boundaries.
        assertThatThrownBy(() -> claim(LocalDate.now(), "L".repeat(4),
                "Vehicle damaged during an accident", BigDecimal.ONE))
                .isInstanceOf(InvalidClaimException.class);
        assertThatThrownBy(() -> claim(LocalDate.now(), "L".repeat(201),
                "Vehicle damaged during an accident", BigDecimal.ONE))
                .isInstanceOf(InvalidClaimException.class);
    }

    @Test
    void acceptsIncidentDateTodayAndInThePast() {
        // Capture today's date once to avoid inconsistent assertions around midnight.
        LocalDate currentDate = LocalDate.now();
        LocalDate pastDate = currentDate.minusYears(1);
        Claim today = claim(currentDate, "Kuala Lumpur",
                "Vehicle damaged during an accident", BigDecimal.ONE);
        Claim past = claim(pastDate, "Kuala Lumpur",
                "Vehicle damaged during an accident", BigDecimal.ONE);

        assertThat(today.getIncidentDate()).isEqualTo(currentDate);
        assertThat(past.getIncidentDate()).isEqualTo(pastDate);
    }

    // Status-transition tests cover valid paths and prevent lifecycle shortcuts.
    @Test
    void allowsSubmittedClaimToMoveUnderReview() {
        Claim claim = validClaim();

        claim.updateStatus(ClaimStatus.UNDER_REVIEW);

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.UNDER_REVIEW);
    }

    @Test
    void rejectsSubmittedClaimMovingDirectlyToApproved() {
        Claim claim = validClaim();

        assertThatThrownBy(() -> claim.updateStatus(ClaimStatus.APPROVED))
                .isInstanceOf(InvalidStatusTransitionException.class);
        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.SUBMITTED);
    }

    @Test
    void supportsTheCompleteApprovedLifecycle() {
        // Happy path for a claim that is reviewed, approved, and closed.
        Claim claim = validClaim();

        claim.updateStatus(ClaimStatus.UNDER_REVIEW);
        claim.updateStatus(ClaimStatus.APPROVED);
        claim.updateStatus(ClaimStatus.CLOSED);

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.CLOSED);
    }

    @Test
    void supportsTheRejectedLifecycle() {
        // Alternative valid path where a submitted claim is rejected and closed.
        Claim claim = validClaim();

        claim.updateStatus(ClaimStatus.REJECTED);
        claim.updateStatus(ClaimStatus.CLOSED);

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.CLOSED);
    }

    @Test
    void rejectsAnyTransitionFromClosed() {
        // First place the claim in the terminal CLOSED state.
        Claim claim = validClaim();
        claim.updateStatus(ClaimStatus.REJECTED);
        claim.updateStatus(ClaimStatus.CLOSED);

        // Check every possible target, including CLOSED itself, to prove it is terminal.
        for (ClaimStatus target : ClaimStatus.values()) {
            assertThatThrownBy(() -> claim.updateStatus(target))
                    .as("CLOSED to %s must be rejected", target)
                    .isInstanceOf(InvalidStatusTransitionException.class);
        }
    }
}
