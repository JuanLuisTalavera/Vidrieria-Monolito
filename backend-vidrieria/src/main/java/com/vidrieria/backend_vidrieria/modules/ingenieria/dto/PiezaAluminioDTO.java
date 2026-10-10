package com.vidrieria.backend_vidrieria.modules.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PiezaAluminioDTO {

    private String nombrePerfil;
    private String formula;
    private Double longitudMm;
    private Integer cantidad;
    private Double longitudTotalMm;
}
