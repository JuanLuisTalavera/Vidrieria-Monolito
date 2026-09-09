package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetalleCorteDTO {
    private String tipoElemento;
    private Double longitudCalculada;
    private Integer cantidadTotal;
}
