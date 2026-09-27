package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.MaterialRequestDTO;
import com.vidrieria.backend_vidrieria.dto.MaterialResponseDTO;
import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/materiales", "/api/materiales"})
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    /**
     * Devuelve todos los materiales activos con precios calculados dinámicamente,
     * opcionalmente filtrados por categoría (MOLDURA, PERFIL_ALUMINIO, ACCESORIO, OTROS).
     */
    @GetMapping
    public ResponseEntity<List<MaterialResponseDTO>> listarActivos(
            @RequestParam(required = false) CategoriaMaterial categoria) {
        return ResponseEntity.ok(materialService.listarActivos(categoria));
    }

    /**
     * Registra un nuevo material (moldura).
     */
    @PostMapping
    public ResponseEntity<MaterialResponseDTO> crear(@RequestBody MaterialRequestDTO request) {
        MaterialResponseDTO response = materialService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Actualiza un material existente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> actualizar(
            @PathVariable Integer id,
            @RequestBody MaterialRequestDTO request) {

        MaterialResponseDTO response = materialService.actualizar(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Borrado lógico: desactiva un material.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        materialService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
