package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.AbonoRequestDTO;
import com.vidrieria.backend_vidrieria.dto.DetallePedidoRequestDTO;
import com.vidrieria.backend_vidrieria.dto.PagoResponseDTO;
import com.vidrieria.backend_vidrieria.dto.PedidoRequestDTO;
import com.vidrieria.backend_vidrieria.dto.PedidoResponseDTO;
import com.vidrieria.backend_vidrieria.entity.DetallePedido;
import com.vidrieria.backend_vidrieria.entity.Material;
import com.vidrieria.backend_vidrieria.entity.Pago;
import com.vidrieria.backend_vidrieria.entity.Pedido;
import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.entity.Usuario;
import com.vidrieria.backend_vidrieria.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.repository.PagoRepository;
import com.vidrieria.backend_vidrieria.repository.PedidoRepository;
import com.vidrieria.backend_vidrieria.repository.TipoVidrioRepository;
import com.vidrieria.backend_vidrieria.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private static final String ESTADO_INICIAL = "COTIZADO";

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MaterialRepository materialRepository;
    private final TipoVidrioRepository tipoVidrioRepository;
    private final com.vidrieria.backend_vidrieria.repository.PagoRepository pagoRepository;

    /**
     * Registra un nuevo pedido/orden de trabajo con todos sus detalles.
     *
     * @param request DTO con datos del cliente, totales y líneas de detalle.
     * @return DTO de respuesta con el pedido persistido, incluyendo IDs generados.
     */
    @Transactional
    public PedidoResponseDTO crearPedido(PedidoRequestDTO request) {

        // Obtener el usuario autenticado para asignarlo como vendedor
        Usuario vendedor = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            vendedor = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        }

        // --- a) Crear la entidad Pedido ---
        BigDecimal adelanto = request.getMontoAdelanto() != null
                ? request.getMontoAdelanto().setScale(2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        String metodoPago = (request.getMetodoPago() != null && !request.getMetodoPago().isBlank())
                ? request.getMetodoPago()
                : "EFECTIVO";

        Pedido pedido = Pedido.builder()
                .clienteNombre(request.getClienteNombre())
                .clienteTelefono(request.getClienteTelefono())
                .referenciaObra(request.getReferenciaObra())
                .tipoTrabajo(request.getTipoTrabajo())
                .estado(ESTADO_INICIAL)
                .montoAdelanto(adelanto)
                .tipoComprobante(request.getTipoComprobante())
                .metodoPago(metodoPago)
                .vendedor(vendedor)
                .fechaCreacion(Instant.now())
                .fechaRegistro(java.time.LocalDateTime.now())
                .build();

        // --- b) Mapear detalles, relacionar pedido padre y calcular total acumulando subtotales ---
        BigDecimal totalCalculado = BigDecimal.ZERO;

        if (request.getDetalles() != null && !request.getDetalles().isEmpty()) {
            for (DetallePedidoRequestDTO dto : request.getDetalles()) {
                Material moldura = null;
                if (dto.getIdMoldura() != null) {
                    moldura = materialRepository.findById(dto.getIdMoldura()).orElse(null);
                }

                TipoVidrio vidrio = null;
                if (dto.getIdVidrio() != null) {
                    vidrio = tipoVidrioRepository.findById(dto.getIdVidrio()).orElse(null);
                }

                BigDecimal alto = dto.getAlto() != null ? dto.getAlto() : dto.getAltoVano();
                BigDecimal ancho = dto.getAncho() != null ? dto.getAncho() : dto.getAnchoVano();
                Integer cantidad = dto.getCantidad() != null ? dto.getCantidad() : 1;

                BigDecimal subtotal = dto.getSubtotal();
                if (subtotal == null) {
                    if (dto.getPrecioUnitario() != null) {
                        subtotal = dto.getPrecioUnitario().multiply(BigDecimal.valueOf(cantidad));
                    } else {
                        subtotal = BigDecimal.ZERO;
                    }
                }

                // Regla de negocio: redondear siempre hacia arriba al entero más cercano (ej. 45.10 -> 46.00)
                subtotal = redondearHaciaArriba(subtotal);

                totalCalculado = totalCalculado.add(subtotal);

                DetallePedido detalle = DetallePedido.builder()
                        .alto(alto)
                        .ancho(ancho)
                        .cantidad(cantidad)
                        .subtotal(subtotal)
                        .moldura(moldura)
                        .vidrio(vidrio)
                        .descripcion(dto.getDescripcion())
                        .precioUnitario(dto.getPrecioUnitario())
                        .detallesDespiece(dto.getDetallesDespiece())
                        .build();

                pedido.agregarDetalle(detalle); // asigna detalle.setPedido(pedido)
            }
        }

        // Si el total acumulado es mayor a cero usamos esa suma, o el total explícito del request
        BigDecimal totalFinal = (totalCalculado.compareTo(BigDecimal.ZERO) > 0)
                ? totalCalculado
                : (request.getTotal() != null ? request.getTotal() : BigDecimal.ZERO);

        // Regla de negocio: redondear hacia arriba el total sumado
        totalFinal = redondearHaciaArriba(totalFinal);

        pedido.setTotal(totalFinal);
        BigDecimal saldoCalculado = totalFinal.subtract(adelanto).setScale(2, java.math.RoundingMode.HALF_UP);
        pedido.setSaldoPendiente(saldoCalculado);

        // --- c) Persistir el pedido (cascade guarda los detalles) ---
        Pedido guardado = pedidoRepository.save(pedido);

        // --- d) Generar y guardar automáticamente la entidad Pago si hubo adelanto ---
        if (adelanto.compareTo(BigDecimal.ZERO) > 0) {
            String tipoPago = (saldoCalculado.compareTo(BigDecimal.ZERO) <= 0) ? "PAGO_TOTAL" : "ADELANTO";

            com.vidrieria.backend_vidrieria.entity.Pago pago = com.vidrieria.backend_vidrieria.entity.Pago.builder()
                    .monto(adelanto)
                    .metodoPago(metodoPago)
                    .tipoPago(tipoPago)
                    .fechaRegistro(java.time.LocalDateTime.now())
                    .pedido(guardado)
                    .registrador(vendedor)
                    .build();

            pagoRepository.save(pago);
        }

        return mapToResponseDTO(guardado);
    }

    /**
     * Devuelve todos los pedidos registrados como DTOs.
     */
    @Transactional(readOnly = true)
    public List<PedidoResponseDTO> listarTodos() {
        return pedidoRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    /**
     * Actualiza el estado de un pedido existente.
     *
     * @param idPedido    ID del pedido a actualizar.
     * @param nuevoEstado nuevo valor para el campo estado.
     * @return DTO de respuesta con el pedido actualizado.
     */
    @Transactional
    public PedidoResponseDTO actualizarEstado(Integer idPedido, String nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        pedido.setEstado(nuevoEstado);
        Pedido guardado = pedidoRepository.save(pedido);

        return mapToResponseDTO(guardado);
    }

    /**
     * Liquida el saldo pendiente de un pedido: el adelanto pasa a cubrir el 100 %
     * del total, el saldo queda en 0 y el estado cambia a ENTREGADO.
     * Genera un registro de Pago tipo SALDO para trazabilidad en caja.
     *
     * @param idPedido ID del pedido a liquidar.
     * @return DTO de respuesta con el pedido actualizado.
     */
    @Transactional
    public PedidoResponseDTO liquidarSaldo(Integer idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        BigDecimal saldo = pedido.getSaldoPendiente() != null ? pedido.getSaldoPendiente() : BigDecimal.ZERO;

        if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El pedido ya se encuentra completamente pagado");
        }

        // Obtener usuario actual que cobra el saldo
        Usuario cobrador = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            cobrador = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        }

        // Registrar el Pago tipo SALDO
        com.vidrieria.backend_vidrieria.entity.Pago pagoSaldo = com.vidrieria.backend_vidrieria.entity.Pago.builder()
                .monto(saldo)
                .metodoPago(pedido.getMetodoPago() != null ? pedido.getMetodoPago() : "EFECTIVO")
                .tipoPago("SALDO")
                .fechaRegistro(java.time.LocalDateTime.now())
                .pedido(pedido)
                .registrador(cobrador)
                .build();

        pagoRepository.save(pagoSaldo);

        pedido.setMontoAdelanto(pedido.getMontoAdelanto().add(saldo));
        pedido.setSaldoPendiente(BigDecimal.ZERO);
        pedido.setEstado("ENTREGADO");

        Pedido guardado = pedidoRepository.save(pedido);
        return mapToResponseDTO(guardado);
    }

    /**
     * Registra un nuevo abono o pago parcial a un pedido existente.
     * Valida que el monto no exceda el saldo pendiente.
     *
     * @param idPedido ID del pedido a abonar.
     * @param request  DTO con monto y metodoPago.
     * @return DTO del pago registrado.
     */
    @Transactional
    public PagoResponseDTO registrarAbono(Integer idPedido, AbonoRequestDTO request) {
        if (request.getMonto() == null || request.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto del abono debe ser mayor a cero");
        }

        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + idPedido));

        BigDecimal saldoActual = pedido.getSaldoPendiente() != null ? pedido.getSaldoPendiente() : BigDecimal.ZERO;

        if (saldoActual.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El pedido ya se encuentra completamente pagado (saldo 0)");
        }

        if (request.getMonto().compareTo(saldoActual) > 0) {
            throw new IllegalArgumentException(
                    "El monto ingresado (" + request.getMonto() + ") no puede ser mayor al saldo pendiente (" + saldoActual + ")");
        }

        // Restar el monto al saldo y sumar al montoAdelanto acumulado (guardando exactamente lo enviado)
        BigDecimal montoAbono = request.getMonto().setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal nuevoSaldo = saldoActual.subtract(montoAbono).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal adelantoActual = (pedido.getMontoAdelanto() != null ? pedido.getMontoAdelanto() : BigDecimal.ZERO).setScale(2, java.math.RoundingMode.HALF_UP);
        pedido.setSaldoPendiente(nuevoSaldo);
        pedido.setMontoAdelanto(adelantoActual.add(montoAbono).setScale(2, java.math.RoundingMode.HALF_UP));

        // Lógica de tipoPago: si canceló todo el saldo restante es SALDO, si es parcial es ADELANTO
        String tipoPago = (nuevoSaldo.compareTo(BigDecimal.ZERO) == 0) ? "SALDO" : "ADELANTO";

        if (nuevoSaldo.compareTo(BigDecimal.ZERO) == 0 && "LISTO".equalsIgnoreCase(pedido.getEstado())) {
            pedido.setEstado("ENTREGADO");
        }

        // Obtener usuario autenticado que registra el abono
        Usuario cobrador = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            cobrador = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        }

        String metodo = (request.getMetodoPago() != null && !request.getMetodoPago().isBlank())
                ? request.getMetodoPago()
                : (pedido.getMetodoPago() != null ? pedido.getMetodoPago() : "EFECTIVO");

        Pago pago = Pago.builder()
                .monto(montoAbono)
                .metodoPago(metodo)
                .tipoPago(tipoPago)
                .fechaRegistro(java.time.LocalDateTime.now())
                .pedido(pedido)
                .registrador(cobrador)
                .build();

        Pago pagoGuardado = pagoRepository.save(pago);
        pedidoRepository.save(pedido);

        return mapPagoToDTO(pagoGuardado);
    }

    /**
     * Devuelve la lista completa de pagos de un pedido específico ordenados cronológicamente.
     *
     * @param idPedido ID del pedido a consultar.
     * @return Lista de pagos asociados al pedido.
     */
    @Transactional(readOnly = true)
    public List<PagoResponseDTO> listarPagosPorPedido(Integer idPedido) {
        return pagoRepository.findByPedidoIdPedidoOrderByFechaRegistroAsc(idPedido).stream()
                .map(this::mapPagoToDTO)
                .toList();
    }

    // ----- Mapeo entidad → DTO de respuesta -----

    public PedidoResponseDTO mapToResponseDTO(Pedido pedido) {

        List<PedidoResponseDTO.DetalleResponseDTO> detallesDTO = pedido.getDetalles().stream()
                .map(d -> {
                    Integer idMoldura = d.getMoldura() != null ? d.getMoldura().getIdMaterial() : null;
                    String nombreMoldura = d.getMoldura() != null ? d.getMoldura().getNombre() : null;
                    Integer idVidrio = d.getVidrio() != null ? d.getVidrio().getIdVidrio() : null;
                    String nombreVidrio = d.getVidrio() != null ? d.getVidrio().getNombre() : null;

                    return PedidoResponseDTO.DetalleResponseDTO.builder()
                            .idDetalle(d.getIdDetalle())
                            .alto(d.getAlto())
                            .ancho(d.getAncho())
                            .cantidad(d.getCantidad())
                            .subtotal(d.getSubtotal())
                            .idMoldura(idMoldura)
                            .nombreMoldura(nombreMoldura)
                            .idVidrio(idVidrio)
                            .nombreVidrio(nombreVidrio)
                            .descripcion(d.getDescripcion())
                            .precioUnitario(d.getPrecioUnitario())
                            .altoVano(d.getAlto())
                            .anchoVano(d.getAncho())
                            .detallesDespiece(d.getDetallesDespiece())
                            .build();
                })
                .toList();

        Integer idVendedor = pedido.getVendedor() != null ? pedido.getVendedor().getIdUsuario() : null;
        String vendedorUsername = pedido.getVendedor() != null ? pedido.getVendedor().getUsername() : null;

        List<PagoResponseDTO> pagosDTO = (pedido.getIdPedido() != null)
                ? pagoRepository.findByPedidoIdPedidoOrderByFechaRegistroAsc(pedido.getIdPedido())
                        .stream()
                        .map(this::mapPagoToDTO)
                        .toList()
                : List.of();

        return PedidoResponseDTO.builder()
                .idPedido(pedido.getIdPedido())
                .clienteNombre(pedido.getClienteNombre())
                .clienteTelefono(pedido.getClienteTelefono())
                .referenciaObra(pedido.getReferenciaObra())
                .tipoTrabajo(pedido.getTipoTrabajo())
                .estado(pedido.getEstado())
                .total(pedido.getTotal())
                .montoAdelanto(pedido.getMontoAdelanto())
                .saldoPendiente(pedido.getSaldoPendiente())
                .tipoComprobante(pedido.getTipoComprobante())
                .metodoPago(pedido.getMetodoPago())
                .fechaRegistro(pedido.getFechaRegistro())
                .idVendedor(idVendedor)
                .vendedorUsername(vendedorUsername)
                .detalles(detallesDTO)
                .pagos(pagosDTO)
                .build();
    }

    public PagoResponseDTO mapPagoToDTO(Pago pago) {
        Pedido p = pago.getPedido();
        Usuario r = pago.getRegistrador();

        return PagoResponseDTO.builder()
                .idPago(pago.getIdPago())
                .monto(pago.getMonto())
                .metodoPago(pago.getMetodoPago())
                .tipoPago(pago.getTipoPago())
                .fechaRegistro(pago.getFechaRegistro())
                .idPedido(p != null ? p.getIdPedido() : null)
                .clienteNombre(p != null ? p.getClienteNombre() : null)
                .clienteTelefono(p != null ? p.getClienteTelefono() : null)
                .tipoComprobante(p != null ? p.getTipoComprobante() : null)
                .totalPedido(p != null ? p.getTotal() : null)
                .saldoPendientePedido(p != null ? p.getSaldoPendiente() : null)
                .idRegistrador(r != null ? r.getIdUsuario() : null)
                .registradorUsername(r != null ? r.getUsername() : null)
                .build();
    }

    /**
     * Regla de negocio estricta: NO SE PERMITEN DECIMALES en los totales y siempre
     * se debe redondear hacia ARRIBA (a favor de la tienda) al número entero más cercano.
     * Ejemplo: 45.10 se convierte en 46.00, 45.00 se mantiene en 45.00.
     *
     * @param valor Valor numérico decimal.
     * @return Valor redondeado hacia arriba con escala de 2 decimales (.00).
     */
    private BigDecimal redondearHaciaArriba(BigDecimal valor) {
        if (valor == null) {
            return BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(Math.ceil(valor.doubleValue())).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
