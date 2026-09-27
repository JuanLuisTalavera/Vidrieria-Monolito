package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SegmentoCorteDTO {

    private Integer idSegmento;
    private String etiqueta;
    private Double longitudMm;
    private Double posicionInicialMm;
    private Double posicionFinalMm;
}
