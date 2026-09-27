package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoVidrioResponseDTO {

    private Integer idVidrio;
    private String nombre;
    private String descripcion;
    private String imagenUrl;
    private Boolean esTemplado;
    private Integer diasProduccion;
    private Integer idProveedorHabitual;

    // Datos base de plancha y precios de fábrica
    private BigDecimal costoDefectoM2;
    private BigDecimal precioPlancha;
    private BigDecimal margenMayorista;
    private BigDecimal margenPublico;
    private BigDecimal margenCorteChico;

    // Dimensiones estándar de fábrica en mm para optimizador y trazador
    @Builder.Default
    private Double anchoPlancha = 2440.0;

    @Builder.Default
    private Double altoPlancha = 3660.0;

    @Builder.Default
    private Double anchoPlanchaMm = 2440.0;

    @Builder.Default
    private Double altoPlanchaMm = 3660.0;

    // Precios calculados dinámicamente
    private BigDecimal costoRealM2;

    private BigDecimal precioMayoristaM2;
    private BigDecimal precioMayoristaPie2;

    private BigDecimal precioPublicoM2;
    private BigDecimal precioPublicoPie2;

    private BigDecimal precioCorteChicoM2;
    private BigDecimal precioCorteChicoPie2;
    private Double stock;

    public Double getAnchoPlancha() {
        return anchoPlancha != null ? anchoPlancha : (anchoPlanchaMm != null ? anchoPlanchaMm : 2440.0);
    }

    public Double getAltoPlancha() {
        return altoPlancha != null ? altoPlancha : (altoPlanchaMm != null ? altoPlanchaMm : 3660.0);
    }

    public Double getAnchoPlanchaMm() {
        return anchoPlanchaMm != null ? anchoPlanchaMm : (anchoPlancha != null ? anchoPlancha : 2440.0);
    }

    public Double getAltoPlanchaMm() {
        return altoPlanchaMm != null ? altoPlanchaMm : (altoPlancha != null ? altoPlancha : 3660.0);
    }
}
