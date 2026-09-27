package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.CotizacionObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraRequestDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.GuardarCotizacionObraRequestDTO;
import com.vidrieria.backend_vidrieria.service.CotizacionObraService;
import com.vidrieria.backend_vidrieria.service.DespieceObraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/obras")
@RequiredArgsConstructor
@Tag(name = "Cotizaciones de Obra y Despiece", description = "Endpoints para cálculo de despiece milimétrico, perfiles, cristales, herrajes y registro de obras")
public class CotizacionObraController {

    private final DespieceObraService despieceObraService;
    private final CotizacionObraService cotizacionObraService;

    /**
     * Calcula el despiece milimétrico (aluminio, cristal, herrajes), plano de corte de varillas y desglose de costos.
     *
     * @param request DTO con dimensiones de vano y tipo de estructura.
     * @return Despiece completo y costos calculados con redondeo Math.ceil.
     */
    @PostMapping("/calcular-despiece")
    @Operation(summary = "Calcular despiece de obra",
            description = "Calcula la lista de perfiles, cristales, herrajes, optimización de cortes y desglose de costos para la estructura solicitada")
    public ResponseEntity<DespieceObraResponseDTO> calcularDespiece(@Valid @RequestBody DespieceObraRequestDTO request) {
        DespieceObraResponseDTO response = despieceObraService.calcularDespiece(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Registra y guarda la cotización de obra en la base de datos.
     *
     * @param request DTO con los datos de la cotización y/o obra a persistir.
     * @return Cotización guardada con su identificador.
     */
    @PostMapping("/guardar")
    @Operation(summary = "Guardar cotización de obra",
            description = "Persiste la cotización de obra en base de datos calculando automáticamente costos si no fueron provistos")
    public ResponseEntity<CotizacionObraResponseDTO> guardar(@Valid @RequestBody GuardarCotizacionObraRequestDTO request) {
        CotizacionObraResponseDTO response = cotizacionObraService.guardarCotizacion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lista todas las cotizaciones de obra registradas en orden cronológico descendente.
     */
    @GetMapping
    @Operation(summary = "Listar cotizaciones de obra", description = "Retorna el historial completo de cotizaciones de obras registradas")
    public ResponseEntity<List<CotizacionObraResponseDTO>> listarTodas() {
        return ResponseEntity.ok(cotizacionObraService.listarTodas());
    }

    /**
     * Obtiene el detalle de una cotización de obra específica por su ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obtener cotización por ID", description = "Obtiene los detalles de una cotización de obra registrada")
    public ResponseEntity<CotizacionObraResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(cotizacionObraService.obtenerPorId(id));
    }
}
