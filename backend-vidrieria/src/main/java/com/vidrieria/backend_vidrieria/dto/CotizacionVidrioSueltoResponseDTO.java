package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO de respuesta para cotización de vidrios sueltos con desglose de
 * costos de material (cristal) y procesamiento de manufactura (pulido, biselado, perforaciones).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionVidrioSueltoResponseDTO {

    // --- Datos del Vidrio ---
    private Integer idVidrio;
    private String nombreVidrio;
    private Boolean esTemplado;
    private Double anchoMm;
    private Double altoMm;
    private Integer cantidad;

    // --- Cálculo de Área y Material ---
    private BigDecimal areaM2Individual;
    private BigDecimal areaM2Total;
    private BigDecimal costoM2Vidrio;
    private BigDecimal subtotalVidrio;

    // --- Procesamiento: Pulido ---
    private Double metrosPulido;
    private BigDecimal costoMetroPulido;
    private BigDecimal subtotalPulido;
    private String nombreServicioPulido;

    // --- Procesamiento: Biselado ---
    private Double metrosBiselado;
    private BigDecimal costoMetroBiselado;
    private BigDecimal subtotalBiselado;
    private String nombreServicioBiselado;

    // --- Procesamiento: Perforaciones / Huecos ---
    private Integer cantidadHuecos;
    private BigDecimal costoUnitarioHueco;
    private BigDecimal subtotalHuecos;
    private String nombreServicioHueco;

    // --- Totales ---
    private BigDecimal subtotalNeto;
    private BigDecimal totalRedondeado;
    private BigDecimal totalCalculado;
}
