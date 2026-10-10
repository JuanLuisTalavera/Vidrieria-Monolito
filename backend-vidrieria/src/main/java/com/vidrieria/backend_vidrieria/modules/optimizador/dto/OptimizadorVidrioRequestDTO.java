package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaCristalDTO;

/**
 * Parámetros de solicitud para la optimización de corte de vidrio 2D (Bin Packing).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizadorVidrioRequestDTO {

    /**
     * Ancho total de la plancha grande de vidrio en milímetros (ej. 2500 mm, 3300 mm).
     */
    @NotNull(message = "El ancho de la plancha es obligatorio")
    @Min(value = 100, message = "El ancho de la plancha debe ser al menos de 100 mm")
    @JsonAlias({"anchoPlancha", "anchoPlanchaMm", "ancho", "anchoMm", "planchaAncho"})
    private Double anchoPlancha;

    /**
     * Alto total de la plancha grande de vidrio en milímetros (ej. 1800 mm, 2140 mm).
     */
    @NotNull(message = "El alto de la plancha es obligatorio")
    @Min(value = 100, message = "El alto de la plancha debe ser al menos de 100 mm")
    @JsonAlias({"altoPlancha", "altoPlanchaMm", "alto", "altoMm", "planchaAlto"})
    private Double altoPlancha;

    /**
     * Indica si se permite rotar las piezas 90° para optimizar el acomodo.
     * Por defecto es true.
     */
    @Builder.Default
    @JsonAlias({"permitirRotacion", "rotacion", "rotar"})
    private Boolean permitirRotacion = true;

    /**
     * Lista de piezas requeridas a cortar con sus dimensiones (ancho, alto, cantidad).
     */
    @NotEmpty(message = "La lista de piezas de cristal no puede estar vacía")
    @Valid
    @JsonAlias({"piezas", "piezasCristal", "cristales", "cortes"})
    private List<PiezaCristalDTO> piezas;
}
