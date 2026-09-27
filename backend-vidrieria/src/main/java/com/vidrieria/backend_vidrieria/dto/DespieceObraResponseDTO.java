package com.vidrieria.backend_vidrieria.dto;

import com.vidrieria.backend_vidrieria.entity.TipoEstructura;
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
public class DespieceObraResponseDTO {

    private TipoEstructura tipoEstructura;
    private Double anchoVanoMm;
    private Double altoVanoMm;
    private String colorAluminio;

    @Builder.Default
    private List<PiezaAluminioDTO> piezasAluminio = new ArrayList<>();

    @Builder.Default
    private List<PiezaCristalDTO> piezasCristal = new ArrayList<>();

    @Builder.Default
    private List<AccesorioItemDTO> accesorios = new ArrayList<>();

    private OptimizadorResponseDTO optimizacionVarillas;
    private DesgloseCostosDTO desgloseCostos;
}
