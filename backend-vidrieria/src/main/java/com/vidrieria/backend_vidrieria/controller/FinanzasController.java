package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.GastoCajaChicaDTO;
import com.vidrieria.backend_vidrieria.dto.PagoParcialDTO;
import com.vidrieria.backend_vidrieria.entity.GastoCajaChica;
import com.vidrieria.backend_vidrieria.entity.PagoParcial;
import com.vidrieria.backend_vidrieria.service.FinanzasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/finanzas")
@RequiredArgsConstructor
public class FinanzasController {

    private final FinanzasService finanzasService;

    /**
     * Registra un pago parcial contra un pedido existente.
     * Actualiza automáticamente el saldo pendiente del pedido.
     */
    @PostMapping("/pagos")
    public ResponseEntity<PagoParcial> registrarPago(
            @RequestBody PagoParcialDTO request) {

        PagoParcial pago = finanzasService.registrarPago(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }

    /**
     * Registra un gasto operativo de caja chica.
     */
    @PostMapping("/gastos")
    public ResponseEntity<GastoCajaChica> registrarGasto(
            @RequestBody GastoCajaChicaDTO request) {

        GastoCajaChica gasto = finanzasService.registrarGasto(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(gasto);
    }
}
