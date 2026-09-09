package com.vidrieria.backend_vidrieria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SistemaCarpinteriaResponseDTO {

    private Integer idSistema;
    private String codigo;
    private String nombre;
    private String tipoEstructura;
    private Integer numeroHojas;
    private BigDecimal alturaMaximaRecomendada;
    private String descripcion;
    private Boolean activo;
}
