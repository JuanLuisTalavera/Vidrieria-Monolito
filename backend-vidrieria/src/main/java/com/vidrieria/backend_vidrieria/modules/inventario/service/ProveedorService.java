package com.vidrieria.backend_vidrieria.modules.inventario.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.HistorialPrecioProveedor;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Proveedor;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.HistorialPrecioProveedorRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.ProveedorRepository;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final HistorialPrecioProveedorRepository historialRepository;
    private final MaterialRepository materialRepository;

    /**
     * Actualiza el precio de un material y registra automáticamente el cambio en el historial.
     *
     * @param idMaterial  ID del material a actualizar.
     * @param nuevoPrecio Nuevo costo unitario por defecto.
     * @param idProveedor ID del proveedor que cotiza el nuevo precio.
     * @return El registro de historial creado.
     */
    @Transactional
    public HistorialPrecioProveedor actualizarPrecioMaterial(Integer idMaterial,
                                                             BigDecimal nuevoPrecio,
                                                             Integer idProveedor) {

        // a) Buscar el Material
        Material material = materialRepository.findById(idMaterial)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No se encontró el material con ID: " + idMaterial));

        // Buscar el Proveedor
        Proveedor proveedor = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No se encontró el proveedor con ID: " + idProveedor));

        // b) y c) Crear el registro de historial con costo anterior y nuevo
        HistorialPrecioProveedor historial = HistorialPrecioProveedor.builder()
                .costoAnterior(material.getCostoDefectoUnitario())
                .costoNuevo(nuevoPrecio)
                .fechaCambio(Instant.now())
                .material(material)       // d) Relacionar con el material
                .proveedor(proveedor)      // d) Relacionar con el proveedor
                .build();

        // e) Guardar el registro en el historial
        HistorialPrecioProveedor historialGuardado = historialRepository.save(historial);

        // f) Actualizar el costoDefectoUnitario del material y guardar
        material.setCostoDefectoUnitario(nuevoPrecio);
        materialRepository.save(material);

        return historialGuardado;
    }
}
