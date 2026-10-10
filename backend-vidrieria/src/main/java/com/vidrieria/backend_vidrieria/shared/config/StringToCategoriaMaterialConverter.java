package com.vidrieria.backend_vidrieria.shared.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.CategoriaMaterial;

/**
 * Convertidor tolerante para parámetros HTTP (ej. @RequestParam CategoriaMaterial).
 * Soporta minúsculas, mayúsculas y nombres legados o plurales (ej. "moldura", "molduras", "aluminio").
 */
@Component
public class StringToCategoriaMaterialConverter implements Converter<String, CategoriaMaterial> {

    @Override
    public CategoriaMaterial convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }

        String valorLimpio = source.trim().toUpperCase();

        try {
            return CategoriaMaterial.valueOf(valorLimpio);
        } catch (IllegalArgumentException ex) {
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
