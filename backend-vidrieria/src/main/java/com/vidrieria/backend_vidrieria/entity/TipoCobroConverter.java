package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Convertidor JPA tolerante para TipoCobro.
 * Garantiza compatibilidad con valores históricos de base de datos
 * ('POR_METRO_LINEAL', 'POR_PIEZA', 'MONTO_FIJO') mapeándolos
 * a los nuevos estándares ('METRO_LINEAL', 'UNIDAD', 'METRO_CUADRADO', 'GLOBAL').
 */
@Converter(autoApply = true)
public class TipoCobroConverter implements AttributeConverter<TipoCobro, String> {

    @Override
    public String convertToDatabaseColumn(TipoCobro attribute) {
        if (attribute == null) {
            return TipoCobro.UNIDAD.name();
        }
        return attribute.name();
    }

    @Override
    public TipoCobro convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return TipoCobro.UNIDAD;
        }

        String valorLimpio = dbData.trim().toUpperCase().replace("-", "_").replace(" ", "_");

        try {
            return TipoCobro.valueOf(valorLimpio);
        } catch (IllegalArgumentException ex) {
            // Mapeo resiliente de valores históricos en BD
            if (valorLimpio.contains("LINEAL") || valorLimpio.contains("METRO")) {
                return TipoCobro.METRO_LINEAL;
            } else if (valorLimpio.contains("PIEZA") || valorLimpio.contains("UNID")) {
                return TipoCobro.UNIDAD;
            } else if (valorLimpio.contains("CUADRADO") || valorLimpio.contains("M2")) {
                return TipoCobro.METRO_CUADRADO;
            } else if (valorLimpio.contains("FIJO") || valorLimpio.contains("GLOBAL")) {
                return TipoCobro.GLOBAL;
            }
            return TipoCobro.UNIDAD;
        }
    }
}
