package com.vidrieria.backend_vidrieria.modules.ingenieria.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PiezaCristalDTO {

    private String descripcion;

    @JsonAlias({"ancho", "anchoMm", "width", "w"})
    private Double anchoMm;

    @JsonAlias({"alto", "altoMm", "height", "h", "largo", "largoMm"})
    private Double altoMm;

    @JsonAlias({"cantidad", "qty", "count"})
    private Integer cantidad;
    private Double areaM2Unitaria;
    private Double areaM2Total;

    public Double getAncho() {
        return anchoMm;
    }

    public void setAncho(Double ancho) {
        this.anchoMm = ancho;
    }

    public Double getAlto() {
        return altoMm;
    }

    public void setAlto(Double alto) {
        this.altoMm = alto;
    }
}
