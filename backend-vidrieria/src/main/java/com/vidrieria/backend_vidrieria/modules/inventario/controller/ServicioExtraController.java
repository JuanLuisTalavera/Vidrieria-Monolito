package com.vidrieria.backend_vidrieria.modules.inventario.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.inventario.dto.ServicioExtraRequestDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.dto.ServicioExtraResponseDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.service.ServicioExtraService;

@RestController
@RequestMapping("/api/v1/servicios-extras")
@RequiredArgsConstructor
@Tag(name = "Servicios Extras y Manufactura", description = "Endpoints para la gestión de servicios adicionales y manufactura del vidrio (pulido, biselado, perforaciones, etc.)")
public class ServicioExtraController {

    private final ServicioExtraService servicioExtraService;

    /**
     * Lista los servicios extras registrados.
     * Accesible por roles ADMIN y OPERARIO.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERARIO')")
    @Operation(summary = "Listar servicios extras",
            description = "Devuelve el catálogo de servicios extras. Permite filtrar solo activos mediante ?soloActivos=true.")
    public ResponseEntity<List<ServicioExtraResponseDTO>> listar(
            @RequestParam(required = false, defaultValue = "false") boolean soloActivos) {
        return ResponseEntity.ok(servicioExtraService.listar(soloActivos));
    }

    /**
     * Obtiene un servicio extra por su ID.
     * Accesible por roles ADMIN y OPERARIO.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERARIO')")
    @Operation(summary = "Obtener servicio extra por ID",
            description = "Devuelve la información detallada de un servicio extra específico.")
    public ResponseEntity<ServicioExtraResponseDTO> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(servicioExtraService.obtenerPorId(id));
    }

    /**
     * Crea un nuevo servicio extra.
     * Solo accesible por rol ADMIN.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Registrar nuevo servicio extra",
            description = "Crea un nuevo servicio extra en el catálogo con su tipo de cobro y precio base/sugerido. Exclusivo para ADMIN.")
    public ResponseEntity<ServicioExtraResponseDTO> crear(@Valid @RequestBody ServicioExtraRequestDTO request) {
        ServicioExtraResponseDTO response = servicioExtraService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Actualiza un servicio extra existente.
     * Solo accesible por rol ADMIN.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar servicio extra existente",
            description = "Modifica los datos, precio base o tipo de cobro de un servicio extra. Exclusivo para ADMIN.")
    public ResponseEntity<ServicioExtraResponseDTO> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ServicioExtraRequestDTO request) {
        ServicioExtraResponseDTO response = servicioExtraService.actualizar(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Borrado lógico: desactiva un servicio extra.
     * Solo accesible por rol ADMIN.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar servicio extra (borrado lógico)",
            description = "Desactiva un servicio extra sin eliminarlo físicamente de la base de datos. Exclusivo para ADMIN.")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        servicioExtraService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
