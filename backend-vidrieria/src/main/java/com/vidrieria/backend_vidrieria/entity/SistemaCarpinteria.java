package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "sistemas_carpinteria")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SistemaCarpinteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sistema")
    private Integer idSistema;

    @Column(name = "codigo", unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "tipo_estructura", nullable = false, length = 50)
    private String tipoEstructura;

    @Column(name = "numero_hojas")
    private Integer numeroHojas;

    @Column(name = "altura_maxima_recomendada", precision = 4, scale = 2)
    private BigDecimal alturaMaximaRecomendada;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "activo")
    private Boolean activo;
}
