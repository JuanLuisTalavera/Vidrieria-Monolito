package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.MaterialResponseDTO;
import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.service.MaterialService;
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

@ExtendWith(MockitoExtension.class)
class MaterialControllerTest {

    @Mock
    private MaterialService materialService;

    @InjectMocks
    private MaterialController materialController;

    @Test
    @DisplayName("listarActivos sin parámetro categoria debe llamar a materialService.listarActivos(null)")
    void listarActivos_SinCategoria() {
        MaterialResponseDTO m1 = MaterialResponseDTO.builder()
                .idMaterial(1)
                .nombre("Moldura Clásica")
                .tipoMaterial(CategoriaMaterial.MOLDURA)
                .precioVarilla(BigDecimal.valueOf(45.00))
                .build();

        when(materialService.listarActivos(null)).thenReturn(List.of(m1));

        ResponseEntity<List<MaterialResponseDTO>> response = materialController.listarActivos(null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(materialService).listarActivos(null);
    }

    @Test
    @DisplayName("listarActivos con MOLDURA debe llamar a materialService.listarActivos(CategoriaMaterial.MOLDURA)")
    void listarActivos_ConCategoriaMoldura() {
        MaterialResponseDTO m1 = MaterialResponseDTO.builder()
                .idMaterial(1)
                .nombre("Moldura Clásica")
                .tipoMaterial(CategoriaMaterial.MOLDURA)
                .precioVarilla(BigDecimal.valueOf(45.00))
                .build();

        when(materialService.listarActivos(CategoriaMaterial.MOLDURA)).thenReturn(List.of(m1));

        ResponseEntity<List<MaterialResponseDTO>> response = materialController.listarActivos(CategoriaMaterial.MOLDURA);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals(CategoriaMaterial.MOLDURA, response.getBody().get(0).getTipoMaterial());
        verify(materialService).listarActivos(CategoriaMaterial.MOLDURA);
    }
}
