package com.vidrieria.backend_vidrieria.modules.pedidos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.seguridad.entity.Usuario;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Integer idPedido;

    @Column(name = "cliente_nombre", nullable = false, length = 200)
    private String clienteNombre;

    @Column(name = "cliente_telefono", length = 30)
    private String clienteTelefono;

    @Column(name = "referencia_obra", length = 255)
    private String referenciaObra;

    @Column(name = "tipo_trabajo", length = 50)
    private String tipoTrabajo;

    @Column(name = "estado", length = 50)
    private String estado;

    @Column(name = "total", precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "monto_adelanto", precision = 12, scale = 2)
    private BigDecimal montoAdelanto;

    @Column(name = "saldo_pendiente", precision = 12, scale = 2)
    private BigDecimal saldoPendiente;

    @Column(name = "tipo_comprobante", length = 20)
    private String tipoComprobante;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vendedor")
    private Usuario vendedor;

    @Column(name = "fecha_creacion")
    private java.time.Instant fechaCreacion;

    @Column(name = "fecha_registro")
    private java.time.LocalDateTime fechaRegistro;

    @Column(name = "fecha_entrega")
    private java.time.LocalDateTime fechaEntrega;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DetallePedido> detalles = new ArrayList<>();

    @PrePersist
    public void asignarValoresPorDefecto() {
        if (this.tipoComprobante == null || this.tipoComprobante.isBlank()) {
            this.tipoComprobante = "NOTA_VENTA";
        }
        if (this.metodoPago == null || this.metodoPago.isBlank()) {
            this.metodoPago = "EFECTIVO";
        }
        if (this.fechaCreacion == null) {
            this.fechaCreacion = java.time.Instant.now();
        }
        if (this.fechaRegistro == null) {
            this.fechaRegistro = java.time.LocalDateTime.now();
        }
    }

    // --- Método helper para mantener la bidireccionalidad ---
    public void agregarDetalle(DetallePedido detalle) {
        detalles.add(detalle);
        detalle.setPedido(this);
    }
}
