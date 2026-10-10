package com.vidrieria.backend_vidrieria.modules.finanzas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

import com.vidrieria.backend_vidrieria.modules.pedidos.entity.Pedido;

@Entity
@Table(name = "pagos_parciales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoParcial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Integer idPago;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "tipo_movimiento", length = 50)
    private String tipoMovimiento;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "fecha_pago")
    private Instant fechaPago;

    @Column(name = "nota", columnDefinition = "TEXT")
    private String nota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido")
    private Pedido pedido;
}
