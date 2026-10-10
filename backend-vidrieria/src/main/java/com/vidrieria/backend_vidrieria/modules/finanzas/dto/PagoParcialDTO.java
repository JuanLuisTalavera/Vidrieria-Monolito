package com.vidrieria.backend_vidrieria.modules.finanzas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoParcialDTO {

    private Integer idPedido;
    private BigDecimal monto;
    private String tipoMovimiento;
    private String metodoPago;
    private String nota;
}
