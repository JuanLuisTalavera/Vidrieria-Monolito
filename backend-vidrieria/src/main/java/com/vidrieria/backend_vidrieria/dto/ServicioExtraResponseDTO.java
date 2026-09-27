package com.vidrieria.backend_vidrieria.dto;

import com.vidrieria.backend_vidrieria.entity.TipoCobro;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicioExtraResponseDTO {

    private Integer id;
    private Integer idExtra;
    private String nombre;
    private String descripcion;
    private String categoriaAplicable;
    private TipoCobro tipoCobro;
    private BigDecimal precioBase;
    private BigDecimal precioSugerido;
    private Boolean activo;
}
