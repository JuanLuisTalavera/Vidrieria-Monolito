package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.ServicioExtraRequestDTO;
import com.vidrieria.backend_vidrieria.dto.ServicioExtraResponseDTO;
import com.vidrieria.backend_vidrieria.entity.ServicioExtra;
import com.vidrieria.backend_vidrieria.entity.TipoCobro;
import com.vidrieria.backend_vidrieria.repository.ServicioExtraRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServicioExtraServiceTest {

    @Mock
    private ServicioExtraRepository servicioExtraRepository;

    @InjectMocks
    private ServicioExtraService servicioExtraService;

    private ServicioExtra servicioPrueba;

    @BeforeEach
    void setUp() {
        servicioPrueba = ServicioExtra.builder()
                .id(1)
                .nombre("Canto Pulido Plano")
                .descripcion("Pulido de bordes")
                .categoriaAplicable("VIDRIO")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("5.50"))
                .precioSugerido(new BigDecimal("5.50"))
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("listar(true) o listarActivos() debe devolver solo servicios activos ordenados por nombre")
    void testListarActivos() {
        when(servicioExtraRepository.findByActivoTrueOrderByNombreAsc())
                .thenReturn(List.of(servicioPrueba));

        List<ServicioExtraResponseDTO> resultado = servicioExtraService.listar(true);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Canto Pulido Plano", resultado.get(0).getNombre());
        assertEquals(TipoCobro.METRO_LINEAL, resultado.get(0).getTipoCobro());
        assertEquals(new BigDecimal("5.50"), resultado.get(0).getPrecioBase());
        verify(servicioExtraRepository).findByActivoTrueOrderByNombreAsc();
    }

    @Test
    @DisplayName("listar(false) debe devolver todos los servicios")
    void testListarTodos() {
        when(servicioExtraRepository.findAllByOrderByNombreAsc())
                .thenReturn(List.of(servicioPrueba));

        List<ServicioExtraResponseDTO> resultado = servicioExtraService.listar(false);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(servicioExtraRepository).findAllByOrderByNombreAsc();
    }

    @Test
    @DisplayName("obtenerPorId retorna el DTO cuando el ID existe")
    void testObtenerPorId_Exitoso() {
        when(servicioExtraRepository.findById(1)).thenReturn(Optional.of(servicioPrueba));

        ServicioExtraResponseDTO dto = servicioExtraService.obtenerPorId(1);

        assertNotNull(dto);
        assertEquals(1, dto.getId());
        assertEquals(1, dto.getIdExtra());
        assertEquals("Canto Pulido Plano", dto.getNombre());
    }

    @Test
    @DisplayName("obtenerPorId lanza EntityNotFoundException si no existe")
    void testObtenerPorId_NoExiste() {
        when(servicioExtraRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> servicioExtraService.obtenerPorId(99));
    }

    @Test
    @DisplayName("crear registra un nuevo servicio extra correctamente")
    void testCrear_Exitoso() {
        ServicioExtraRequestDTO request = ServicioExtraRequestDTO.builder()
                .nombre("Perforación Hueco Tirador")
                .descripcion("Hueco para perilla")
                .categoriaAplicable("VIDRIO")
                .tipoCobro(TipoCobro.UNIDAD)
                .precioBase(new BigDecimal("8.00"))
                .activo(true)
                .build();

        when(servicioExtraRepository.existsByNombreIgnoreCase("Perforación Hueco Tirador")).thenReturn(false);
        when(servicioExtraRepository.save(any(ServicioExtra.class))).thenAnswer(invocation -> {
            ServicioExtra s = invocation.getArgument(0);
            s.setId(2);
            return s;
        });

        ServicioExtraResponseDTO creado = servicioExtraService.crear(request);

        assertNotNull(creado);
        assertEquals(2, creado.getId());
        assertEquals("Perforación Hueco Tirador", creado.getNombre());
        assertEquals(TipoCobro.UNIDAD, creado.getTipoCobro());
        assertEquals(new BigDecimal("8.00"), creado.getPrecioBase());
        verify(servicioExtraRepository).save(any(ServicioExtra.class));
    }

    @Test
    @DisplayName("crear lanza IllegalArgumentException si ya existe un servicio con el mismo nombre")
    void testCrear_NombreDuplicado() {
        ServicioExtraRequestDTO request = ServicioExtraRequestDTO.builder()
                .nombre("Canto Pulido Plano")
                .precioBase(new BigDecimal("5.50"))
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .build();

        when(servicioExtraRepository.existsByNombreIgnoreCase("Canto Pulido Plano")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> servicioExtraService.crear(request));
        verify(servicioExtraRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizar modifica campos correctamente")
    void testActualizar_Exitoso() {
        ServicioExtraRequestDTO request = ServicioExtraRequestDTO.builder()
                .nombre("Canto Pulido Redondeado")
                .descripcion("Pulido redondo premium")
                .categoriaAplicable("VIDRIO")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("7.50"))
                .activo(true)
                .build();

        when(servicioExtraRepository.findById(1)).thenReturn(Optional.of(servicioPrueba));
        when(servicioExtraRepository.existsByNombreIgnoreCaseAndIdNot("Canto Pulido Redondeado", 1)).thenReturn(false);
        when(servicioExtraRepository.save(any(ServicioExtra.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ServicioExtraResponseDTO actualizado = servicioExtraService.actualizar(1, request);

        assertNotNull(actualizado);
        assertEquals("Canto Pulido Redondeado", actualizado.getNombre());
        assertEquals(new BigDecimal("7.50"), actualizado.getPrecioBase());
        assertEquals(new BigDecimal("7.50"), actualizado.getPrecioSugerido());
        verify(servicioExtraRepository).save(servicioPrueba);
    }

    @Test
    @DisplayName("eliminar realiza borrado lógico marcando activo = false")
    void testEliminar_BorradoLogico() {
        when(servicioExtraRepository.findById(1)).thenReturn(Optional.of(servicioPrueba));
        when(servicioExtraRepository.save(any(ServicioExtra.class))).thenAnswer(invocation -> invocation.getArgument(0));

        servicioExtraService.eliminar(1);

        assertFalse(servicioPrueba.getActivo());
        verify(servicioExtraRepository).save(servicioPrueba);
    }
}
