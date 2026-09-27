package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.FormulaDespieceRequestDTO;
import com.vidrieria.backend_vidrieria.dto.FormulaDespieceResponseDTO;
import com.vidrieria.backend_vidrieria.service.FormulaDespieceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/formulas")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class FormulaDespieceController {

    private final FormulaDespieceService formulaDespieceService;

    @GetMapping
    public ResponseEntity<List<FormulaDespieceResponseDTO>> listarTodas() {
        List<FormulaDespieceResponseDTO> formulas = formulaDespieceService.listarTodas();
        return ResponseEntity.ok(formulas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormulaDespieceResponseDTO> obtenerPorId(@PathVariable Integer id) {
        FormulaDespieceResponseDTO formula = formulaDespieceService.obtenerPorId(id);
        return ResponseEntity.ok(formula);
    }

    @GetMapping("/sistema/{idSistema}")
    public ResponseEntity<List<FormulaDespieceResponseDTO>> listarPorSistema(@PathVariable Integer idSistema) {
        List<FormulaDespieceResponseDTO> formulas = formulaDespieceService.listarPorSistema(idSistema);
        return ResponseEntity.ok(formulas);
    }

    @PostMapping
    public ResponseEntity<FormulaDespieceResponseDTO> guardarFormula(@Valid @RequestBody FormulaDespieceRequestDTO requestDTO) {
        FormulaDespieceResponseDTO guardada = formulaDespieceService.guardarFormula(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormulaDespieceResponseDTO> actualizarFormula(
            @PathVariable Integer id,
            @Valid @RequestBody FormulaDespieceRequestDTO requestDTO) {
        FormulaDespieceResponseDTO actualizada = formulaDespieceService.actualizarFormula(id, requestDTO);
        return ResponseEntity.ok(actualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarFormula(@PathVariable Integer id) {
        formulaDespieceService.eliminarFormula(id);
        return ResponseEntity.noContent().build();
    }
}
