package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_pedido")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle")
    private Integer idDetalle;

    @Column(name = "alto", precision = 10, scale = 4)
    private BigDecimal alto;

    @Column(name = "ancho", precision = 10, scale = 4)
    private BigDecimal ancho;

    @Column(name = "cantidad")
    private Integer cantidad;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido")
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_moldura")
    private Material moldura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vidrio")
    private TipoVidrio vidrio;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "precio_unitario", precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detalles_despiece", columnDefinition = "jsonb")
    private String detallesDespiece;
}
