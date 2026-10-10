package com.vidrieria.backend_vidrieria.modules.inventario.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vidrieria.backend_vidrieria.modules.inventario.dto.ServicioExtraRequestDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.dto.ServicioExtraResponseDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoCobro;
import com.vidrieria.backend_vidrieria.modules.inventario.service.ServicioExtraService;

@ExtendWith(MockitoExtension.class)
class ServicioExtraControllerTest {

    @Mock
    private ServicioExtraService servicioExtraService;

    @InjectMocks
    private ServicioExtraController servicioExtraController;

    private ServicioExtraResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        responseDTO = ServicioExtraResponseDTO.builder()
                .id(1)
                .idExtra(1)
                .nombre("Canto Pulido Plano")
                .descripcion("Pulido de bordes")
                .categoriaAplicable("VIDRIO")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("5.00"))
                .precioSugerido(new BigDecimal("5.00"))
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/servicios-extras retorna 200 OK y lista de servicios")
    void testListar() {
        when(servicioExtraService.listar(false)).thenReturn(List.of(responseDTO));

        ResponseEntity<List<ServicioExtraResponseDTO>> response = servicioExtraController.listar(false);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Canto Pulido Plano", response.getBody().get(0).getNombre());
        verify(servicioExtraService).listar(false);
    }

    @Test
    @DisplayName("GET /api/v1/servicios-extras/{id} retorna 200 OK y servicio solicitado")
    void testObtenerPorId() {
        when(servicioExtraService.obtenerPorId(1)).thenReturn(responseDTO);

        ResponseEntity<ServicioExtraResponseDTO> response = servicioExtraController.obtenerPorId(1);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getId());
        verify(servicioExtraService).obtenerPorId(1);
    }

    @Test
    @DisplayName("POST /api/v1/servicios-extras retorna 201 CREATED")
    void testCrear() {
        ServicioExtraRequestDTO request = ServicioExtraRequestDTO.builder()
                .nombre("Canto Pulido Plano")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("5.00"))
                .build();

        when(servicioExtraService.crear(request)).thenReturn(responseDTO);

        ResponseEntity<ServicioExtraResponseDTO> response = servicioExtraController.crear(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Canto Pulido Plano", response.getBody().getNombre());
        verify(servicioExtraService).crear(request);
    }

    @Test
    @DisplayName("PUT /api/v1/servicios-extras/{id} retorna 200 OK con recurso actualizado")
    void testActualizar() {
        ServicioExtraRequestDTO request = ServicioExtraRequestDTO.builder()
                .nombre("Canto Pulido Plano")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("6.00"))
                .build();

        when(servicioExtraService.actualizar(1, request)).thenReturn(responseDTO);

        ResponseEntity<ServicioExtraResponseDTO> response = servicioExtraController.actualizar(1, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(servicioExtraService).actualizar(1, request);
    }

    @Test
    @DisplayName("DELETE /api/v1/servicios-extras/{id} retorna 204 NO CONTENT")
    void testEliminar() {
        ResponseEntity<Void> response = servicioExtraController.eliminar(1);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(servicioExtraService).eliminar(1);
    }
}
