package com.vidrieria.backend_vidrieria.modules.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoCobro;

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
