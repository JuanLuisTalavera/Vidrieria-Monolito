package com.vidrieria.backend_vidrieria.dto;

import com.vidrieria.backend_vidrieria.entity.TipoEstructura;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionObraResponseDTO {

    private Long id;
    private Integer idCliente;
    private String nombreCliente;
    private Double anchoVanoMm;
    private Double altoVanoMm;
    private TipoEstructura tipoEstructura;
    private Integer idVidrio;
    private String nombreVidrio;
    private String colorAluminio;
    private Double costoAluminio;
    private Double costoVidrio;
    private Double costoAccesorios;
    private Double costoManoObra;
    private Double precioTotal;
    private String observaciones;
    private LocalDateTime fechaRegistro;
}
