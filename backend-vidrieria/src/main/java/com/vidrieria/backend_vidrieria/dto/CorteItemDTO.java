package com.vidrieria.backend_vidrieria.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorteItemDTO {

    @NotNull(message = "La longitud en mm es obligatoria")
    @Min(value = 1, message = "La longitud debe ser al menos 1 mm")
    private Double longitudMm;

    private String etiqueta;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;
}
