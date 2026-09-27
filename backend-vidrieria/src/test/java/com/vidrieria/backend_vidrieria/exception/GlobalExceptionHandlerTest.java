package com.vidrieria.backend_vidrieria.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("handleIllegalArgument debe retornar HTTP 400 Bad Request con el mensaje de error")
    void testHandleIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("La pieza 'Ventana' excede el tamaño de la plancha");

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleIllegalArgument(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("Bad Request", response.getBody().get("error"));
        assertEquals("La pieza 'Ventana' excede el tamaño de la plancha", response.getBody().get("mensaje"));
    }

    @Test
    @DisplayName("handleValidationExceptions debe retornar HTTP 400 Bad Request con los errores de campo")
    void testHandleValidationExceptions() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        FieldError fieldError = new FieldError("optimizadorVidrioRequestDTO", "anchoPlancha", "El ancho de la plancha es obligatorio");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleValidationExceptions(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("anchoPlancha: El ancho de la plancha es obligatorio", response.getBody().get("mensaje"));
    }

    @Test
    @DisplayName("handleHttpMessageNotReadable debe retornar HTTP 400 Bad Request cuando el JSON es mal formado")
    void testHandleHttpMessageNotReadable() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("JSON parse error", (org.springframework.http.HttpInputMessage) null);

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleHttpMessageNotReadable(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().get("status"));
        assertNotNull(response.getBody().get("mensaje"));
    }

    @Test
    @DisplayName("handleDataIntegrityViolation debe retornar HTTP 400 Bad Request con causa específica")
    void testHandleDataIntegrityViolation() {
        org.springframework.dao.DataIntegrityViolationException ex =
                new org.springframework.dao.DataIntegrityViolationException(
                        "Error general de BD",
                        new java.sql.SQLException("Column 'id_cliente' cannot be null")
                );

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("Bad Request", response.getBody().get("error"));
        assertEquals("Column 'id_cliente' cannot be null", response.getBody().get("mensaje"));
    }
}
