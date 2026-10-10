package com.vidrieria.backend_vidrieria.modules.pedidos.service;

import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.vidrieria.backend_vidrieria.modules.clientes.entity.Cliente;
import com.vidrieria.backend_vidrieria.modules.finanzas.dto.PagoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.finanzas.entity.Pago;
import com.vidrieria.backend_vidrieria.modules.finanzas.repository.PagoRepository;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.AccesorioItemDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.DespieceObraResponseDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaAluminioDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaCristalDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.TipoVidrioRepository;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.AbonoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.DetallePedidoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.PedidoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.dto.PedidoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.pedidos.entity.DetallePedido;
import com.vidrieria.backend_vidrieria.modules.pedidos.entity.Pedido;
import com.vidrieria.backend_vidrieria.modules.pedidos.repository.PedidoRepository;
import com.vidrieria.backend_vidrieria.modules.seguridad.entity.Usuario;
import com.vidrieria.backend_vidrieria.modules.seguridad.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoService {

    private static final String ESTADO_INICIAL = "COTIZADO";

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MaterialRepository materialRepository;
    private final TipoVidrioRepository tipoVidrioRepository;
    private final PagoRepository pagoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        // Determinar tipo de trabajo: detectar automáticamente pedidos mixtos
        String tipoTrabajo = request.getTipoTrabajo();
        if (request.getDetalles() != null && !request.getDetalles().isEmpty()) {
            boolean tieneMoldura = request.getDetalles().stream()
                    .anyMatch(d -> d.getIdMoldura() != null);
            boolean tieneVidrioSuelto = request.getDetalles().stream()
                    .anyMatch(d -> d.getIdMoldura() == null && d.getIdVidrio() != null);

            if (tieneMoldura && tieneVidrioSuelto) {
                tipoTrabajo = "MIXTO";
                request.setTipoTrabajo("MIXTO");
            }
        }

        Pedido pedido = Pedido.builder()
                .clienteNombre(request.getClienteNombre())
                .clienteTelefono(request.getClienteTelefono())
                .referenciaObra(request.getReferenciaObra())
                .tipoTrabajo(tipoTrabajo)
                .estado(ESTADO_INICIAL)
                .montoAdelanto(adelanto)
                .tipoComprobante(request.getTipoComprobante())
                .metodoPago(metodoPago)
                .vendedor(vendedor)
                .fechaCreacion(Instant.now())
                .fechaRegistro(java.time.LocalDateTime.now())
                .fechaEntrega(request.getFechaEntrega())
                .build();
        pedido.setFechaEntrega(request.getFechaEntrega());

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
                        .descontarStock(dto.getDescontarStock())
                        .build();

                pedido.agregarDetalle(detalle); // asigna detalle.setPedido(pedido)

                // Descuento condicional de inventario
                if (Boolean.TRUE.equals(detalle.getDescontarStock())) {
                    procesarDescuentoInventario(detalle);
                }
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

            Pago pago = Pago.builder()
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
     * Devuelve todos los pedidos registrados como DTOs evitando N+1 en relaciones hijas y pagos.
     */
    @Transactional(readOnly = true)
    public List<PedidoResponseDTO> listarTodos() {
        List<Pedido> pedidos = pedidoRepository.findAllOptimizado();
        if (pedidos.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> ids = pedidos.stream()
                .map(Pedido::getIdPedido)
                .toList();

        List<Pago> todosLosPagos = pagoRepository.findByPedidoIdPedidoIn(ids);

        Map<Integer, List<Pago>> pagosPorPedido = todosLosPagos.stream()
                .collect(Collectors.groupingBy(p -> p.getPedido().getIdPedido()));

        return pedidos.stream()
                .map(p -> mapToResponseDTO(p, pagosPorPedido.getOrDefault(p.getIdPedido(), Collections.emptyList())))
                .toList();
    }

    /**
     * Devuelve pedidos paginados aplicando el patrón de paginar IDs primero
     * para evitar el desbordamiento de memoria y advertencias HHH000104 de Hibernate.
     *
     * @param page    número de página (0-indexado)
     * @param size    cantidad de elementos por página
     * @param sortDir dirección de ordenamiento ("ASC" o "DESC")
     * @return Página de PedidoResponseDTO con sus detalles y pagos
     */
    @Transactional(readOnly = true)
    public Page<PedidoResponseDTO> listarPaginados(int page, int size, String sortDir) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page,
                size,
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.fromString(sortDir),
                        "fechaRegistro"
                )
        );
        Page<Integer> pageIds = pedidoRepository.findPaginatedIds(pageable);

        if (pageIds.isEmpty()) {
            return Page.empty(pageable);
        }

        // Traer las entidades completas solo para los IDs de esta página
        List<Pedido> pedidos = pedidoRepository.findPedidosWithDetails(pageIds.getContent());
        List<Integer> ids = pedidos.stream().map(Pedido::getIdPedido).toList();

        // Obtener los pagos solo de esta página (sin bucles)
        List<Pago> todosLosPagos = pagoRepository.findByPedidoIdPedidoIn(ids);
        Map<Integer, List<Pago>> pagosPorPedido = todosLosPagos.stream()
                .collect(Collectors.groupingBy(p -> p.getPedido().getIdPedido()));

        Map<Integer, Pedido> pedidosPorId = pedidos.stream()
                .collect(Collectors.toMap(Pedido::getIdPedido, p -> p, (a, b) -> a));

        // Mapear manteniendo el orden original de la paginación según los IDs ordenados
        List<PedidoResponseDTO> dtoList = pageIds.getContent().stream()
                .map(pedidosPorId::get)
                .filter(java.util.Objects::nonNull)
                .map(p -> mapToResponseDTO(p, pagosPorPedido.getOrDefault(p.getIdPedido(), List.of())))
                .toList();

        return new PageImpl<>(dtoList, pageable, pageIds.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<PedidoResponseDTO> listarPaginados(int page, int size) {
        return listarPaginados(page, size, "DESC");
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
                .orElseThrow(() -> new EntityNotFoundException("Pedido no encontrado con ID: " + idPedido));

        if ("CONFIRMADO".equalsIgnoreCase(nuevoEstado)) {
            descontarStockPendiente(pedido);
        }

        pedido.setEstado(nuevoEstado);
        Pedido guardado = pedidoRepository.save(pedido);

        return mapToResponseDTO(guardado);
    }

    /**
     * Confirma un pedido proveniente de una obra o cotización y descuenta el inventario real bajo transacción.
     */
    @Transactional
    public PedidoResponseDTO confirmarPedido(Integer idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("Pedido no encontrado con ID: " + idPedido));

        descontarStockPendiente(pedido);
        pedido.setEstado("CONFIRMADO");

        Pedido guardado = pedidoRepository.save(pedido);
        return mapToResponseDTO(guardado);
    }

    private void descontarStockPendiente(Pedido pedido) {
        if (pedido.getDetalles() != null) {
            for (DetallePedido detalle : pedido.getDetalles()) {
                if (Boolean.TRUE.equals(detalle.getDescontarStock())) {
                    procesarDescuentoInventario(detalle);
                }
            }
        }
    }

    /**
     * Descuenta el inventario real del detalle:
     * - Si proviene de obra con detallesDespiece:
     *   * Aluminio: Convierte mm/metros lineales a varillas y descuenta la fracción del stock.
     *   * Vidrio: Suma el área (m2) y descuenta del stock de la plancha.
     *   * Accesorios: Descuenta las unidades exactas.
     * - Si es estándar (sin despiece):
     *   * Moldura y vidrio simple según dimensiones.
     */
    private void procesarDescuentoInventario(DetallePedido detalle) {
        int cantDetalle = (detalle.getCantidad() != null && detalle.getCantidad() > 0)
                ? detalle.getCantidad()
                : 1;

        if (detalle.getDetallesDespiece() != null && !detalle.getDetallesDespiece().trim().isEmpty()) {
            try {
                DespieceObraResponseDTO despiece = objectMapper.readValue(
                        detalle.getDetallesDespiece(),
                        DespieceObraResponseDTO.class
                );

                if (despiece != null) {
                    // 1. Descontar Aluminio
                    if (despiece.getPiezasAluminio() != null) {
                        for (PiezaAluminioDTO pieza : despiece.getPiezasAluminio()) {
                            String nombre = pieza.getNombrePerfil();
                            Material mat = materialRepository.findByNombreIgnoreCase(nombre)
                                    .orElseGet(() -> materialRepository.findByNombre(nombre)
                                            .orElseThrow(() -> new EntityNotFoundException("Material '" + nombre + "' no encontrado en el inventario")));

                            double longitudMm = (pieza.getLongitudTotalMm() != null && pieza.getLongitudTotalMm() > 0)
                                    ? pieza.getLongitudTotalMm()
                                    : (pieza.getLongitudMm() != null ? pieza.getLongitudMm() * pieza.getCantidad() : 0.0);

                            double metrosLineales = longitudMm / 1000.0;
                            double longitudVarillaM = (mat.getLongitudVarilla() != null && mat.getLongitudVarilla().doubleValue() > 0)
                                    ? mat.getLongitudVarilla().doubleValue()
                                    : 6.0;
                            if (longitudVarillaM > 100.0) {
                                longitudVarillaM /= 1000.0;
                            }

                            double varillasADescontar = (metrosLineales / longitudVarillaM) * cantDetalle;
                            double stockActual = (mat.getStock() != null) ? mat.getStock() : 0.0;
                            mat.setStock(stockActual - varillasADescontar);
                            materialRepository.save(mat);
                        }
                    }

                    // 2. Descontar Vidrio
                    if (despiece.getPiezasCristal() != null) {
                        for (PiezaCristalDTO cristal : despiece.getPiezasCristal()) {
                            TipoVidrio vidrio = detalle.getVidrio();
                            if (vidrio == null && cristal.getDescripcion() != null) {
                                String desc = cristal.getDescripcion().trim();
                                vidrio = tipoVidrioRepository.findByNombreIgnoreCase(desc)
                                        .orElseGet(() -> tipoVidrioRepository.findByNombre(desc)
                                                .orElse(null));
                            }
                            if (vidrio == null) {
                                throw new EntityNotFoundException("Vidrio '" + cristal.getDescripcion() + "' no encontrado en el inventario");
                            }

                            double areaM2 = (cristal.getAreaM2Total() != null && cristal.getAreaM2Total() > 0)
                                    ? cristal.getAreaM2Total()
                                    : ((cristal.getAreaM2Unitaria() != null ? cristal.getAreaM2Unitaria() : 0.0) * cristal.getCantidad());

                            double areaTotalM2 = areaM2 * cantDetalle;
                            double stockActual = (vidrio.getStock() != null) ? vidrio.getStock() : 0.0;

                            if (vidrio.getAnchoPlancha() != null && vidrio.getAltoPlancha() != null
                                    && (vidrio.getAnchoPlancha().doubleValue() * vidrio.getAltoPlancha().doubleValue()) > 0) {
                                double areaPlancha = vidrio.getAnchoPlancha().doubleValue() * vidrio.getAltoPlancha().doubleValue();
                                double planchasADescontar = areaTotalM2 / areaPlancha;
                                vidrio.setStock(stockActual - planchasADescontar);
                            } else {
                                vidrio.setStock(stockActual - areaTotalM2);
                            }
                            tipoVidrioRepository.save(vidrio);
                        }
                    }

                    // 3. Descontar Accesorios
                    if (despiece.getAccesorios() != null) {
                        for (AccesorioItemDTO acc : despiece.getAccesorios()) {
                            String desc = acc.getDescripcion();
                            Material mat = materialRepository.findByNombreIgnoreCase(desc)
                                    .orElseGet(() -> materialRepository.findByNombre(desc)
                                            .orElseThrow(() -> new EntityNotFoundException("Material '" + desc + "' no encontrado en el inventario")));

                            double unidadesADescontar = (acc.getCantidad() != null ? acc.getCantidad() : 1.0) * cantDetalle;
                            double stockActual = (mat.getStock() != null) ? mat.getStock() : 0.0;
                            mat.setStock(stockActual - unidadesADescontar);
                            materialRepository.save(mat);
                        }
                    }
                }
            } catch (EntityNotFoundException enfe) {
                throw enfe;
            } catch (Exception e) {
                log.error("Error al parsear detallesDespiece para descuento de inventario", e);
                throw new RuntimeException("Error procesando el despiece del pedido: " + e.getMessage(), e);
            }
        } else {
            // Descuento estándar para marcos / molduras y vidrio simple
            double altoVal = (detalle.getAlto() != null) ? detalle.getAlto().doubleValue() : 0.0;
            double anchoVal = (detalle.getAncho() != null) ? detalle.getAncho().doubleValue() : 0.0;

            if (detalle.getMoldura() != null) {
                Material moldura = detalle.getMoldura();
                double metros = ((2.0 * (altoVal + anchoVal)) / 100.0) * cantDetalle;
                double stockMoldura = (moldura.getStock() != null) ? moldura.getStock() : 0.0;
                moldura.setStock(stockMoldura - metros);
                materialRepository.save(moldura);
            }

            if (detalle.getVidrio() != null) {
                TipoVidrio vidrio = detalle.getVidrio();
                double m2 = ((altoVal * anchoVal) / 10000.0) * cantDetalle;
                double stockVidrio = (vidrio.getStock() != null) ? vidrio.getStock() : 0.0;
                vidrio.setStock(stockVidrio - m2);
                tipoVidrioRepository.save(vidrio);
            }
        }

        // Marcar que el stock ya fue descontado para este detalle
        detalle.setDescontarStock(false);
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
        Pago pagoSaldo = Pago.builder()
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
        List<Pago> pagos = (pedido.getIdPedido() != null)
                ? pagoRepository.findByPedidoIdPedidoOrderByFechaRegistroAsc(pedido.getIdPedido())
                : Collections.emptyList();
        return mapToResponseDTO(pedido, pagos);
    }

    public PedidoResponseDTO mapToResponseDTO(Pedido pedido, List<Pago> pagos) {

        List<PedidoResponseDTO.DetalleResponseDTO> detallesDTO = pedido.getDetalles() != null
                ? pedido.getDetalles().stream()
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
                                    .descontarStock(d.getDescontarStock())
                                    .build();
                        })
                        .toList()
                : Collections.emptyList();

        Integer idVendedor = pedido.getVendedor() != null ? pedido.getVendedor().getIdUsuario() : null;
        String vendedorUsername = pedido.getVendedor() != null ? pedido.getVendedor().getUsername() : null;

        List<PagoResponseDTO> pagosDTO = (pagos != null)
                ? pagos.stream()
                        .map(this::mapPagoToDTO)
                        .toList()
                : Collections.emptyList();

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
                .fechaEntrega(pedido.getFechaEntrega())
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
