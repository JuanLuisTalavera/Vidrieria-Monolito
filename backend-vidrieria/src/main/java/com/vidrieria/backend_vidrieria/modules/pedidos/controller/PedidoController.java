package com.vidrieria.backend_vidrieria.modules.pedidos.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.clientes.entity.Cliente;
import com.vidrieria.backend_vidrieria.modules.finanzas.dto.PagoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.finanzas.entity.Pago;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.AbonoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.PedidoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.PedidoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.entity.Pedido;
import com.vidrieria.backend_vidrieria.modules.pedidos.service.PedidoService;

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
     * Devuelve el listado paginado de pedidos optimizado en memoria.
     */
    @GetMapping("/paginados")
    public ResponseEntity<Page<PedidoResponseDTO>> listarPaginados(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        return ResponseEntity.ok(pedidoService.listarPaginados(page, size, sortDir));
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
     * Confirma un pedido y descuenta el inventario real bajo transacción.
     *
     * @param id ID del pedido a confirmar.
     * @return Pedido confirmado con estado CONFIRMADO.
     */
    @PatchMapping("/{id}/confirmar")
    public ResponseEntity<PedidoResponseDTO> confirmarPedido(@PathVariable Integer id) {
        PedidoResponseDTO response = pedidoService.confirmarPedido(id);
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
    public ResponseEntity<PagoResponseDTO> registrarAbono(
            @PathVariable Integer id,
            @RequestBody AbonoRequestDTO request) {

        PagoResponseDTO response = pedidoService.registrarAbono(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Devuelve la lista completa de pagos de un pedido específico ordenados cronológicamente.
     *
     * @param id ID del pedido a consultar.
     * @return Lista completa de pagos registrados.
     */
    @GetMapping("/{id}/pagos")
    public ResponseEntity<List<PagoResponseDTO>> listarPagosPorPedido(
            @PathVariable Integer id) {

        return ResponseEntity.ok(pedidoService.listarPagosPorPedido(id));
    }
}
