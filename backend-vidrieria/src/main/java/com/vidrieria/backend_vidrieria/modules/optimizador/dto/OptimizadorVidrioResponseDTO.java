package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.pedidos.entity.Pedido;

/**
 * Respuesta del optimizador de corte 2D con métricas globales y trazado por plancha.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizadorVidrioResponseDTO {

    /**
     * Ancho nominal de la plancha grande de vidrio en mm.
     */
    private Double anchoPlanchaMm;

    /**
     * Alto nominal de la plancha grande de vidrio en mm.
     */
    private Double altoPlanchaMm;

    /**
     * Número total de planchas requeridas para acomodar todas las piezas.
     */
    private Integer totalPlanchas;

    /**
     * Cantidad total de piezas solicitadas en el pedido.
     */
    private Integer totalPiezasSolicitadas;

    /**
     * Cantidad total de piezas que se lograron acomodar.
     */
    private Integer totalPiezasUbicadas;

    /**
     * Área total consumida sumando todas las planchas enteras utilizadas (m²).
     */
    private Double totalAreaPlanchasM2;

    /**
     * Área útil neta total de las piezas de cristal cortadas (m²).
     */
    private Double totalAreaUtilM2;

    /**
     * Área total de desperdicio y retazos en metros cuadrados (m²).
     */
    private Double totalAreaDesperdicioM2;

    /**
     * Área de retazos/desperdicio total en metros cuadrados (m²).
     */
    private Double areaRetazoTotalM2;

    /**
     * Área de retazos/desperdicio total en milímetros cuadrados (mm²).
     */
    private Double areaRetazoTotalMm2;

    /**
     * Alias de desperdicio/retazo para compatibilidad hacia atrás (m²).
     */
    private Double mermaTotal;

    /**
     * Alias de desperdicio/retazo en mm² para compatibilidad hacia atrás.
     */
    private Double mermaTotalMm2;

    /**
     * Porcentaje global de aprovechamiento del vidrio (0% a 100%).
     */
    private Double porcentajeAprovechamiento;

    /**
     * Alias del porcentaje de aprovechamiento global.
     */
    private Double porcentajeAprovechamientoGlobal;

    /**
     * Lista de planchas utilizadas con su detalle de cortes, coordenadas y retazos.
     */
    @Builder.Default
    private List<PlanchaVidrioOptimizadaDTO> planchas = new ArrayList<>();
}
