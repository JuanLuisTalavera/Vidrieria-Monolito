package com.vidrieria.backend_vidrieria.modules.finanzas.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.finanzas.dto.DashboardResponseDTO;
import com.vidrieria.backend_vidrieria.modules.finanzas.dto.PagoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.finanzas.entity.Pago;
import com.vidrieria.backend_vidrieria.modules.finanzas.repository.PagoRepository;
import com.vidrieria.backend_vidrieria.modules.pedidos.entity.Pedido;
import com.vidrieria.backend_vidrieria.modules.pedidos.repository.PedidoRepository;
import com.vidrieria.backend_vidrieria.modules.seguridad.entity.Usuario;
import com.vidrieria.backend_vidrieria.modules.seguridad.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;

    /**
     * Retorna el resumen financiero y operativo del negocio para una fecha específica.
     * Basado en el flujo de pagos reales registrados en esa fecha.
     */
    @Transactional(readOnly = true)
    public DashboardResponseDTO obtenerResumen(LocalDate fecha) {
        if (fecha == null) {
            fecha = LocalDate.now();
        }

        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(LocalTime.MAX);

        BigDecimal cajaReal        = pagoRepository.sumarCajaRealPorFecha(inicio, fin);
        BigDecimal ventasFormales  = pagoRepository.sumarVentasFormalesPorFecha(inicio, fin);
        BigDecimal ventasInternas  = pagoRepository.sumarVentasInternasPorFecha(inicio, fin);
        BigDecimal cuentasPorCobrar = pedidoRepository.sumarCuentasPorCobrar();

        Long enTaller   = pedidoRepository.contarPorEstado("EN_TALLER");
        Long listos     = pedidoRepository.contarPorEstado("LISTO");
        Long entregados = pedidoRepository.contarPorEstado("ENTREGADO");

        List<PagoResponseDTO> pagosDelDia = pagoRepository
                .findByFechaRegistroBetweenOrderByFechaRegistroDesc(inicio, fin)
                .stream()
                .map(this::mapPagoToDTO)
                .toList();

        return DashboardResponseDTO.builder()
                .cajaReal(cajaReal != null ? cajaReal : BigDecimal.ZERO)
                .ventasFormales(ventasFormales != null ? ventasFormales : BigDecimal.ZERO)
                .ventasInternas(ventasInternas != null ? ventasInternas : BigDecimal.ZERO)
                .cuentasPorCobrar(cuentasPorCobrar != null ? cuentasPorCobrar : BigDecimal.ZERO)
                .pedidosEnTaller(enTaller != null ? enTaller.intValue() : 0)
                .pedidosListos(listos != null ? listos.intValue() : 0)
                .pedidosEntregados(entregados != null ? entregados.intValue() : 0)
                .pagosDelDia(pagosDelDia)
                .ventasDeHoy(pagosDelDia) // retrocompatibilidad con frontend
                .build();
    }

    /**
     * Calcula los totales de caja para el vendedor actualmente autenticado
     * basados en los pagos registrados por él en la fecha solicitada.
     */
    @Transactional(readOnly = true)
    public DashboardResponseDTO obtenerCajaVendedor(LocalDate fecha) {
        if (fecha == null) {
            fecha = LocalDate.now();
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            throw new RuntimeException("Usuario no autenticado");
        }

        Usuario vendedor = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + auth.getName()));

        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(LocalTime.MAX);

        BigDecimal cajaReal         = pagoRepository.sumarCajaRealPorRegistradorYFecha(vendedor, inicio, fin);
        BigDecimal ventasFormales   = pagoRepository.sumarVentasFormalesPorRegistradorYFecha(vendedor, inicio, fin);
        BigDecimal ventasInternas   = pagoRepository.sumarVentasInternasPorRegistradorYFecha(vendedor, inicio, fin);
        BigDecimal cuentasPorCobrar = pedidoRepository.sumarCuentasPorCobrar();

        Long enTaller   = pedidoRepository.contarPorEstado("EN_TALLER");
        Long listos     = pedidoRepository.contarPorEstado("LISTO");
        Long entregados = pedidoRepository.contarPorEstado("ENTREGADO");

        List<PagoResponseDTO> pagosDelDia = pagoRepository
                .findByRegistradorAndFechaRegistroBetweenOrderByFechaRegistroDesc(vendedor, inicio, fin)
                .stream()
                .map(this::mapPagoToDTO)
                .toList();

        return DashboardResponseDTO.builder()
                .cajaReal(cajaReal != null ? cajaReal : BigDecimal.ZERO)
                .ventasFormales(ventasFormales != null ? ventasFormales : BigDecimal.ZERO)
                .ventasInternas(ventasInternas != null ? ventasInternas : BigDecimal.ZERO)
                .cuentasPorCobrar(cuentasPorCobrar != null ? cuentasPorCobrar : BigDecimal.ZERO)
                .pedidosEnTaller(enTaller != null ? enTaller.intValue() : 0)
                .pedidosListos(listos != null ? listos.intValue() : 0)
                .pedidosEntregados(entregados != null ? entregados.intValue() : 0)
                .pagosDelDia(pagosDelDia)
                .ventasDeHoy(pagosDelDia) // retrocompatibilidad con frontend
                .build();
    }

    private PagoResponseDTO mapPagoToDTO(Pago pago) {
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
}
