package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.ServicioExtraRequestDTO;
import com.vidrieria.backend_vidrieria.dto.ServicioExtraResponseDTO;
import com.vidrieria.backend_vidrieria.entity.ServicioExtra;
import com.vidrieria.backend_vidrieria.entity.TipoCobro;
import com.vidrieria.backend_vidrieria.repository.ServicioExtraRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicioExtraService {

    private final ServicioExtraRepository servicioExtraRepository;

    /**
     * Lista los servicios extras. Si soloActivos es true (o no se especifica),
     * devuelve solo los activos. Si es false, devuelve todos.
     */
    @Transactional(readOnly = true)
    public List<ServicioExtraResponseDTO> listar(Boolean soloActivos) {
        List<ServicioExtra> servicios;
        if (soloActivos != null && !soloActivos) {
            servicios = servicioExtraRepository.findAllByOrderByNombreAsc();
        } else {
            servicios = servicioExtraRepository.findByActivoTrueOrderByNombreAsc();
        }

        return servicios.stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Devuelve únicamente los servicios extras activos.
     */
    @Transactional(readOnly = true)
    public List<ServicioExtraResponseDTO> listarActivos() {
        return listar(true);
    }

    /**
     * Obtiene un servicio extra por su ID.
     */
    @Transactional(readOnly = true)
    public ServicioExtraResponseDTO obtenerPorId(Integer id) {
        ServicioExtra servicio = servicioExtraRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Servicio extra no encontrado con ID: " + id));
        return mapToDTO(servicio);
    }

    /**
     * Registra un nuevo servicio extra.
     */
    @Transactional
    public ServicioExtraResponseDTO crear(ServicioExtraRequestDTO request) {
        if (request.getNombre() != null && servicioExtraRepository.existsByNombreIgnoreCase(request.getNombre().trim())) {
            throw new IllegalArgumentException("Ya existe un servicio extra registrado con el nombre: " + request.getNombre().trim());
        }

        BigDecimal precio = request.getPrecioEfectivo();
        TipoCobro tipoCobro = request.getTipoCobro() != null ? request.getTipoCobro() : TipoCobro.UNIDAD;
        boolean activo = request.getActivo() != null ? request.getActivo() : true;

        ServicioExtra servicio = ServicioExtra.builder()
                .nombre(request.getNombre().trim())
                .descripcion(request.getDescripcion() != null ? request.getDescripcion().trim() : null)
                .categoriaAplicable(request.getCategoriaAplicable() != null ? request.getCategoriaAplicable().trim() : null)
                .tipoCobro(tipoCobro)
                .precioBase(precio)
                .precioSugerido(precio)
                .activo(activo)
                .build();

        ServicioExtra guardado = servicioExtraRepository.save(servicio);
        log.info("Servicio extra creado exitosamente: ID={}, Nombre={}, TipoCobro={}, Precio={}",
                guardado.getId(), guardado.getNombre(), guardado.getTipoCobro(), guardado.getPrecioBase());

        return mapToDTO(guardado);
    }

    /**
     * Actualiza un servicio extra existente.
     */
    @Transactional
    public ServicioExtraResponseDTO actualizar(Integer id, ServicioExtraRequestDTO request) {
        ServicioExtra servicio = servicioExtraRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Servicio extra no encontrado con ID: " + id));

        if (request.getNombre() != null &&
                servicioExtraRepository.existsByNombreIgnoreCaseAndIdNot(request.getNombre().trim(), id)) {
            throw new IllegalArgumentException("Ya existe otro servicio extra registrado con el nombre: " + request.getNombre().trim());
        }

        if (request.getNombre() != null) {
            servicio.setNombre(request.getNombre().trim());
        }
        if (request.getDescripcion() != null) {
            servicio.setDescripcion(request.getDescripcion().trim());
        }
        if (request.getCategoriaAplicable() != null) {
            servicio.setCategoriaAplicable(request.getCategoriaAplicable().trim());
        }
        if (request.getTipoCobro() != null) {
            servicio.setTipoCobro(request.getTipoCobro());
        }

        BigDecimal precio = request.getPrecioEfectivo();
        if (precio != null && precio.compareTo(BigDecimal.ZERO) >= 0) {
            servicio.setPrecioBase(precio);
            servicio.setPrecioSugerido(precio);
        }

        if (request.getActivo() != null) {
            servicio.setActivo(request.getActivo());
        }

        ServicioExtra actualizado = servicioExtraRepository.save(servicio);
        log.info("Servicio extra actualizado exitosamente: ID={}, Nombre={}, Precio={}",
                actualizado.getId(), actualizado.getNombre(), actualizado.getPrecioBase());

        return mapToDTO(actualizado);
    }

    /**
     * Borrado lógico: desactiva el servicio extra.
     */
    @Transactional
    public void eliminar(Integer id) {
        ServicioExtra servicio = servicioExtraRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Servicio extra no encontrado con ID: " + id));

        servicio.setActivo(false);
        servicioExtraRepository.save(servicio);
        log.info("Servicio extra desactivado (borrado lógico): ID={}, Nombre={}", id, servicio.getNombre());
    }

    /**
     * Convierte una entidad ServicioExtra a su respectivo DTO de respuesta.
     */
    public ServicioExtraResponseDTO mapToDTO(ServicioExtra s) {
        return ServicioExtraResponseDTO.builder()
                .id(s.getId())
                .idExtra(s.getId())
                .nombre(s.getNombre())
                .descripcion(s.getDescripcion())
                .categoriaAplicable(s.getCategoriaAplicable())
                .tipoCobro(s.getTipoCobro())
                .precioBase(s.getPrecioBase())
                .precioSugerido(s.getPrecioSugerido())
                .activo(s.getActivo())
                .build();
    }
}
