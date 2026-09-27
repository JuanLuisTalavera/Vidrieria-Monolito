package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.CotizacionObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraRequestDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.GuardarCotizacionObraRequestDTO;
import com.vidrieria.backend_vidrieria.entity.TipoEstructura;
import com.vidrieria.backend_vidrieria.service.CotizacionObraService;
import com.vidrieria.backend_vidrieria.service.DespieceObraService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CotizacionObraControllerTest {

    @Mock
    private DespieceObraService despieceObraService;

    @Mock
    private CotizacionObraService cotizacionObraService;

    @InjectMocks
    private CotizacionObraController cotizacionObraController;

    @Test
    @DisplayName("calcularDespiece debe retornar HTTP 200 con el despiece calculado")
    void testCalcularDespiece() {
        DespieceObraRequestDTO request = DespieceObraRequestDTO.builder()
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .build();

        DespieceObraResponseDTO responseMock = DespieceObraResponseDTO.builder()
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .build();

        when(despieceObraService.calcularDespiece(any())).thenReturn(responseMock);

        ResponseEntity<DespieceObraResponseDTO> response = cotizacionObraController.calcularDespiece(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(TipoEstructura.VENTANA_SERIE_20_2H, response.getBody().getTipoEstructura());
    }

    @Test
    @DisplayName("guardar debe retornar HTTP 201 Created con la cotización guardada")
    void testGuardar() {
        GuardarCotizacionObraRequestDTO request = GuardarCotizacionObraRequestDTO.builder()
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .precioTotal(450.0)
                .build();

        CotizacionObraResponseDTO responseMock = CotizacionObraResponseDTO.builder()
                .id(1L)
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .precioTotal(450.0)
                .build();

        when(cotizacionObraService.guardarCotizacion(any())).thenReturn(responseMock);

        ResponseEntity<CotizacionObraResponseDTO> response = cotizacionObraController.guardar(request);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().getId());
        assertEquals(450.0, response.getBody().getPrecioTotal());
    }

    @Test
    @DisplayName("listarTodas debe retornar HTTP 200 con la lista de cotizaciones")
    void testListarTodas() {
        when(cotizacionObraService.listarTodas()).thenReturn(Collections.emptyList());

        ResponseEntity<List<CotizacionObraResponseDTO>> response = cotizacionObraController.listarTodas();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    @DisplayName("obtenerPorId debe retornar HTTP 200 con la cotización solicitada")
    void testObtenerPorId() {
        CotizacionObraResponseDTO mockDto = CotizacionObraResponseDTO.builder().id(5L).build();
        when(cotizacionObraService.obtenerPorId(5L)).thenReturn(mockDto);

        ResponseEntity<CotizacionObraResponseDTO> response = cotizacionObraController.obtenerPorId(5L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(5L, response.getBody().getId());
    }
}
