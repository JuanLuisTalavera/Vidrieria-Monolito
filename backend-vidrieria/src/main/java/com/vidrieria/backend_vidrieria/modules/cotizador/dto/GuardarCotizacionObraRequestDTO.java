package com.vidrieria.backend_vidrieria.modules.cotizador.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.TipoEstructura;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardarCotizacionObraRequestDTO {

    @NotNull(message = "El ancho del vano en mm es obligatorio")
    @Min(value = 100, message = "El ancho del vano debe ser al menos 100 mm")
    private Double anchoVanoMm;

    @NotNull(message = "El alto del vano en mm es obligatorio")
    @Min(value = 100, message = "El alto del vano debe ser al menos 100 mm")
    private Double altoVanoMm;

    @NotNull(message = "El tipo de estructura es obligatorio")
    private TipoEstructura tipoEstructura;

    private Integer idVidrio;
    private Integer idCliente;
    private String colorAluminio;

    private Double costoAluminio;
    private Double costoVidrio;
    private Double costoAccesorios;
    private Double costoManoObra;
    private Double precioTotal;
    private String observaciones;
}
