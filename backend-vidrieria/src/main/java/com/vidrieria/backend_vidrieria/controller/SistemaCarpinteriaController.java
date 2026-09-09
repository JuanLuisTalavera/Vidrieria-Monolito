package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.SistemaCarpinteriaResponseDTO;
import com.vidrieria.backend_vidrieria.service.SistemaCarpinteriaService;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<List<SistemaCarpinteriaResponseDTO>> listarSistemasActivos() {
        List<SistemaCarpinteriaResponseDTO> sistemas = sistemaCarpinteriaService.listarActivos();
        return ResponseEntity.ok(sistemas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SistemaCarpinteriaResponseDTO> obtenerSistemaPorId(@PathVariable Integer id) {
        return sistemaCarpinteriaService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
