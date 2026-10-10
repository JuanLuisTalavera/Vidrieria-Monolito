package com.vidrieria.backend_vidrieria.modules.inventario.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Tipos de cobro admitidos para manufactura de vidrio y servicios complementarios.
 */
public enum TipoCobro {
    /**
     * Cobro por metro lineal (ej. pulido de bordes, biselado, corte de perfil).
     */
    METRO_LINEAL,

    /**
     * Cobro por unidad fija (ej. perforación de huecos para tiradores, cerraduras, bisagras).
     */
    UNIDAD,

    /**
     * Cobro por metro cuadrado (ej. arenado, laminado, templado superficial, pavonado).
     */
    METRO_CUADRADO,

    /**
     * Cobro de tarifa fija global (ej. transporte, instalación en obra, desmontaje).
     */
    GLOBAL;

    @JsonValue
    public String getValor() {
        return this.name();
    }

    @JsonCreator
    public static TipoCobro fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String clean = value.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        for (TipoCobro tc : TipoCobro.values()) {
            if (tc.name().equals(clean)) {
                return tc;
            }
        }
        throw new IllegalArgumentException("Tipo de cobro inválido: '" + value +
                "'. Valores permitidos: METRO_LINEAL, UNIDAD, METRO_CUADRADO, GLOBAL");
    }
}
