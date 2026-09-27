package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un retazo o área sobrante (desperdicio o retazo aprovechable)
 * dentro de una plancha de vidrio con coordenadas para visualización en frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetazoVidrioDTO {

    /**
     * Identificador del retazo dentro de la plancha.
     */
    private Integer idRetazo;

    /**
     * Coordenada X inicial en mm.
     */
    private Double x;

    /**
     * Coordenada Y inicial en mm.
     */
    private Double y;

    /**
     * Ancho del retazo en mm.
     */
    private Double ancho;

    /**
     * Alto del retazo en mm.
     */
    private Double alto;

    /**
     * Área en metros cuadrados (m²).
     */
    private Double areaM2;

    /**
     * Indica si el retazo tiene dimensiones suficientes para ser reutilizado en taller.
     */
    private Boolean reutilizable;
}
