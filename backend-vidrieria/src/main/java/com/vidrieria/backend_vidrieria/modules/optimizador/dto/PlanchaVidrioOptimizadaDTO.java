package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Representa una plancha estándar de vidrio optimizada con el acomodo 2D
 * de piezas y las áreas de retazo resultantes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanchaVidrioOptimizadaDTO {

    /**
     * Número de plancha (1, 2, 3, ...).
     */
    private Integer numeroPlancha;

    /**
     * Ancho de la plancha en milímetros.
     */
    private Double anchoPlanchaMm;

    /**
     * Alto de la plancha en milímetros.
     */
    private Double altoPlanchaMm;

    /**
     * Total de piezas ubicadas en esta plancha.
     */
    private Integer totalPiezas;

    /**
     * Área bruta total de la plancha en m².
     */
    private Double areaPlanchaM2;

    /**
     * Área neta ocupada por piezas útiles en m².
     */
    private Double areaUtilM2;

    /**
     * Área total de desperdicio y retazos en m².
     */
    private Double areaDesperdicioM2;

    /**
     * Porcentaje de aprovechamiento útil de esta plancha (0 a 100%).
     */
    private Double porcentajeAprovechamiento;

    /**
     * Lista de piezas con coordenadas (x, y, ancho, alto) dispuestas en esta plancha.
     */
    @Builder.Default
    private List<PiezaVidrioUbicadaDTO> piezas = new ArrayList<>();

    /**
     * Lista de rectángulos libres o retazos resultantes en la plancha.
     */
    @Builder.Default
    private List<RetazoVidrioDTO> retazos = new ArrayList<>();
}
