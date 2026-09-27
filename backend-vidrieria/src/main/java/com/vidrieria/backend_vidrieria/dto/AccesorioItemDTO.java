package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccesorioItemDTO {

    private String descripcion;
    private Double cantidad;
    private String unidad;
    private Double costoEstimado;
}
