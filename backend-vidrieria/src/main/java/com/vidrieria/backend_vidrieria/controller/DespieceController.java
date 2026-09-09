package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.CalculoDespieceRequestDTO;
import com.vidrieria.backend_vidrieria.dto.DetalleCorteDTO;
import com.vidrieria.backend_vidrieria.service.MotorDespieceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
