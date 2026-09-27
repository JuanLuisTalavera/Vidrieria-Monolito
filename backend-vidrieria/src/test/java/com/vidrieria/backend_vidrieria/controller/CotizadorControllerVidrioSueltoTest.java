package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.CotizacionVidrioSueltoRequestDTO;
import com.vidrieria.backend_vidrieria.dto.CotizacionVidrioSueltoResponseDTO;
import com.vidrieria.backend_vidrieria.service.CotizadorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CotizadorControllerVidrioSueltoTest {

    @Mock
    private CotizadorService cotizadorService;

    @InjectMocks
    private CotizadorController cotizadorController;

    @Test
    @DisplayName("POST /api/v1/cotizador/vidrio-suelto ejecuta el cálculo y devuelve 200 OK con desglose")
    void testCalcularVidrioSueltoEndpoint() {
        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(1)
                .anchoMm(1200.0)
                .altoMm(800.0)
                .cantidad(1)
                .metrosPulido(4.0)
                .metrosBiselado(0.0)
                .cantidadHuecos(2)
                .build();

        CotizacionVidrioSueltoResponseDTO mockResponse = CotizacionVidrioSueltoResponseDTO.builder()
                .idVidrio(1)
                .nombreVidrio("Cristal Crudo 4mm")
                .anchoMm(1200.0)
                .altoMm(800.0)
                .cantidad(1)
                .areaM2Individual(new BigDecimal("0.9600"))
                .areaM2Total(new BigDecimal("0.9600"))
                .subtotalVidrio(new BigDecimal("48.00"))
                .subtotalPulido(new BigDecimal("20.00"))
                .subtotalBiselado(BigDecimal.ZERO)
                .subtotalHuecos(new BigDecimal("16.00"))
                .subtotalNeto(new BigDecimal("84.00"))
                .totalCalculado(new BigDecimal("84.00"))
                .build();

        when(cotizadorService.calcularCotizacionVidrioSuelto(request)).thenReturn(mockResponse);

        ResponseEntity<CotizacionVidrioSueltoResponseDTO> response = cotizadorController.calcularVidrioSuelto(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(new BigDecimal("84.00"), response.getBody().getTotalCalculado());
        verify(cotizadorService).calcularCotizacionVidrioSuelto(request);
    }
}
