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
public class DashboardResponseDTO {

    private BigDecimal cajaReal;
    private BigDecimal ventasFormales;
    private BigDecimal ventasInternas;
    private BigDecimal cuentasPorCobrar;
    private Integer pedidosEnTaller;
    private Integer pedidosListos;
    private Integer pedidosEntregados;
    private java.util.List<PagoResponseDTO> pagosDelDia;
    private java.util.List<PagoResponseDTO> ventasDeHoy;
}
