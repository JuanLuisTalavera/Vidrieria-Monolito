package com.vidrieria.backend_vidrieria.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Convertidor JPA tolerante para CategoriaMaterial.
 * Asegura compatibilidad hacia atrás con registros existentes (ej. "ALUMINIO", "ACCESORIOS", "MADERA")
 * y previene caídas por valores imprevistos o nulos al consultar o persistir en la base de datos.
 */
@Converter(autoApply = true)
public class CategoriaMaterialConverter implements AttributeConverter<CategoriaMaterial, String> {

    @Override
    public String convertToDatabaseColumn(CategoriaMaterial attribute) {
        if (attribute == null) {
            return CategoriaMaterial.OTROS.name();
        }
        return attribute.name();
    }

    @Override
    public CategoriaMaterial convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return CategoriaMaterial.OTROS;
        }

        String valorLimpio = dbData.trim().toUpperCase();

        try {
            return CategoriaMaterial.valueOf(valorLimpio);
        } catch (IllegalArgumentException ex) {
            // Mapeo resiliente de valores legados
            if (valorLimpio.contains("ALUMINIO") || valorLimpio.contains("PERFIL")) {
                return CategoriaMaterial.PERFIL_ALUMINIO;
            } else if (valorLimpio.contains("ACCESORIO") || valorLimpio.contains("HERRAJE") || valorLimpio.contains("GARRUCHA") || valorLimpio.contains("FELPA")) {
                return CategoriaMaterial.ACCESORIO;
            } else if (valorLimpio.contains("MOLDURA") || valorLimpio.contains("MADERA") || valorLimpio.contains("POLIESTIRENO")) {
                return CategoriaMaterial.MOLDURA;
            } else if (valorLimpio.contains("ESTANDAR") || valorLimpio.contains("ESPEJO") || valorLimpio.contains("PRODUCTO") || valorLimpio.contains("LISTO")) {
                return CategoriaMaterial.PRODUCTO_ESTANDAR;
            } else {
                return CategoriaMaterial.OTROS;
            }
        }
    }
}
