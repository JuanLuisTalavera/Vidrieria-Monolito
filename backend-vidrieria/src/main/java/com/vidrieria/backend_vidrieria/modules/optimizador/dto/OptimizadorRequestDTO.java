package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizadorRequestDTO {

    /**
     * Longitud de la barra o varilla estándar en mm (ej. 6000 mm para aluminio, 3000 mm para molduras).
     * Por defecto se asume 6000 mm si es nulo.
     */
    @NotNull(message = "La longitud de varilla estándar es obligatoria")
    @Min(value = 100, message = "La longitud estándar debe ser al menos de 100 mm")
    private Double longitudVarillaEstandarMm;

    /**
     * Espesor o merma del disco de sierra por corte en mm (ej. 3.0 mm a 5.0 mm).
     * Por defecto se asume 3.0 mm si es nulo.
     */
    @Builder.Default
    private Double anchoSierraMm = 3.0;

    @NotEmpty(message = "La lista de cortes no puede estar vacía")
    @Valid
    private List<CorteItemDTO> cortes;
}
