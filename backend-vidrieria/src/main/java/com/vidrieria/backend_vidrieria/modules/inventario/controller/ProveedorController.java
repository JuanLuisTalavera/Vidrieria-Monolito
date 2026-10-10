package com.vidrieria.backend_vidrieria.modules.inventario.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.HistorialPrecioProveedor;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Proveedor;
import com.vidrieria.backend_vidrieria.modules.inventario.service.ProveedorService;

@RestController
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorService proveedorService;

    /**
     * Actualiza el precio de un material y registra el cambio en el historial.
     *
     * @param id          ID del material a actualizar.
     * @param nuevoPrecio Nuevo costo unitario.
     * @param idProveedor ID del proveedor que cotiza el nuevo precio.
     * @return Registro de historial con costo anterior y nuevo.
     */
    @PutMapping("/material/{id}/precio")
    public ResponseEntity<HistorialPrecioProveedor> actualizarPrecioMaterial(
            @PathVariable("id") Integer id,
            @RequestParam("nuevoPrecio") BigDecimal nuevoPrecio,
            @RequestParam("idProveedor") Integer idProveedor) {

        HistorialPrecioProveedor historial = proveedorService
                .actualizarPrecioMaterial(id, nuevoPrecio, idProveedor);

        return ResponseEntity.ok(historial);
    }
}
