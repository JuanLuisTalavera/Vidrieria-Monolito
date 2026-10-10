package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

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
public class OptimizadorResponseDTO {

    private Double longitudVarillaEstandarMm;
    private Double anchoSierraMm;
    private Integer totalVarillas;
    private Double totalMetrosConsumidos;
    private Double totalMetrosUtiles;
    private Double totalDesperdicioMm;
    private Double porcentajeAprovechamientoGlobal;

    @Builder.Default
    private List<VarillaOptimizadaDTO> varillas = new ArrayList<>();
}
