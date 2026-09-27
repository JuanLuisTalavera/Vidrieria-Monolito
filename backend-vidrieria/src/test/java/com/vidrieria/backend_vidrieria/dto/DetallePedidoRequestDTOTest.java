package com.vidrieria.backend_vidrieria.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class DetallePedidoRequestDTOTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Debe deserializar correctamente con nombres alternativos / aliases")
    void testJsonAliases() throws Exception {
        String json = """
            {
                "anchoMm": 1200.5,
                "altoMm": 800.25,
                "vidrioId": 5,
                "precio": 45.0,
                "total": 90.0,
                "cantidad": 2
            }
            """;

        DetallePedidoRequestDTO dto = objectMapper.readValue(json, DetallePedidoRequestDTO.class);

        assertEquals(new BigDecimal("1200.5"), dto.getAncho());
        assertEquals(new BigDecimal("800.25"), dto.getAlto());
        assertEquals(5, dto.getIdVidrio());
        assertEquals(new BigDecimal("45.0"), dto.getPrecioUnitario());
        assertEquals(new BigDecimal("90.0"), dto.getSubtotal());
    }

    @Test
    @DisplayName("Debe deserializar correctamente con anchoVano y altoVano como aliases")
    void testJsonAliasesVano() throws Exception {
        String json = """
            {
                "anchoVano": 1500.0,
                "altoVano": 2000.0,
                "precioTotal": 300.0
            }
            """;

        DetallePedidoRequestDTO dto = objectMapper.readValue(json, DetallePedidoRequestDTO.class);

        assertEquals(new BigDecimal("1500.0"), dto.getAncho());
        assertEquals(new BigDecimal("1500.0"), dto.getAnchoVano());
        assertEquals(new BigDecimal("2000.0"), dto.getAlto());
        assertEquals(new BigDecimal("2000.0"), dto.getAltoVano());
        assertEquals(new BigDecimal("300.0"), dto.getSubtotal());
    }
}
