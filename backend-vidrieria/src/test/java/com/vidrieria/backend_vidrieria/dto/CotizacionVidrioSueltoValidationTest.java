package com.vidrieria.backend_vidrieria.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CotizacionVidrioSueltoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Permite dimensiones pequeñas (ej. 100x100 mm) válidas con cantidad positiva")
    void testMedidasPequenasValidas() {
        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(100.0)
                .altoMm(100.0)
                .cantidad(1)
                .build();

        Set<ConstraintViolation<CotizacionVidrioSueltoRequestDTO>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "No debería haber violaciones para dimensiones pequeñas de 100x100 mm");
    }

    @Test
    @DisplayName("Rechaza ancho <= 0 mm")
    void testAnchoCeroONegativoInvalido() {
        CotizacionVidrioSueltoRequestDTO requestCero = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(0.0)
                .altoMm(100.0)
                .cantidad(1)
                .build();

        Set<ConstraintViolation<CotizacionVidrioSueltoRequestDTO>> violationsCero = validator.validate(requestCero);
        assertFalse(violationsCero.isEmpty());
        assertTrue(violationsCero.stream().anyMatch(v -> v.getPropertyPath().toString().equals("anchoMm")));

        CotizacionVidrioSueltoRequestDTO requestNegativo = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(-50.0)
                .altoMm(100.0)
                .cantidad(1)
                .build();

        Set<ConstraintViolation<CotizacionVidrioSueltoRequestDTO>> violationsNegativo = validator.validate(requestNegativo);
        assertFalse(violationsNegativo.isEmpty());
        assertTrue(violationsNegativo.stream().anyMatch(v -> v.getPropertyPath().toString().equals("anchoMm")));
    }

    @Test
    @DisplayName("Rechaza alto <= 0 mm")
    void testAltoCeroONegativoInvalido() {
        CotizacionVidrioSueltoRequestDTO requestCero = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(100.0)
                .altoMm(0.0)
                .cantidad(1)
                .build();

        Set<ConstraintViolation<CotizacionVidrioSueltoRequestDTO>> violations = validator.validate(requestCero);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("altoMm")));
    }

    @Test
    @DisplayName("Rechaza cantidad <= 0 o nula")
    void testCantidadInvalida() {
        CotizacionVidrioSueltoRequestDTO requestCero = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(100.0)
                .altoMm(100.0)
                .cantidad(0)
                .build();

        Set<ConstraintViolation<CotizacionVidrioSueltoRequestDTO>> violationsCero = validator.validate(requestCero);
        assertFalse(violationsCero.isEmpty());
        assertTrue(violationsCero.stream().anyMatch(v -> v.getPropertyPath().toString().equals("cantidad")));

        CotizacionVidrioSueltoRequestDTO requestNull = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(100.0)
                .altoMm(100.0)
                .cantidad(null)
                .build();

        Set<ConstraintViolation<CotizacionVidrioSueltoRequestDTO>> violationsNull = validator.validate(requestNull);
        assertFalse(violationsNull.isEmpty());
        assertTrue(violationsNull.stream().anyMatch(v -> v.getPropertyPath().toString().equals("cantidad")));
    }
}
