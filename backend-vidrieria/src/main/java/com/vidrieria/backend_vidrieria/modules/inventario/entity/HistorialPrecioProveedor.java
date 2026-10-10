package com.vidrieria.backend_vidrieria.modules.inventario.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "historial_precios_proveedor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialPrecioProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial")
    private Integer idHistorial;

    @Column(name = "costo_anterior", precision = 10, scale = 2)
    private BigDecimal costoAnterior;

    @Column(name = "costo_nuevo", nullable = false, precision = 10, scale = 2)
    private BigDecimal costoNuevo;

    @Column(name = "fecha_cambio")
    private Instant fechaCambio;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vidrio")
    private TipoVidrio tipoVidrio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_material")
    private Material material;
}
