package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.FormulaDespieceRequestDTO;
import com.vidrieria.backend_vidrieria.dto.FormulaDespieceResponseDTO;
import com.vidrieria.backend_vidrieria.service.FormulaDespieceService;
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

    @GetMapping("/sistema/{idSistema}")
    public ResponseEntity<List<FormulaDespieceResponseDTO>> listarPorSistema(@PathVariable Integer idSistema) {
        List<FormulaDespieceResponseDTO> formulas = formulaDespieceService.listarPorSistema(idSistema);
        return ResponseEntity.ok(formulas);
    }

    @PostMapping
    public ResponseEntity<FormulaDespieceResponseDTO> guardarFormula(@RequestBody FormulaDespieceRequestDTO requestDTO) {
        FormulaDespieceResponseDTO guardada = formulaDespieceService.guardarFormula(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }
}
