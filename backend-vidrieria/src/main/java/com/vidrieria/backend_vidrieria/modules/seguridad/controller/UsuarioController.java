package com.vidrieria.backend_vidrieria.modules.seguridad.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.seguridad.dto.PerfilUsuarioResponseDTO;
import com.vidrieria.backend_vidrieria.modules.seguridad.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Lista al personal operativo activo (maestros instaladores y personal de taller).
     */
    @GetMapping("/maestros")
    public ResponseEntity<List<PerfilUsuarioResponseDTO>> listarMaestros() {
        List<PerfilUsuarioResponseDTO> maestros = usuarioService.listarMaestros();
        return ResponseEntity.ok(maestros);
    }
}
