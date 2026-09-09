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
public class CotizacionResponseDTO {

    private BigDecimal costoVidrio;
    private BigDecimal costoMoldura;
    private BigDecimal costoExtras;
    private BigDecimal subtotal;
    private BigDecimal totalCalculado;
}
