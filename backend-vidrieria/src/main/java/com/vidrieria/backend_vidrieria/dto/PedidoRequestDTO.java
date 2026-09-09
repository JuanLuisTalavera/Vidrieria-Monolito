package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoRequestDTO {

    private String clienteNombre;
    private String clienteTelefono;
    private String referenciaObra;
    private String tipoTrabajo;
    private BigDecimal total;
    private BigDecimal montoAdelanto;
    private String tipoComprobante;
    private String metodoPago;
    private List<DetallePedidoRequestDTO> detalles;
}
