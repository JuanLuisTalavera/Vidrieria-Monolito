package com.vidrieria.backend_vidrieria.modules.inventario.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.vidrieria.backend_vidrieria.modules.inventario.dto.MaterialResponseDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;

@ExtendWith(MockitoExtension.class)
class MaterialServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @InjectMocks
    private MaterialService materialService;

    private Material moldura;
    private Material perfilAluminio;

    @BeforeEach
    void setUp() {
        moldura = Material.builder()
                .idMaterial(1)
                .nombre("Moldura Clásica Dorada 3cm")
                .tipoMaterial(CategoriaMaterial.MOLDURA)
                .precioVarilla(BigDecimal.valueOf(45.00))
                .longitudVarilla(BigDecimal.valueOf(3.00))
                .activo(true)
                .build();

        perfilAluminio = Material.builder()
                .idMaterial(2)
                .nombre("Riel Superior Serie 20")
                .tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO)
                .precioVarilla(BigDecimal.valueOf(65.00))
                .longitudVarilla(BigDecimal.valueOf(6.00))
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("Cuando categoria es nula, debe retornar todos los materiales activos")
    void listarActivos_SinCategoria_RetornaTodos() {
        when(materialRepository.findByActivoTrue()).thenReturn(List.of(moldura, perfilAluminio));

        List<MaterialResponseDTO> resultado = materialService.listarActivos(null);

        assertEquals(2, resultado.size());
        verify(materialRepository, times(1)).findByActivoTrue();
        verify(materialRepository, never()).findByActivoTrueAndTipoMaterial(any());
    }

    @Test
    @DisplayName("Cuando categoria es MOLDURA, debe filtrar únicamente materiales de tipo MOLDURA")
    void listarActivos_ConCategoriaMoldura_RetornaSoloMolduras() {
        when(materialRepository.findByActivoTrueAndTipoMaterial(CategoriaMaterial.MOLDURA))
                .thenReturn(List.of(moldura));

        List<MaterialResponseDTO> resultado = materialService.listarActivos(CategoriaMaterial.MOLDURA);

        assertEquals(1, resultado.size());
        assertEquals("Moldura Clásica Dorada 3cm", resultado.get(0).getNombre());
        assertEquals(CategoriaMaterial.MOLDURA, resultado.get(0).getTipoMaterial());
        verify(materialRepository, times(1)).findByActivoTrueAndTipoMaterial(CategoriaMaterial.MOLDURA);
        verify(materialRepository, never()).findByActivoTrue();
    }
}
