package com.vidrieria.backend_vidrieria.modules.inventario.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "materiales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_material")
    private Integer idMaterial;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Convert(converter = CategoriaMaterialConverter.class)
    @Column(name = "tipo_material", length = 50)
    @Builder.Default
    private CategoriaMaterial tipoMaterial = CategoriaMaterial.OTROS;

    @Column(name = "imagen_url", length = 255)
    private String imagenUrl;

    @Column(name = "costo_defecto_unitario", precision = 10, scale = 2)
    private BigDecimal costoDefectoUnitario;

    @Column(name = "id_proveedor_habitual")
    private Integer idProveedorHabitual;

    @Column(name = "activo")
    private Boolean activo;

    // --- Campos para motor de precios dinámico ---

    @Column(name = "precio_varilla", precision = 10, scale = 2)
    private BigDecimal precioVarilla;

    @Column(name = "longitud_varilla", precision = 10, scale = 2)
    private BigDecimal longitudVarilla;

    @Column(name = "margen_mayorista", precision = 5, scale = 4)
    private BigDecimal margenMayorista;

    @Column(name = "margen_publico", precision = 5, scale = 4)
    private BigDecimal margenPublico;

    @Column(name = "margen_corte_chico", precision = 5, scale = 4)
    private BigDecimal margenCorteChico;

    @Column(name = "stock")
    @Builder.Default
    private Double stock = 0.0;
}
