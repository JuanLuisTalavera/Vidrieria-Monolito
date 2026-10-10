package com.vidrieria.backend_vidrieria.modules.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormulaDespieceResponseDTO {

    private Integer idFormula;
    private Integer idSistema;
    private String tipoElemento;
    private Integer idMaterialDefecto;
    private Integer cantidadPiezas;
    private String formulaLargo;
    private String formulaAlto;
    private String descripcion;
}
