package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesgloseCostosDTO {

    private Double costoAluminio;
    private Double costoCristal;
    private Double costoAccesorios;
    private Double costoManoObra;
    private Double subtotal;
    private Double precioTotal;
}
