package com.studybuddy.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ProgressRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    @Test
    void testValidProgressRequest() {
        // Arrange
        ProgressRequest request = new ProgressRequest();
        request.setUserId(1L);
        request.setProgress(75.5);

        // Act
        Set<ConstraintViolation<ProgressRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    void testProgressRequest_ProgressTooLow() {
        // Arrange
        ProgressRequest request = new ProgressRequest();
        request.setUserId(1L);
        request.setProgress(-10.0);

        // Act
        Set<ConstraintViolation<ProgressRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("progress")));
    }

    @Test
    void testProgressRequest_ProgressTooHigh() {
        // Arrange
        ProgressRequest request = new ProgressRequest();
        request.setUserId(1L);
        request.setProgress(150.0);

        // Act
        Set<ConstraintViolation<ProgressRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("progress")));
    }

    @Test
    void testProgressRequest_NullUserId() {
        // Arrange
        ProgressRequest request = new ProgressRequest();
        request.setUserId(null);
        request.setProgress(50.0);

        // Act
        Set<ConstraintViolation<ProgressRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("userId")));
    }

    @Test
    void testProgressRequest_BoundaryValues() {
        // Test progress = 0
        ProgressRequest request1 = new ProgressRequest();
        request1.setUserId(1L);
        request1.setProgress(0.0);
        assertTrue(validator.validate(request1).isEmpty());

        // Test progress = 100
        ProgressRequest request2 = new ProgressRequest();
        request2.setUserId(1L);
        request2.setProgress(100.0);
        assertTrue(validator.validate(request2).isEmpty());
    }
}

