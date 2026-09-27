package com.vidrieria.backend_vidrieria.dto;

import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
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
    private String descripcion;
    private CategoriaMaterial tipoMaterial;
    private String imagenUrl;
    private BigDecimal costoDefectoUnitario;
    private Integer idProveedorHabitual;

    // Datos base de varilla y márgenes comerciales
    private BigDecimal precioVarilla;
    private BigDecimal longitudVarilla;
    private BigDecimal margenMayorista;
    private BigDecimal margenPublico;
    private BigDecimal margenCorteChico;

    // Precios por metro lineal
    private BigDecimal costoRealMetro;
    private BigDecimal precioMayoristaMetro;
    private BigDecimal precioPublicoMetro;
    private BigDecimal precioCorteChicoMetro;

    // Precios por varilla entera
    private BigDecimal precioMayoristaVarilla;
    private BigDecimal precioPublicoVarilla;
    private BigDecimal precioCorteChicoVarilla;
    private Double stock;
}
