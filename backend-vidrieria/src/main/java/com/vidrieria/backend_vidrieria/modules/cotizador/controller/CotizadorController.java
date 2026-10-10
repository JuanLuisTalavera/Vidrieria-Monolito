package com.vidrieria.backend_vidrieria.modules.cotizador.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionResponseDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.service.CotizadorService;

@RestController
@RequestMapping("/api/v1/cotizador")
@RequiredArgsConstructor
@Tag(name = "Cotizador", description = "Endpoints para cotizaciones de trabajos de marquería y vidrios sueltos a medida")
public class CotizadorController {

    private final CotizadorService cotizadorService;

    /**
     * Calcula la cotización para un trabajo de marquería/vidriería tradicional.
     *
     * @param request DTO con ancho, alto e IDs opcionales de vidrio, moldura y servicios extras.
     * @return Desglose de costos y total calculado.
     */
    @PostMapping("/calcular")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERARIO')")
    @Operation(summary = "Calcular cotización tradicional",
            description = "Calcula el costo de un trabajo combinando vidrio, moldura y servicios extras.")
    public ResponseEntity<CotizacionResponseDTO> calcular(
            @RequestBody CotizacionRequestDTO request) {

        CotizacionResponseDTO response = cotizadorService.calcularCotizacion(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Calcula la cotización específica para vidrios sueltos y cristales a medida.
     * Incluye cobros por área del vidrio (m²), metros lineales de pulido/biselado y perforaciones.
     *
     * @param request DTO con dimensiones en mm, tipo de vidrio y metros/cantidades de manufactura.
     * @return DTO con subtotales detallados por concepto y total final redondeado a favor de la tienda.
     */
    @PostMapping("/vidrio-suelto")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERARIO')")
    @Operation(summary = "Calcular cotización de vidrio suelto",
            description = "Calcula el precio de un cristal a medida según su área (m²), pulido lineal, biselado lineal y cantidad de huecos/perforaciones.")
    public ResponseEntity<CotizacionVidrioSueltoResponseDTO> calcularVidrioSuelto(
            @Valid @RequestBody CotizacionVidrioSueltoRequestDTO request) {

        CotizacionVidrioSueltoResponseDTO response = cotizadorService.calcularCotizacionVidrioSuelto(request);
        return ResponseEntity.ok(response);
    }
}
