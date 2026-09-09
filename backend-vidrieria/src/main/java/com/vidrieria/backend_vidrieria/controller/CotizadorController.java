package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.CotizacionRequestDTO;
import com.vidrieria.backend_vidrieria.dto.CotizacionResponseDTO;
import com.vidrieria.backend_vidrieria.service.CotizadorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cotizador")
@RequiredArgsConstructor
public class CotizadorController {

    private final CotizadorService cotizadorService;

    /**
     * Calcula la cotización para un trabajo de marquería/vidriería.
     *
     * @param request DTO con ancho, alto e IDs opcionales de vidrio, moldura y servicios extras.
     * @return Desglose de costos y total calculado.
     */
    @PostMapping("/calcular")
    public ResponseEntity<CotizacionResponseDTO> calcular(
            @RequestBody CotizacionRequestDTO request) {

        CotizacionResponseDTO response = cotizadorService.calcularCotizacion(request);
        return ResponseEntity.ok(response);
    }
}
