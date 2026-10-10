package com.vidrieria.backend_vidrieria.modules.optimizador.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import java.util.Map;
import static org.mockito.Mockito.when;

import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaCristalDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.CorteItemDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorResponseDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.service.CorteVarillaService;
import com.vidrieria.backend_vidrieria.modules.optimizador.service.OptimizadorJobManager;
import com.vidrieria.backend_vidrieria.modules.optimizador.service.OptimizadorVidrioService;

@ExtendWith(MockitoExtension.class)
class OptimizadorControllerTest {

    @Mock
    private CorteVarillaService corteVarillaService;

    @Mock
    private OptimizadorVidrioService optimizadorVidrioService;

    @Mock
    private OptimizadorJobManager jobManager;

    @InjectMocks
    private OptimizadorController optimizadorController;

    @Test
    @DisplayName("calcular debe retornar HTTP 200 con el resultado de optimización de cortes 1D")
    void testCalcular() {
        OptimizadorRequestDTO request = OptimizadorRequestDTO.builder()
                .longitudVarillaEstandarMm(6000.0)
                .anchoSierraMm(3.0)
                .cortes(Collections.singletonList(
                        new CorteItemDTO(1500.0, "Riel", 2)
                ))
                .build();

        OptimizadorResponseDTO responseMock = OptimizadorResponseDTO.builder()
                .longitudVarillaEstandarMm(6000.0)
                .anchoSierraMm(3.0)
                .totalVarillas(1)
                .totalMetrosConsumidos(6.0)
                .totalMetrosUtiles(3.0)
                .porcentajeAprovechamientoGlobal(50.0)
                .build();

        when(corteVarillaService.optimizarCorte(any())).thenReturn(responseMock);

        ResponseEntity<OptimizadorResponseDTO> response = optimizadorController.calcular(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getTotalVarillas());
        assertEquals(6000.0, response.getBody().getLongitudVarillaEstandarMm());
        assertEquals(50.0, response.getBody().getPorcentajeAprovechamientoGlobal());
    }

    @Test
    @DisplayName("calcularVidrioSync debe retornar HTTP 200 con el resultado síncrono de corte 2D")
    void testCalcularVidrioSync() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Vidrio Ventana")
                                .anchoMm(1000.0)
                                .altoMm(800.0)
                                .cantidad(1)
                                .build()
                ))
                .build();

        OptimizadorVidrioResponseDTO responseMock = OptimizadorVidrioResponseDTO.builder()
                .anchoPlanchaMm(2500.0)
                .altoPlanchaMm(1800.0)
                .totalPlanchas(1)
                .totalAreaPlanchasM2(4.5)
                .totalAreaUtilM2(0.8)
                .porcentajeAprovechamiento(17.78)
                .build();

        when(optimizadorVidrioService.optimizarCorteVidrio(any())).thenReturn(responseMock);

        ResponseEntity<OptimizadorVidrioResponseDTO> response = optimizadorController.calcularVidrioSync(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getTotalPlanchas());
        assertEquals(2500.0, response.getBody().getAnchoPlanchaMm());
        assertEquals(17.78, response.getBody().getPorcentajeAprovechamiento());
    }

    @Test
    @DisplayName("calcularVidrio debe retornar HTTP 202 Accepted con jobId para el flujo asíncrono")
    void testCalcularVidrioAsync() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Vidrio Ventana")
                                .anchoMm(1000.0)
                                .altoMm(800.0)
                                .cantidad(1)
                                .build()
                ))
                .build();

        when(jobManager.submitJob(any())).thenReturn("job-test-123");

        ResponseEntity<Map<String, String>> response = optimizadorController.calcularVidrio(request);

        assertNotNull(response);
        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("job-test-123", response.getBody().get("jobId"));
    }
}

