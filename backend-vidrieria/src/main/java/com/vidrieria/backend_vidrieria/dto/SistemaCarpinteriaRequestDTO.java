package com.vidrieria.backend_vidrieria.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SistemaCarpinteriaRequestDTO {

    @NotBlank(message = "El código del sistema es obligatorio")
    @Size(max = 50, message = "El código no debe exceder los 50 caracteres")
    private String codigo;

    @NotBlank(message = "El nombre del sistema es obligatorio")
    @Size(max = 150, message = "El nombre no debe exceder los 150 caracteres")
    private String nombre;

    @NotBlank(message = "El tipo de estructura es obligatorio")
    @Size(max = 50, message = "El tipo de estructura no debe exceder los 50 caracteres")
    private String tipoEstructura;

    private Integer numeroHojas;

    private BigDecimal alturaMaximaRecomendada;

    private String descripcion;

    @Builder.Default
    private Boolean activo = true;
}
