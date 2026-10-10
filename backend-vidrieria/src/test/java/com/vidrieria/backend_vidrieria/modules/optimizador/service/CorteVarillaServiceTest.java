package com.vidrieria.backend_vidrieria.modules.optimizador.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

import com.vidrieria.backend_vidrieria.modules.optimizador.dto.CorteItemDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorResponseDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.SegmentoCorteDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.VarillaOptimizadaDTO;

class CorteVarillaServiceTest {

    private CorteVarillaService corteVarillaService;

    @BeforeEach
    void setUp() {
        corteVarillaService = new CorteVarillaService();
    }

    @Test
    @DisplayName("Debe empaquetar correctamente cortes simples en una sola varilla de 6000 mm con disco de 3 mm")
    void testEmpaquetadoSimpleUnaVarilla() {
        OptimizadorRequestDTO request = OptimizadorRequestDTO.builder()
                .longitudVarillaEstandarMm(6000.0)
                .anchoSierraMm(3.0)
                .cortes(Arrays.asList(
                        new CorteItemDTO(1500.0, "Riel Superior", 1),
                        new CorteItemDTO(1500.0, "Riel Inferior", 1),
                        new CorteItemDTO(1200.0, "Jamba Lateral", 2)
                ))
                .build();

        OptimizadorResponseDTO response = corteVarillaService.optimizarCorte(request);

        assertNotNull(response);
        assertEquals(1, response.getTotalVarillas(), "Todos los cortes deben caber en 1 varilla de 6000 mm");
        VarillaOptimizadaDTO varilla = response.getVarillas().get(0);
        assertEquals(4, varilla.getSegmentos().size());

        // Verificar continuidad de cortes y merma de disco
        for (int i = 0; i < varilla.getSegmentos().size(); i++) {
            SegmentoCorteDTO s = varilla.getSegmentos().get(i);
            assertEquals(s.getLongitudMm(), Math.round((s.getPosicionFinalMm() - s.getPosicionInicialMm()) * 100.0) / 100.0);

            if (i > 0) {
                SegmentoCorteDTO previo = varilla.getSegmentos().get(i - 1);
                double separacion = Math.round((s.getPosicionInicialMm() - previo.getPosicionFinalMm()) * 100.0) / 100.0;
                assertEquals(3.0, separacion, "La distancia entre cortes debe ser igual al ancho de la sierra (3 mm)");
            }
        }

        // Suma de longitudes: 1500 + 1500 + 1200 + 1200 = 5400 mm
        // 4 cortes => 4 pasadas de sierra de 3 mm = 12 mm
        // Espacio restante: 6000 - 5412 = 588 mm
        assertEquals(588.0, varilla.getRetazoSobranteMm(), 0.1);
        assertTrue(varilla.getPorcentajeAprovechamiento() > 89.0);
    }

    @Test
    @DisplayName("Debe abrir múltiples varillas cuando los cortes superan los 6000 mm")
    void testMultiplesVarillas() {
        OptimizadorRequestDTO request = OptimizadorRequestDTO.builder()
                .longitudVarillaEstandarMm(6000.0)
                .anchoSierraMm(3.0)
                .cortes(Arrays.asList(
                        new CorteItemDTO(2500.0, "Perfil Grande", 3) // 3 * 2500 = 7500 mm -> mínimo 2 varillas
                ))
                .build();

        OptimizadorResponseDTO response = corteVarillaService.optimizarCorte(request);

        assertNotNull(response);
        assertEquals(2, response.getTotalVarillas());
        assertEquals(12.0, response.getTotalMetrosConsumidos());
        assertEquals(7.5, response.getTotalMetrosUtiles());
    }

    @Test
    @DisplayName("Debe lanzar excepción si una pieza supera la longitud máxima de la varilla")
    void testPiezaExcedeLongitudVarilla() {
        OptimizadorRequestDTO request = OptimizadorRequestDTO.builder()
                .longitudVarillaEstandarMm(3000.0)
                .anchoSierraMm(3.0)
                .cortes(Collections.singletonList(
                        new CorteItemDTO(3500.0, "Perfil gigante", 1)
                ))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                corteVarillaService.optimizarCorte(request));
        assertTrue(ex.getMessage().contains("excede la longitud estándar"));
    }

    @Test
    @DisplayName("Debe manejar lista vacía de cortes retornando 0 varillas")
    void testListaVacia() {
        OptimizadorRequestDTO request = OptimizadorRequestDTO.builder()
                .longitudVarillaEstandarMm(6000.0)
                .anchoSierraMm(3.0)
                .cortes(Collections.emptyList())
                .build();

        OptimizadorResponseDTO response = corteVarillaService.optimizarCorte(request);
        assertEquals(0, response.getTotalVarillas());
        assertEquals(0.0, response.getTotalMetrosConsumidos());
    }
}
