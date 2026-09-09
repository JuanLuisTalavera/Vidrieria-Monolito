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
public class MaterialResponseDTO {

    private Integer idMaterial;
    private String nombre;
    private String tipoMaterial;
    private BigDecimal longitudVarilla;

    // Precios por metro lineal
    private BigDecimal costoRealMetro;
    private BigDecimal precioMayoristaMetro;
    private BigDecimal precioPublicoMetro;
    private BigDecimal precioCorteChicoMetro;

    // Precios por varilla entera
    private BigDecimal precioMayoristaVarilla;
    private BigDecimal precioPublicoVarilla;
    private BigDecimal precioCorteChicoVarilla;
}
