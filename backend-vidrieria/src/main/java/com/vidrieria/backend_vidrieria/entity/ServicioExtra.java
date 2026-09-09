package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "servicios_extras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicioExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_extra")
    private Integer idExtra;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "categoria_aplicable", length = 50)
    private String categoriaAplicable;

    @Column(name = "tipo_cobro", length = 50)
    private String tipoCobro;

    @Column(name = "precio_sugerido", precision = 10, scale = 2)
    private BigDecimal precioSugerido;

    @Column(name = "activo")
    private Boolean activo;
}
