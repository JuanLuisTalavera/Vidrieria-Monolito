package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.ClienteRequestDTO;
import com.vidrieria.backend_vidrieria.dto.ClienteResponseDTO;
import com.vidrieria.backend_vidrieria.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    /**
     * Devuelve todos los clientes activos.
     */
    @GetMapping
    public ResponseEntity<List<ClienteResponseDTO>> listarActivos() {
        return ResponseEntity.ok(clienteService.listarActivos());
    }

    /**
     * Registra un nuevo cliente.
     */
    @PostMapping
    public ResponseEntity<ClienteResponseDTO> crear(@RequestBody ClienteRequestDTO request) {
        ClienteResponseDTO response = clienteService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Actualiza un cliente existente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> actualizar(
            @PathVariable Integer id,
            @RequestBody ClienteRequestDTO request) {

        ClienteResponseDTO response = clienteService.actualizar(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Borrado lógico: desactiva un cliente.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        clienteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Búsqueda rápida por número de documento exacto.
     * Uso principal: autocompletar datos del cliente en cotizaciones.
     */
    @GetMapping("/buscar/documento/{numero}")
    public ResponseEntity<ClienteResponseDTO> buscarPorDocumento(
            @PathVariable String numero) {

        ClienteResponseDTO response = clienteService.buscarPorDocumento(numero);
        return ResponseEntity.ok(response);
    }

    /**
     * Búsqueda por nombre o razón social (parcial, sin importar mayúsculas).
     */
    @GetMapping("/buscar/nombre")
    public ResponseEntity<List<ClienteResponseDTO>> buscarPorNombre(
            @RequestParam String q) {

        return ResponseEntity.ok(clienteService.buscarPorNombre(q));
    }
}
