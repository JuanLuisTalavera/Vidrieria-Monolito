package com.vidrieria.backend_vidrieria.modules.finanzas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "gastos_caja_chica")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GastoCajaChica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gasto")
    private Integer idGasto;

    @Column(name = "motivo", nullable = false, length = 255)
    private String motivo;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "categoria", length = 100)
    private String categoria;

    @Column(name = "fecha_gasto")
    private Instant fechaGasto;

    @Column(name = "id_usuario_registra")
    private Integer idUsuarioRegistra;
}
