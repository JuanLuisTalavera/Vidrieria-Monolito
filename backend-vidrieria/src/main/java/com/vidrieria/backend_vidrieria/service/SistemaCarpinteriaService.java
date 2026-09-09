package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.SistemaCarpinteriaResponseDTO;
import com.vidrieria.backend_vidrieria.entity.SistemaCarpinteria;
import com.vidrieria.backend_vidrieria.repository.SistemaCarpinteriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
    public Optional<SistemaCarpinteriaResponseDTO> obtenerPorId(Integer id) {
        return sistemaCarpinteriaRepository.findById(id)
                .map(this::mapToDTO);
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
