package com.vidrieria.backend_vidrieria.modules.ingenieria.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.SistemaCarpinteriaRequestDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.SistemaCarpinteriaResponseDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.SistemaCarpinteria;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.TipoEstructura;
import com.vidrieria.backend_vidrieria.modules.ingenieria.repository.SistemaCarpinteriaRepository;

@Service
@RequiredArgsConstructor
public class SistemaCarpinteriaService {

    private final SistemaCarpinteriaRepository sistemaCarpinteriaRepository;

    @Transactional(readOnly = true)
    public List<SistemaCarpinteriaResponseDTO> listarActivos() {
        return sistemaCarpinteriaRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SistemaCarpinteriaResponseDTO> listarTodos() {
        return sistemaCarpinteriaRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<SistemaCarpinteriaResponseDTO> obtenerPorId(Integer id) {
        return sistemaCarpinteriaRepository.findById(id)
                .map(this::mapToDTO);
    }

    @Transactional
    public SistemaCarpinteriaResponseDTO crear(SistemaCarpinteriaRequestDTO request) {
        SistemaCarpinteria entity = SistemaCarpinteria.builder()
                .codigo(request.getCodigo())
                .nombre(request.getNombre())
                .tipoEstructura(request.getTipoEstructura())
                .numeroHojas(request.getNumeroHojas())
                .alturaMaximaRecomendada(request.getAlturaMaximaRecomendada())
                .descripcion(request.getDescripcion())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .build();

        SistemaCarpinteria guardado = sistemaCarpinteriaRepository.save(entity);
        return mapToDTO(guardado);
    }

    @Transactional
    public SistemaCarpinteriaResponseDTO actualizar(Integer id, SistemaCarpinteriaRequestDTO request) {
        SistemaCarpinteria entity = sistemaCarpinteriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sistema de carpintería no encontrado con ID: " + id));

        entity.setCodigo(request.getCodigo());
        entity.setNombre(request.getNombre());
        entity.setTipoEstructura(request.getTipoEstructura());
        entity.setNumeroHojas(request.getNumeroHojas());
        entity.setAlturaMaximaRecomendada(request.getAlturaMaximaRecomendada());
        entity.setDescripcion(request.getDescripcion());
        if (request.getActivo() != null) {
            entity.setActivo(request.getActivo());
        }

        SistemaCarpinteria actualizado = sistemaCarpinteriaRepository.save(entity);
        return mapToDTO(actualizado);
    }

    @Transactional
    public void eliminar(Integer id) {
        SistemaCarpinteria entity = sistemaCarpinteriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sistema de carpintería no encontrado con ID: " + id));

        entity.setActivo(false);
        sistemaCarpinteriaRepository.save(entity);
    }

    private SistemaCarpinteriaResponseDTO mapToDTO(SistemaCarpinteria entity) {
        return SistemaCarpinteriaResponseDTO.builder()
                .idSistema(entity.getIdSistema())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .tipoEstructura(entity.getTipoEstructura())
                .numeroHojas(entity.getNumeroHojas())
                .alturaMaximaRecomendada(entity.getAlturaMaximaRecomendada())
                .descripcion(entity.getDescripcion())
                .activo(entity.getActivo())
                .build();
    }
}
