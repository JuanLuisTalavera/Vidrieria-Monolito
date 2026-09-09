package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoResponseDTO {

    private Integer idPago;
    private BigDecimal monto;
    private String metodoPago;
    private String tipoPago;
    private LocalDateTime fechaRegistro;

    // Datos del pedido y cliente asociado
    private Integer idPedido;
    private String clienteNombre;
    private String clienteTelefono;
    private String tipoComprobante;
    private BigDecimal totalPedido;
    private BigDecimal saldoPendientePedido;

    // Usuario que registró el cobro
    private Integer idRegistrador;
    private String registradorUsername;
}
