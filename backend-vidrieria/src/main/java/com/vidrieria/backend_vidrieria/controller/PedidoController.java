package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.PedidoRequestDTO;
import com.vidrieria.backend_vidrieria.dto.PedidoResponseDTO;
import com.vidrieria.backend_vidrieria.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    /**
     * Devuelve el listado completo de pedidos.
     */
    @GetMapping
    public ResponseEntity<List<PedidoResponseDTO>> listarPedidos() {
        return ResponseEntity.ok(pedidoService.listarTodos());
    }

    /**
     * Registra un nuevo pedido/orden de trabajo.
     *
     * @param request DTO con datos del cliente, totales y detalles.
     * @return Pedido creado con IDs generados y estado COTIZADO.
     */
    @PostMapping
    public ResponseEntity<PedidoResponseDTO> crearPedido(
            @RequestBody PedidoRequestDTO request) {

        PedidoResponseDTO response = pedidoService.crearPedido(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Actualiza el estado de un pedido existente.
     *
     * @param id     ID del pedido.
     * @param estado nuevo estado a asignar.
     * @return Pedido actualizado.
     */
    @PatchMapping("/{id}/estado")
    public ResponseEntity<PedidoResponseDTO> actualizarEstado(
            @PathVariable Integer id,
            @RequestParam String estado) {

        PedidoResponseDTO response = pedidoService.actualizarEstado(id, estado);
        return ResponseEntity.ok(response);
    }

    /**
     * Liquida el saldo pendiente de un pedido (pago completo).
     *
     * @param id ID del pedido a liquidar.
     * @return Pedido actualizado con saldo 0 y estado ENTREGADO.
     */
    @PatchMapping("/{id}/liquidar")
    public ResponseEntity<PedidoResponseDTO> liquidarSaldo(@PathVariable Integer id) {
        PedidoResponseDTO response = pedidoService.liquidarSaldo(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Registra un abono/pago parcial o saldo a un pedido existente.
     *
     * @param id      ID del pedido a abonar.
     * @param request DTO con monto y metodoPago.
     * @return Pago registrado con hora y detalles.
     */
    @PostMapping("/{id}/pagos")
    public ResponseEntity<com.vidrieria.backend_vidrieria.dto.PagoResponseDTO> registrarAbono(
            @PathVariable Integer id,
            @RequestBody com.vidrieria.backend_vidrieria.dto.AbonoRequestDTO request) {

        com.vidrieria.backend_vidrieria.dto.PagoResponseDTO response = pedidoService.registrarAbono(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Devuelve la lista completa de pagos de un pedido específico ordenados cronológicamente.
     *
     * @param id ID del pedido a consultar.
     * @return Lista completa de pagos registrados.
     */
    @GetMapping("/{id}/pagos")
    public ResponseEntity<List<com.vidrieria.backend_vidrieria.dto.PagoResponseDTO>> listarPagosPorPedido(
            @PathVariable Integer id) {

        return ResponseEntity.ok(pedidoService.listarPagosPorPedido(id));
    }
}
