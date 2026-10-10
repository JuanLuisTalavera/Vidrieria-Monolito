package com.vidrieria.backend_vidrieria.modules.cotizador.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculoDespieceRequestDTO {
    private Integer idSistema;
    private Double ancho;
    private Double alto;
    private Integer cantidadVentanas;
}
