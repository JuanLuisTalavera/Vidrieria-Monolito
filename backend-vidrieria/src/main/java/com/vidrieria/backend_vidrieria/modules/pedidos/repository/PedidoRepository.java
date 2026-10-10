package com.vidrieria.backend_vidrieria.modules.pedidos.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.pedidos.entity.Pedido;
import com.vidrieria.backend_vidrieria.modules.seguridad.entity.Usuario;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    @Query("SELECT p.idPedido FROM Pedido p")
    Page<Integer> findPaginatedIds(Pageable pageable);

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.vendedor LEFT JOIN FETCH p.detalles d LEFT JOIN FETCH d.moldura LEFT JOIN FETCH d.vidrio WHERE p.idPedido IN :ids")
    List<Pedido> findPedidosWithDetails(@Param("ids") List<Integer> ids);

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.vendedor LEFT JOIN FETCH p.detalles d LEFT JOIN FETCH d.moldura LEFT JOIN FETCH d.vidrio ORDER BY p.fechaRegistro DESC")
    List<Pedido> findAllOptimizado();

    List<Pedido> findByEstado(String estado);

    // Caja Real: suma de todos los adelantos recibidos (dinero físico en caja)
    @Query("SELECT COALESCE(SUM(p.montoAdelanto), 0) FROM Pedido p")
    BigDecimal sumarCajaReal();

    // Ventas Formales: total de pedidos con comprobante SUNAT (BOLETA o FACTURA)
    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.tipoComprobante IN ('BOLETA', 'FACTURA')")
    BigDecimal sumarVentasFormales();

    // Ventas Internas: total de pedidos de control interno (NOTA_VENTA)
    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.tipoComprobante = 'NOTA_VENTA'")
    BigDecimal sumarVentasInternas();

    // Cuentas por Cobrar: suma de todos los saldos pendientes
    @Query("SELECT COALESCE(SUM(p.saldoPendiente), 0) FROM Pedido p")
    BigDecimal sumarCuentasPorCobrar();

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.estado = :estado")
    Long contarPorEstado(@Param("estado") String estado);

    // --- Métodos de resumen filtrados por vendedor y rango de fechas (Caja del Vendedor) ---

    @Query("SELECT COALESCE(SUM(p.montoAdelanto), 0) FROM Pedido p WHERE p.vendedor = :vendedor AND p.fechaCreacion >= :inicio AND p.fechaCreacion < :fin")
    BigDecimal sumarCajaRealPorVendedorYFecha(@Param("vendedor") Usuario vendedor, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.vendedor = :vendedor AND p.tipoComprobante IN ('BOLETA', 'FACTURA') AND p.fechaCreacion >= :inicio AND p.fechaCreacion < :fin")
    BigDecimal sumarVentasFormalesPorVendedorYFecha(@Param("vendedor") Usuario vendedor, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.vendedor = :vendedor AND p.tipoComprobante = 'NOTA_VENTA' AND p.fechaCreacion >= :inicio AND p.fechaCreacion < :fin")
    BigDecimal sumarVentasInternasPorVendedorYFecha(@Param("vendedor") Usuario vendedor, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    @Query("SELECT COALESCE(SUM(p.saldoPendiente), 0) FROM Pedido p WHERE p.vendedor = :vendedor AND p.fechaCreacion >= :inicio AND p.fechaCreacion < :fin")
    BigDecimal sumarCuentasPorCobrarPorVendedorYFecha(@Param("vendedor") Usuario vendedor, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.vendedor = :vendedor AND p.estado = :estado AND p.fechaCreacion >= :inicio AND p.fechaCreacion < :fin")
    Long contarPorEstadoYVendedorYFecha(@Param("estado") String estado, @Param("vendedor") Usuario vendedor, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    // --- Consultas de lista de pedidos de hoy ---

    @Query("SELECT p FROM Pedido p WHERE (p.fechaRegistro >= :inicioLocal AND p.fechaRegistro < :finLocal) OR (p.fechaCreacion >= :inicioInstant AND p.fechaCreacion < :finInstant) ORDER BY p.idPedido DESC")
    List<Pedido> buscarVentasDeHoy(@Param("inicioInstant") Instant inicioInstant, @Param("finInstant") Instant finInstant, @Param("inicioLocal") java.time.LocalDateTime inicioLocal, @Param("finLocal") java.time.LocalDateTime finLocal);

    @Query("SELECT p FROM Pedido p WHERE p.vendedor = :vendedor AND ((p.fechaRegistro >= :inicioLocal AND p.fechaRegistro < :finLocal) OR (p.fechaCreacion >= :inicioInstant AND p.fechaCreacion < :finInstant)) ORDER BY p.idPedido DESC")
    List<Pedido> buscarVentasDeHoyPorVendedor(@Param("vendedor") Usuario vendedor, @Param("inicioInstant") Instant inicioInstant, @Param("finInstant") Instant finInstant, @Param("inicioLocal") java.time.LocalDateTime inicioLocal, @Param("finLocal") java.time.LocalDateTime finLocal);
}
