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
public class TipoVidrioRequestDTO {

    private String nombre;
    private String descripcion;
    private String imagenUrl;
    private Boolean esTemplado;
    private Integer diasProduccion;
    private BigDecimal costoDefectoM2;
    private Integer idProveedorHabitual;

    // Motor de precios dinámico
    private BigDecimal precioPlancha;
    private BigDecimal anchoPlancha;
    private BigDecimal altoPlancha;
    private BigDecimal margenMayorista;
    private BigDecimal margenPublico;
    private BigDecimal margenCorteChico;
}
