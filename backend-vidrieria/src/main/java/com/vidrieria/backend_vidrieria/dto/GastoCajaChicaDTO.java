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
public class GastoCajaChicaDTO {

    private String motivo;
    private BigDecimal monto;
    private String categoria;
    private Integer idUsuarioRegistra;
}
