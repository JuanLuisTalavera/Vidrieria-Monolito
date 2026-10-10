package com.vidrieria.backend_vidrieria.modules.inventario.port;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Puerto público del módulo Inventario (Arquitectura Hexagonal).
 * Define las operaciones que otros módulos (Cotizador, Pedidos, Ingeniería)
 * pueden solicitar sin acoplarse directamente a las entidades o repositorios de inventario.
 */
public interface InventarioQueryPort {

    /**
     * Obtiene el costo por defecto por m² de un vidrio.
     */
    Optional<BigDecimal> obtenerCostoVidrioM2(Integer idVidrio);

    /**
     * Obtiene el costo unitario por defecto de un material/moldura.
     */
    Optional<BigDecimal> obtenerCostoMaterialUnitario(Integer idMaterial);

    /**
     * Verifica si existe stock suficiente de un tipo de vidrio.
     */
    boolean existeStockVidrio(Integer idVidrio, Double cantidadRequerida);

    /**
     * Descuenta del stock físico tras confirmación de producción.
     */
    void descontarStockVidrio(Integer idVidrio, Double cantidad);

    /**
     * Descuenta stock de material consumido (varillas o metros lineales).
     */
    void descontarStockMaterial(Integer idMaterial, Double cantidad);
}
