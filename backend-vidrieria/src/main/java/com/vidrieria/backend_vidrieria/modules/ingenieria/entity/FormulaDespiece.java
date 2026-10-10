package com.vidrieria.backend_vidrieria.modules.ingenieria.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "formulas_despiece")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormulaDespiece {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_formula")
    private Integer idFormula;

    @Column(name = "id_sistema")
    private Integer idSistema;

    @Column(name = "tipo_elemento", nullable = false, length = 50)
    private String tipoElemento;

    @Column(name = "id_material_defecto")
    private Integer idMaterialDefecto;

    @Column(name = "cantidad_piezas", nullable = false)
    private Integer cantidadPiezas;

    @Column(name = "formula_largo", nullable = false, columnDefinition = "TEXT")
    private String formulaLargo;

    @Column(name = "formula_alto", columnDefinition = "TEXT")
    private String formulaAlto;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;
}
