package com.vidrieria.backend_vidrieria.modules.ingenieria.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CalculoDespieceRequestDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.service.MotorDespieceService;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.DetalleCorteDTO;

@RestController
@RequestMapping("/api/v1/despiece")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class DespieceController {

    private final MotorDespieceService motorDespieceService;

    @PostMapping("/calcular")
    public ResponseEntity<List<DetalleCorteDTO>> calcularDespiece(@RequestBody CalculoDespieceRequestDTO request) {
        List<DetalleCorteDTO> resultados = motorDespieceService.calcular(request);
        return ResponseEntity.ok(resultados);
    }
}
