package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.TipoVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.dto.TipoVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.service.TipoVidrioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vidrios")
@RequiredArgsConstructor
public class TipoVidrioController {

    private final TipoVidrioService tipoVidrioService;

    /**
     * Devuelve todos los tipos de vidrio activos con precios calculados dinámicamente.
     */
    @GetMapping
    public ResponseEntity<List<TipoVidrioResponseDTO>> listarActivos() {
        return ResponseEntity.ok(tipoVidrioService.listarActivos());
    }

    /**
     * Registra un nuevo tipo de vidrio.
     */
    @PostMapping
    public ResponseEntity<TipoVidrioResponseDTO> crear(@RequestBody TipoVidrioRequestDTO request) {
        TipoVidrioResponseDTO response = tipoVidrioService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Actualiza un tipo de vidrio existente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TipoVidrioResponseDTO> actualizar(
            @PathVariable Integer id,
            @RequestBody TipoVidrioRequestDTO request) {

        TipoVidrioResponseDTO response = tipoVidrioService.actualizar(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Borrado lógico: desactiva un tipo de vidrio.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        tipoVidrioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
