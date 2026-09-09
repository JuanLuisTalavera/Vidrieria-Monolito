package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.DashboardResponseDTO;
import com.vidrieria.backend_vidrieria.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Retorna el resumen financiero y operativo del negocio para una fecha dada (o hoy si es null).
     */
    @GetMapping("/resumen")
    public ResponseEntity<DashboardResponseDTO> obtenerResumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(dashboardService.obtenerResumen(fecha));
    }

    /**
     * Retorna el cuadre de caja para el vendedor actualmente autenticado en una fecha dada (o hoy si es null).
     */
    @GetMapping("/mi-caja")
    public ResponseEntity<DashboardResponseDTO> obtenerCajaVendedor(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(dashboardService.obtenerCajaVendedor(fecha));
    }
}
