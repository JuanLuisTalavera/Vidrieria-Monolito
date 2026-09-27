package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cotizaciones_obras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionObra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cotizacion_obra")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @Column(name = "ancho_vano_mm", nullable = false)
    private Double anchoVanoMm;

    @Column(name = "alto_vano_mm", nullable = false)
    private Double altoVanoMm;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_estructura", nullable = false, length = 50)
    private TipoEstructura tipoEstructura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vidrio")
    private TipoVidrio tipoCristal;

    @Column(name = "color_aluminio", length = 50)
    private String colorAluminio;

    @Column(name = "costo_aluminio")
    private Double costoAluminio;

    @Column(name = "costo_vidrio")
    private Double costoVidrio;

    @Column(name = "costo_accesorios")
    private Double costoAccesorios;

    @Column(name = "costo_mano_obra")
    private Double costoManoObra;

    @Column(name = "precio_total", nullable = false)
    private Double precioTotal;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDateTime.now();
        }
    }
}
