package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.OptimizadorJobDTO;
import com.vidrieria.backend_vidrieria.dto.OptimizadorRequestDTO;
import com.vidrieria.backend_vidrieria.dto.OptimizadorResponseDTO;
import com.vidrieria.backend_vidrieria.dto.OptimizadorVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.dto.OptimizadorVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.service.CorteVarillaService;
import com.vidrieria.backend_vidrieria.service.OptimizadorJobManager;
import com.vidrieria.backend_vidrieria.service.OptimizadorVidrioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/optimizador-corte")
@RequiredArgsConstructor
@Tag(name = "Optimizador de Cortes 1D y 2D", description = "Endpoints para optimización de trazado de varillas lineales y planchas de vidrio")
public class OptimizadorController {

    private final CorteVarillaService corteVarillaService;
    private final OptimizadorVidrioService optimizadorVidrioService;
    private final OptimizadorJobManager jobManager;

    // ===================================================================
    // Optimización de Varillas 1D (síncrono — sin cambios)
    // ===================================================================

    /**
     * Calcula la distribución óptima de piezas en varillas estándar usando el algoritmo Best-Fit Decreasing.
     *
     * @param request DTO con longitud estándar, merma de disco y lista de cortes requeridos.
     * @return Trazado milimétrico de cada varilla con coordenadas y métricas de aprovechamiento.
     */
    @PostMapping({"/calcular", "/varilla", "/aluminio"})
    @Operation(summary = "Calcular optimización de corte 1D",
            description = "Empaqueta los cortes requeridos en el menor número de varillas posibles considerando la merma del disco de sierra")
    public ResponseEntity<OptimizadorResponseDTO> calcular(@Valid @RequestBody OptimizadorRequestDTO request) {
        OptimizadorResponseDTO response = corteVarillaService.optimizarCorte(request);
        return ResponseEntity.ok(response);
    }

    // ===================================================================
    // Optimización de Vidrio 2D — Arquitectura Asíncrona (Jobs)
    // ===================================================================

    /**
     * Somete un nuevo job de optimización de corte de vidrio 2D.
     * Valida los parámetros de inmediato y retorna un {@code jobId} sin bloquear el hilo.
     * El motor Simulated Annealing se ejecuta en un hilo separado con un límite de 15 segundos.
     *
     * <p><b>Flujo:</b></p>
     * <ol>
     *   <li>POST a este endpoint → recibe {@code jobId}.</li>
     *   <li>GET a {@code /vidrio/status/{jobId}} → consulta progreso y resultado.</li>
     *   <li>POST a {@code /vidrio/stop/{jobId}} → interrumpe y retorna la bestSolution actual.</li>
     * </ol>
     *
     * @param request DTO con dimensiones de plancha y lista de piezas requeridas.
     * @return 202 Accepted con el {@code jobId}.
     */
    @PostMapping({"/vidrio", "/calcular-vidrio", "/vidrio/calcular"})
    @Operation(summary = "Iniciar optimización asíncrona de corte de vidrio 2D",
            description = "Somete un job de optimización por Simulated Annealing. Devuelve un jobId para consultar progreso y resultado.")
    public ResponseEntity<Map<String, String>> calcularVidrio(@Valid @RequestBody OptimizadorVidrioRequestDTO request) {
        // Validación síncrona — falla inmediatamente con 400 si es inválida
        optimizadorVidrioService.validarRequest(request);

        String jobId = jobManager.submitJob(request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(Map.of(
                        "jobId", jobId,
                        "statusUrl", "/api/v1/optimizador-corte/vidrio/status/" + jobId,
                        "stopUrl", "/api/v1/optimizador-corte/vidrio/stop/" + jobId,
                        "mensaje", "Optimización iniciada. Consulta el progreso con el statusUrl."
                ));
    }

    /**
     * Consulta el estado y progreso de un job de optimización.
     * Cuando el estado es COMPLETADO o DETENIDO, incluye el resultado final.
     *
     * @param jobId Identificador del job retornado por el endpoint POST.
     * @return 200 con el estado del job, o 404 si el jobId no existe.
     */
    @GetMapping("/vidrio/status/{jobId}")
    @Operation(summary = "Consultar estado de job de optimización",
            description = "Devuelve progreso, iteraciones y resultado (si completado) del job.")
    public ResponseEntity<OptimizadorJobDTO> consultarEstado(@PathVariable String jobId) {
        OptimizadorJobDTO status = jobManager.getJobStatus(jobId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Solicita la detención de un job de optimización en progreso.
     * El motor retorna la mejor solución encontrada hasta el momento.
     *
     * @param jobId Identificador del job a detener.
     * @return 200 si se señaló la detención, 404 si el jobId no existe.
     */
    @PostMapping("/vidrio/stop/{jobId}")
    @Operation(summary = "Detener job de optimización",
            description = "Interrumpe el motor y retorna la bestSolution encontrada hasta el momento.")
    public ResponseEntity<Map<String, String>> detenerJob(@PathVariable String jobId) {
        boolean found = jobManager.stopJob(jobId);
        if (!found) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of(
                "jobId", jobId,
                "mensaje", "Señal de detención enviada. Consulta el status para obtener el resultado."
        ));
    }

    // ===================================================================
    // Endpoint síncrono (backward-compatible, bloquea hasta completar)
    // ===================================================================

    /**
     * Versión síncrona del optimizador de vidrio 2D.
     * Bloquea el hilo hasta que el motor Simulated Annealing termine (hasta 15 segundos).
     * Útil para integraciones que no soportan polling asíncrono.
     *
     * @param request DTO con dimensiones de plancha y lista de piezas requeridas.
     * @return Resultado completo de la optimización.
     */
    @PostMapping("/vidrio/sync")
    @Operation(summary = "Optimización síncrona de corte de vidrio 2D (bloquea hasta completar)",
            description = "Ejecuta la optimización de forma síncrona y devuelve el resultado completo directamente.")
    public ResponseEntity<OptimizadorVidrioResponseDTO> calcularVidrioSync(
            @Valid @RequestBody OptimizadorVidrioRequestDTO request) {
        OptimizadorVidrioResponseDTO response = optimizadorVidrioService.optimizarCorteVidrio(request);
        return ResponseEntity.ok(response);
    }
}
