package com.vidrieria.backend_vidrieria.modules.ingenieria.dto;

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
public class DespieceObraRequestDTO {

    @NotNull(message = "El ancho del vano en mm es obligatorio")
    @Min(value = 100, message = "El ancho del vano debe ser al menos 100 mm")
    private Double anchoVanoMm;

    @NotNull(message = "El alto del vano en mm es obligatorio")
    @Min(value = 100, message = "El alto del vano debe ser al menos 100 mm")
    private Double altoVanoMm;

    private TipoEstructura tipoEstructura;

    private Integer idSistema;

    private Integer idVidrio;
    private Integer idCliente;
    private String colorAluminio;

    // Parámetros opcionales para personalizar costos
    private Double costoAluminioPorVarilla;
    private Double costoM2Vidrio;
    private Double costoManoObra;
    private Double margenGanancia;

    @Builder.Default
    private Double anchoSierraMm = 3.0;
}
