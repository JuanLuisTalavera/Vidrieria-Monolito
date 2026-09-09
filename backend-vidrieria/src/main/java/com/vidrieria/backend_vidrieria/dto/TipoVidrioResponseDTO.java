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
    private Boolean esTemplado;

    // Precios calculados dinámicamente
    private BigDecimal costoRealM2;

    private BigDecimal precioMayoristaM2;
    private BigDecimal precioMayoristaPie2;

    private BigDecimal precioPublicoM2;
    private BigDecimal precioPublicoPie2;

    private BigDecimal precioCorteChicoM2;
    private BigDecimal precioCorteChicoPie2;
}
