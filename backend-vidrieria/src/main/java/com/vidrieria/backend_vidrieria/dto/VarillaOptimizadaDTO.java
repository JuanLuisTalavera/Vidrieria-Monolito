package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VarillaOptimizadaDTO {

    private Integer numeroVarilla;
    private Double longitudTotalMm;

    @Builder.Default
    private List<SegmentoCorteDTO> segmentos = new ArrayList<>();

    private Double mermaCorteMm;
    private Double retazoSobranteMm;
    private Double porcentajeAprovechamiento;
}
