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
public class DetallePedidoRequestDTO {

    private BigDecimal alto;
    private BigDecimal ancho;
    private Integer cantidad;
    private BigDecimal subtotal;
    private Integer idMoldura;
    private Integer idVidrio;

    private String descripcion;
    private BigDecimal precioUnitario;
    private BigDecimal anchoVano;
    private BigDecimal altoVano;
    private String detallesDespiece;
}
