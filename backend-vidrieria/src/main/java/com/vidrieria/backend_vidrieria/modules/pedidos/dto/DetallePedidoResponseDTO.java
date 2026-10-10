package com.vidrieria.backend_vidrieria.modules.pedidos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetallePedidoResponseDTO {

    private Integer idDetalle;
    private BigDecimal alto;
    private BigDecimal ancho;
    private Integer cantidad;
    private BigDecimal subtotal;
    private Integer idMoldura;
    private String nombreMoldura;
    private Integer idVidrio;
    private String nombreVidrio;
    private String descripcion;
    private BigDecimal precioUnitario;
    private BigDecimal anchoVano;
    private BigDecimal altoVano;
    private String detallesDespiece;

    @Builder.Default
    private Boolean descontarStock = true;

    public Boolean getDescontarStock() {
        return descontarStock != null ? descontarStock : true;
    }

    public Boolean isDescontarStock() {
        return getDescontarStock();
    }
}
