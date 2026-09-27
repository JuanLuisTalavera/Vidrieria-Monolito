package com.vidrieria.backend_vidrieria.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TipoVidrioRequestDTO {

    private String nombre;
    private String descripcion;
    private String imagenUrl;
    private Boolean esTemplado;
    private Integer diasProduccion;

    @JsonAlias({"costoDefectoM2", "costo_defecto_m2", "costoM2"})
    private BigDecimal costoDefectoM2;

    @JsonAlias({"idProveedorHabitual", "id_proveedor_habitual", "idProveedor"})
    private Integer idProveedorHabitual;

    // Motor de precios dinámico
    @JsonAlias({"precioPlancha", "precio_plancha"})
    private BigDecimal precioPlancha;

    @JsonAlias({"anchoPlancha", "ancho_plancha"})
    private BigDecimal anchoPlancha;

    @JsonAlias({"altoPlancha", "alto_plancha"})
    private BigDecimal altoPlancha;

    @JsonAlias({"margenMayorista", "margen_mayorista"})
    private BigDecimal margenMayorista;

    @JsonAlias({"margenPublico", "margen_publico"})
    private BigDecimal margenPublico;

    @JsonAlias({"margenCorteChico", "margen_corte_chico"})
    private BigDecimal margenCorteChico;

    private Double stock;

    // Dimensiones estándar de fábrica en mm para optimizador
    @JsonAlias({"anchoPlanchaMm", "ancho_plancha_mm", "anchoMm"})
    private Double anchoPlanchaMm;

    @JsonAlias({"altoPlanchaMm", "alto_plancha_mm", "altoMm"})
    private Double altoPlanchaMm;
}
