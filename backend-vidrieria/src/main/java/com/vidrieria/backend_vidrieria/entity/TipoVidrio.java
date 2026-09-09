package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "tipos_vidrio")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoVidrio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vidrio")
    private Integer idVidrio;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "imagen_url", length = 255)
    private String imagenUrl;

    @Column(name = "es_templado")
    private Boolean esTemplado;

    @Column(name = "dias_produccion")
    private Integer diasProduccion;

    @Column(name = "costo_defecto_m2", precision = 10, scale = 2)
    private BigDecimal costoDefectoM2;

    @Column(name = "id_proveedor_habitual")
    private Integer idProveedorHabitual;

    @Column(name = "activo")
    private Boolean activo;

    // --- Campos para motor de precios dinámico ---

    @Column(name = "precio_plancha", precision = 10, scale = 2)
    private BigDecimal precioPlancha;

    @Column(name = "ancho_plancha", precision = 10, scale = 2)
    private BigDecimal anchoPlancha;

    @Column(name = "alto_plancha", precision = 10, scale = 2)
    private BigDecimal altoPlancha;

    @Column(name = "margen_mayorista", precision = 5, scale = 4)
    private BigDecimal margenMayorista;

    @Column(name = "margen_publico", precision = 5, scale = 4)
    private BigDecimal margenPublico;

    @Column(name = "margen_corte_chico", precision = 5, scale = 4)
    private BigDecimal margenCorteChico;
}
