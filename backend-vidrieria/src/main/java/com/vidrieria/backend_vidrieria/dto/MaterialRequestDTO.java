package com.vidrieria.backend_vidrieria.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class MaterialRequestDTO {

    private String nombre;
    private String descripcion;

    @JsonAlias({"tipoMaterial", "tipo_material", "categoria"})
    private CategoriaMaterial tipoMaterial;

    @JsonAlias({"imagenUrl", "imagen_url"})
    private String imagenUrl;

    @JsonAlias({"costoDefectoUnitario", "costo_defecto_unitario", "costoUnitario"})
    private BigDecimal costoDefectoUnitario;

    @JsonAlias({"idProveedorHabitual", "id_proveedor_habitual", "idProveedor"})
    private Integer idProveedorHabitual;

    // Motor de precios dinámico
    @JsonAlias({"precioVarilla", "precio_varilla"})
    private BigDecimal precioVarilla;

    @JsonAlias({"longitudVarilla", "longitud_varilla"})
    private BigDecimal longitudVarilla;

    @JsonAlias({"margenMayorista", "margen_mayorista"})
    private BigDecimal margenMayorista;

    @JsonAlias({"margenPublico", "margen_publico"})
    private BigDecimal margenPublico;

    @JsonAlias({"margenCorteChico", "margen_corte_chico"})
    private BigDecimal margenCorteChico;

    private Double stock;
}
