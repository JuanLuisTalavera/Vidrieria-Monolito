package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionRequestDTO {

    private Double ancho;
    private Double alto;
    private Integer idVidrio;
    private Integer idMaterialMoldura;
    private List<Integer> idsServiciosExtras;
}
