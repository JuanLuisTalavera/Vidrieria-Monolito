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
public class MaterialRequestDTO {

    private String nombre;
    private String descripcion;
    private String tipoMaterial;
    private String imagenUrl;
    private BigDecimal costoDefectoUnitario;
    private Integer idProveedorHabitual;

    // Motor de precios dinámico
    private BigDecimal precioVarilla;
    private BigDecimal longitudVarilla;
    private BigDecimal margenMayorista;
    private BigDecimal margenPublico;
    private BigDecimal margenCorteChico;
}
