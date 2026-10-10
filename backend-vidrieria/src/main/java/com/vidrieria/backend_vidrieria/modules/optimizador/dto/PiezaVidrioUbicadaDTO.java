package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa una pieza de cristal ya ubicada con coordenadas milimétricas
 * sobre una plancha de vidrio específica para ser graficada en frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PiezaVidrioUbicadaDTO {

    /**
     * Identificador secuencial único de la pieza ubicada.
     */
    private Integer idPieza;

    /**
     * Descripción o etiqueta identificatoria del cristal.
     */
    private String descripcion;

    /**
     * Coordenada X (origen horizontal) en milímetros dentro de la plancha.
     */
    private Double x;

    /**
     * Coordenada Y (origen vertical) en milímetros dentro de la plancha.
     */
    private Double y;

    /**
     * Ancho final en milímetros colocado en la plancha.
     */
    private Double ancho;

    /**
     * Alto final en milímetros colocado en la plancha.
     */
    private Double alto;

    /**
     * Indica si la pieza fue rotada 90° respecto a sus dimensiones originales.
     */
    private Boolean rotada;

    /**
     * Área útil neta de la pieza en metros cuadrados (m²).
     */
    private Double areaM2;
}
