package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.Pago;
import com.vidrieria.backend_vidrieria.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Integer> {

    // Listar pagos por rango de fechaRegistro (ordenados por fecha descendente)
    List<Pago> findByFechaRegistroBetweenOrderByFechaRegistroDesc(LocalDateTime inicio, LocalDateTime fin);

    // Listar pagos por registrador y rango de fechaRegistro
    List<Pago> findByRegistradorAndFechaRegistroBetweenOrderByFechaRegistroDesc(Usuario registrador, LocalDateTime inicio, LocalDateTime fin);

    // Listar pagos de un pedido específico ordenados por fecha ascendente
    List<Pago> findByPedidoIdPedidoOrderByFechaRegistroAsc(Integer idPedido);

    // Sumar caja real del día en base a pagos
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.fechaRegistro >= :inicio AND p.fechaRegistro <= :fin")
    BigDecimal sumarCajaRealPorFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    // Sumar caja real del día por registrador
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.registrador = :registrador AND p.fechaRegistro >= :inicio AND p.fechaRegistro <= :fin")
    BigDecimal sumarCajaRealPorRegistradorYFecha(@Param("registrador") Usuario registrador, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    // Sumar pagos formales (BOLETA, FACTURA) del día
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.pedido.tipoComprobante IN ('BOLETA', 'FACTURA') AND p.fechaRegistro >= :inicio AND p.fechaRegistro <= :fin")
    BigDecimal sumarVentasFormalesPorFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    // Sumar pagos formales del día por registrador
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.registrador = :registrador AND p.pedido.tipoComprobante IN ('BOLETA', 'FACTURA') AND p.fechaRegistro >= :inicio AND p.fechaRegistro <= :fin")
    BigDecimal sumarVentasFormalesPorRegistradorYFecha(@Param("registrador") Usuario registrador, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    // Sumar pagos internos (NOTA_VENTA) del día
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.pedido.tipoComprobante = 'NOTA_VENTA' AND p.fechaRegistro >= :inicio AND p.fechaRegistro <= :fin")
    BigDecimal sumarVentasInternasPorFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    // Sumar pagos internos del día por registrador
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.registrador = :registrador AND p.pedido.tipoComprobante = 'NOTA_VENTA' AND p.fechaRegistro >= :inicio AND p.fechaRegistro <= :fin")
    BigDecimal sumarVentasInternasPorRegistradorYFecha(@Param("registrador") Usuario registrador, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
