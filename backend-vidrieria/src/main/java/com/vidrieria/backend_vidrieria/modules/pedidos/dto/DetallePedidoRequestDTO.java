package com.vidrieria.backend_vidrieria.modules.pedidos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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

    @JsonAlias({"altoMm", "altoVano"})
    private BigDecimal alto;

    @JsonAlias({"anchoMm", "anchoVano"})
    private BigDecimal ancho;

    private Integer cantidad;

    @JsonAlias({"precioTotal", "total"})
    private BigDecimal subtotal;

    private Integer idMoldura;

    @JsonAlias({"vidrioId"})
    private Integer idVidrio;

    private String descripcion;

    @JsonAlias({"precio"})
    private BigDecimal precioUnitario;

    private String detallesDespiece;

    public BigDecimal getAnchoVano() {
        return ancho;
    }

    public BigDecimal getAltoVano() {
        return alto;
    }

    @Builder.Default
    private Boolean descontarStock = true;

    public Boolean getDescontarStock() {
        return descontarStock != null ? descontarStock : true;
    }

    public Boolean isDescontarStock() {
        return getDescontarStock();
    }
}
