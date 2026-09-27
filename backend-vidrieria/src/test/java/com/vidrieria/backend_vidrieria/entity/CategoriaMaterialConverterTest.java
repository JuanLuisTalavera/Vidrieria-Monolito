package com.vidrieria.backend_vidrieria.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CategoriaMaterialConverterTest {

    private CategoriaMaterialConverter converter;

    @BeforeEach
    void setUp() {
        converter = new CategoriaMaterialConverter();
    }

    @Test
    @DisplayName("convertToDatabaseColumn debe serializar el enum a String o OTROS si es nulo")
    void testConvertToDatabaseColumn() {
        assertEquals("PRODUCTO_ESTANDAR", converter.convertToDatabaseColumn(CategoriaMaterial.PRODUCTO_ESTANDAR));
        assertEquals("OTROS", converter.convertToDatabaseColumn(null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "PRODUCTO_ESTANDAR",
        "producto_estandar",
        "ESTANDAR",
        "ESPEJO",
        "ESPEJO_BISELADO",
        "PRODUCTO",
        "LISTO",
        "PRODUCTO_TERMINADO"
    })
    @DisplayName("convertToEntityAttribute mapea palabras clave a PRODUCTO_ESTANDAR")
    void testConvertToEntityAttribute_ProductoEstandar(String input) {
        assertEquals(CategoriaMaterial.PRODUCTO_ESTANDAR, converter.convertToEntityAttribute(input));
    }

    @Test
    @DisplayName("convertToEntityAttribute mantiene compatibilidad con otras categorias y valores nulos/vacios")
    void testConvertToEntityAttribute_OtrasCategorias() {
        assertEquals(CategoriaMaterial.PERFIL_ALUMINIO, converter.convertToEntityAttribute("ALUMINIO"));
        assertEquals(CategoriaMaterial.ACCESORIO, converter.convertToEntityAttribute("HERRAJE"));
        assertEquals(CategoriaMaterial.MOLDURA, converter.convertToEntityAttribute("MADERA"));
        assertEquals(CategoriaMaterial.OTROS, converter.convertToEntityAttribute("DESCONOCIDO"));
        assertEquals(CategoriaMaterial.OTROS, converter.convertToEntityAttribute(null));
        assertEquals(CategoriaMaterial.OTROS, converter.convertToEntityAttribute("   "));
    }
}
