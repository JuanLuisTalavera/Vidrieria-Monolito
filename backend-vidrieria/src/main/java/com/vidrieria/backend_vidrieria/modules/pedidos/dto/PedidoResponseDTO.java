package com.vidrieria.backend_vidrieria.modules.pedidos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.finanzas.dto.PagoResponseDTO;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoResponseDTO {

    private Integer idPedido;
    private String clienteNombre;
    private String clienteTelefono;
    private String referenciaObra;
    private String tipoTrabajo;
    private String estado;
    private BigDecimal total;
    private BigDecimal montoAdelanto;
    private BigDecimal saldoPendiente;
    private String tipoComprobante;
    private String metodoPago;
    private java.time.LocalDateTime fechaRegistro;
    private java.time.LocalDateTime fechaEntrega;
    private Integer idVendedor;
    private String vendedorUsername;
    private List<DetalleResponseDTO> detalles;
    private List<PagoResponseDTO> pagos;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetalleResponseDTO {
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
}
