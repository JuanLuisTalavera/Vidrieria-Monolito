package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Entidad que representa servicios adicionales y procesos de manufactura del vidrio
 * (pulido, biselado, perforaciones/huecos, arenado, instalación, fletes, etc.).
 */
@Entity
@Table(name = "servicios_extras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicioExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_extra")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "categoria_aplicable", length = 50)
    private String categoriaAplicable;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_cobro", length = 50, nullable = false)
    @Builder.Default
    private TipoCobro tipoCobro = TipoCobro.UNIDAD;

    @Column(name = "precio_base", precision = 10, scale = 2)
    private BigDecimal precioBase;

    @Column(name = "precio_sugerido", precision = 10, scale = 2)
    private BigDecimal precioSugerido;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    // --- Métodos de compatibilidad hacia atrás para idExtra ---
    public Integer getIdExtra() {
        return this.id;
    }

    public void setIdExtra(Integer idExtra) {
        this.id = idExtra;
    }

    // --- Getters inteligentes para asegurar disponibilidad de precioBase y precioSugerido ---
    public BigDecimal getPrecioBase() {
        return precioBase != null ? precioBase : precioSugerido;
    }

    public BigDecimal getPrecioSugerido() {
        return precioSugerido != null ? precioSugerido : precioBase;
    }

    @PrePersist
    @PreUpdate
    public void syncPreciosYValoresPorDefecto() {
        if (this.precioBase == null && this.precioSugerido != null) {
            this.precioBase = this.precioSugerido;
        } else if (this.precioSugerido == null && this.precioBase != null) {
            this.precioSugerido = this.precioBase;
        }
        if (this.activo == null) {
            this.activo = true;
        }
        if (this.tipoCobro == null) {
            this.tipoCobro = TipoCobro.UNIDAD;
        }
    }
}
