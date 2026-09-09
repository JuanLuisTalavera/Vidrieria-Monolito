package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.GastoCajaChicaDTO;
import com.vidrieria.backend_vidrieria.dto.PagoParcialDTO;
import com.vidrieria.backend_vidrieria.entity.GastoCajaChica;
import com.vidrieria.backend_vidrieria.entity.PagoParcial;
import com.vidrieria.backend_vidrieria.entity.Pedido;
import com.vidrieria.backend_vidrieria.repository.GastoCajaChicaRepository;
import com.vidrieria.backend_vidrieria.repository.PagoParcialRepository;
import com.vidrieria.backend_vidrieria.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FinanzasService {

    private static final String ESTADO_PAGADO = "PAGADO";

    private final PagoParcialRepository pagoParcialRepository;
    private final GastoCajaChicaRepository gastoCajaChicaRepository;
    private final PedidoRepository pedidoRepository;

    /**
     * Registra un pago parcial y actualiza automáticamente el saldo del pedido.
     * Si el saldo llega a 0 o menos, marca el pedido como PAGADO.
     *
     * @param request DTO con el ID del pedido, monto y datos del pago.
     * @return La entidad PagoParcial persistida.
     */
    @Transactional
    public PagoParcial registrarPago(PagoParcialDTO request) {

        // a) Buscar el Pedido
        Pedido pedido = pedidoRepository.findById(request.getIdPedido())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No se encontró el pedido con ID: " + request.getIdPedido()));

        // b) Crear y guardar el PagoParcial
        PagoParcial pago = PagoParcial.builder()
                .monto(request.getMonto())
                .tipoMovimiento(request.getTipoMovimiento())
                .metodoPago(request.getMetodoPago())
                .fechaPago(Instant.now())
                .nota(request.getNota())
                .pedido(pedido)
                .build();

        PagoParcial pagoGuardado = pagoParcialRepository.save(pago);

        // c) Restar el monto del saldoPendiente
        BigDecimal saldoActual = pedido.getSaldoPendiente() != null
                ? pedido.getSaldoPendiente()
                : BigDecimal.ZERO;

        BigDecimal nuevoSaldo = saldoActual.subtract(request.getMonto());
        pedido.setSaldoPendiente(nuevoSaldo);

        // d) Si el saldo llega a 0 o menos → marcar como PAGADO
        if (nuevoSaldo.compareTo(BigDecimal.ZERO) <= 0) {
            pedido.setEstado(ESTADO_PAGADO);
            pedido.setSaldoPendiente(BigDecimal.ZERO); // evitar saldos negativos
        }

        // e) Guardar el Pedido actualizado
        pedidoRepository.save(pedido);

        return pagoGuardado;
    }

    /**
     * Registra un gasto de caja chica (egreso operativo del taller).
     *
     * @param request DTO con motivo, monto, categoría y usuario que registra.
     * @return La entidad GastoCajaChica persistida.
     */
    @Transactional
    public GastoCajaChica registrarGasto(GastoCajaChicaDTO request) {

        GastoCajaChica gasto = GastoCajaChica.builder()
                .motivo(request.getMotivo())
                .monto(request.getMonto())
                .categoria(request.getCategoria())
                .fechaGasto(Instant.now())
                .idUsuarioRegistra(request.getIdUsuarioRegistra())
                .build();

        return gastoCajaChicaRepository.save(gasto);
    }
}
