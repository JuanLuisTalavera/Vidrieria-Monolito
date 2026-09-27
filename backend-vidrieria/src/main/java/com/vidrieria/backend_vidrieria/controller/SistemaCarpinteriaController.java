package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.SistemaCarpinteriaRequestDTO;
import com.vidrieria.backend_vidrieria.dto.SistemaCarpinteriaResponseDTO;
import com.vidrieria.backend_vidrieria.service.SistemaCarpinteriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sistemas")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class SistemaCarpinteriaController {

    private final SistemaCarpinteriaService sistemaCarpinteriaService;

    @GetMapping
    public ResponseEntity<List<SistemaCarpinteriaResponseDTO>> listarSistemas(
            @RequestParam(required = false, defaultValue = "false") boolean soloActivos) {
        List<SistemaCarpinteriaResponseDTO> sistemas = soloActivos
                ? sistemaCarpinteriaService.listarActivos()
                : sistemaCarpinteriaService.listarTodos();
        return ResponseEntity.ok(sistemas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SistemaCarpinteriaResponseDTO> obtenerSistemaPorId(@PathVariable Integer id) {
        return sistemaCarpinteriaService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SistemaCarpinteriaResponseDTO> crearSistema(
            @Valid @RequestBody SistemaCarpinteriaRequestDTO request) {
        SistemaCarpinteriaResponseDTO creado = sistemaCarpinteriaService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SistemaCarpinteriaResponseDTO> actualizarSistema(
            @PathVariable Integer id,
            @Valid @RequestBody SistemaCarpinteriaRequestDTO request) {
        SistemaCarpinteriaResponseDTO actualizado = sistemaCarpinteriaService.actualizar(id, request);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSistema(@PathVariable Integer id) {
        sistemaCarpinteriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
