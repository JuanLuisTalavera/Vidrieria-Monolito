package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.FormulaDespieceRequestDTO;
import com.vidrieria.backend_vidrieria.dto.FormulaDespieceResponseDTO;
import com.vidrieria.backend_vidrieria.entity.FormulaDespiece;
import com.vidrieria.backend_vidrieria.repository.FormulaDespieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FormulaDespieceService {

    private final FormulaDespieceRepository formulaDespieceRepository;

    @Transactional(readOnly = true)
    public List<FormulaDespieceResponseDTO> listarPorSistema(Integer idSistema) {
        return formulaDespieceRepository.findByIdSistema(idSistema).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public FormulaDespieceResponseDTO guardarFormula(FormulaDespieceRequestDTO requestDTO) {
        FormulaDespiece formula = FormulaDespiece.builder()
                .idSistema(requestDTO.getIdSistema())
                .tipoElemento(requestDTO.getTipoElemento())
                .idMaterialDefecto(requestDTO.getIdMaterialDefecto())
                .cantidadPiezas(requestDTO.getCantidadPiezas())
                .formulaLargo(requestDTO.getFormulaLargo())
                .formulaAlto(requestDTO.getFormulaAlto())
                .descripcion(requestDTO.getDescripcion())
                .build();

        FormulaDespiece guardada = formulaDespieceRepository.save(formula);
        return mapToDTO(guardada);
    }

    private FormulaDespieceResponseDTO mapToDTO(FormulaDespiece entity) {
        return FormulaDespieceResponseDTO.builder()
                .idFormula(entity.getIdFormula())
                .idSistema(entity.getIdSistema())
                .tipoElemento(entity.getTipoElemento())
                .idMaterialDefecto(entity.getIdMaterialDefecto())
                .cantidadPiezas(entity.getCantidadPiezas())
                .formulaLargo(entity.getFormulaLargo())
                .formulaAlto(entity.getFormulaAlto())
                .descripcion(entity.getDescripcion())
                .build();
    }
}
