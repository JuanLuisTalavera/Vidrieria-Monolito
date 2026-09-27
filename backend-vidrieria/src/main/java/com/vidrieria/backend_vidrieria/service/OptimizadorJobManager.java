package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.OptimizadorJobDTO;
import com.vidrieria.backend_vidrieria.dto.OptimizadorVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.dto.OptimizadorVidrioResponseDTO;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Gestor en memoria de jobs de optimización 2D.
 * <p>
 * Gestiona el ciclo de vida completo: envío, progreso, detención y limpieza de jobs.
 * Los jobs completados se eliminan automáticamente después de {@link #TTL_COMPLETADOS_MS}.
 */
@Component
public class OptimizadorJobManager {

    private static final Logger log = LoggerFactory.getLogger(OptimizadorJobManager.class);

    /** Tiempo de retención de jobs completados en memoria (30 minutos). */
    private static final long TTL_COMPLETADOS_MS = 30 * 60 * 1000L;

    /** Máximo de optimizaciones concurrentes. */
    private static final int MAX_CONCURRENTES = Math.max(2, Runtime.getRuntime().availableProcessors() - 1);

    private final ConcurrentHashMap<String, JobInfo> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(MAX_CONCURRENTES, r -> {
        Thread t = new Thread(r);
        t.setDaemon(true);
        t.setName("optimizer-worker-" + t.getId());
        return t;
    });

    private final OptimizadorVidrioService optimizadorService;

    public OptimizadorJobManager(OptimizadorVidrioService optimizadorService) {
        this.optimizadorService = optimizadorService;
    }

    // =========================================
    // API Pública
    // =========================================

    /**
     * Somete un nuevo job de optimización. Retorna el jobId inmediatamente.
     *
     * @param request Solicitud de optimización validada previamente.
     * @return jobId único para consultar estado o detener el job.
     */
    public String submitJob(OptimizadorVidrioRequestDTO request) {
        purgarJobsExpirados();

        String jobId = UUID.randomUUID().toString().substring(0, 8);
        JobInfo info = new JobInfo(jobId, request);
        jobs.put(jobId, info);

        CompletableFuture<OptimizadorVidrioResponseDTO> future = CompletableFuture.supplyAsync(() -> {
            info.estado = "EN_PROGRESO";
            info.inicioCalculo = System.currentTimeMillis();
            try {
                OptimizadorVidrioResponseDTO resultado = optimizadorService.optimizarCorteVidrio(
                        request,
                        info.detener,
                        (progreso, iteraciones, mejorPlanchas, mejorAprovechamiento) -> {
                            info.progreso = progreso;
                            info.iteraciones.set(iteraciones);
                            info.mejorPlanchasActual = mejorPlanchas;
                            info.mejorAprovechamientoActual = mejorAprovechamiento;
                        }
                );
                info.resultado.set(resultado);
                info.estado = info.detener.get() ? "DETENIDO" : "COMPLETADO";
                info.progreso = 1.0;
                return resultado;
            } catch (Exception e) {
                log.error("Error en job de optimización {}: {}", jobId, e.getMessage(), e);
                info.estado = "ERROR";
                info.mensajeError = e.getMessage();
                throw e;
            } finally {
                info.finCalculo = System.currentTimeMillis();
            }
        }, executor);

        info.future = future;
        return jobId;
    }

    /**
     * Consulta el estado de un job.
     *
     * @return DTO con estado, progreso y resultado (si completado), o null si el jobId no existe.
     */
    public OptimizadorJobDTO getJobStatus(String jobId) {
        JobInfo info = jobs.get(jobId);
        if (info == null) return null;

        long elapsed = info.inicioCalculo > 0
                ? (info.finCalculo > 0 ? info.finCalculo - info.inicioCalculo : System.currentTimeMillis() - info.inicioCalculo)
                : 0;

        return OptimizadorJobDTO.builder()
                .jobId(info.jobId)
                .estado(info.estado)
                .progreso(info.progreso)
                .tiempoTranscurridoMs(elapsed)
                .iteraciones(info.iteraciones.get())
                .mejorPlanchasActual(info.mejorPlanchasActual)
                .mejorAprovechamientoActual(info.mejorAprovechamientoActual)
                .mensaje(info.mensajeError)
                .resultado(info.resultado.get())
                .build();
    }

    /**
     * Solicita la detención de un job en progreso.
     * El motor retornará la bestSolution encontrada hasta el momento.
     *
     * @return true si el job existe y se le señaló la detención.
     */
    public boolean stopJob(String jobId) {
        JobInfo info = jobs.get(jobId);
        if (info == null) return false;
        info.detener.set(true);
        log.info("Detención solicitada para job {}", jobId);
        return true;
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }

    // =========================================
    // Internos
    // =========================================

    private void purgarJobsExpirados() {
        long ahora = System.currentTimeMillis();
        jobs.entrySet().removeIf(entry -> {
            JobInfo info = entry.getValue();
            boolean terminado = "COMPLETADO".equals(info.estado)
                    || "DETENIDO".equals(info.estado)
                    || "ERROR".equals(info.estado);
            return terminado && info.finCalculo > 0 && (ahora - info.finCalculo) > TTL_COMPLETADOS_MS;
        });
    }

    /**
     * Estado interno de un job de optimización.
     * Los campos volatiles permiten lectura segura desde el hilo del controller
     * mientras el hilo del executor los actualiza.
     */
    static class JobInfo {
        final String jobId;
        final OptimizadorVidrioRequestDTO request;
        final Instant createdAt = Instant.now();
        final AtomicBoolean detener = new AtomicBoolean(false);
        final AtomicInteger iteraciones = new AtomicInteger(0);
        final AtomicReference<OptimizadorVidrioResponseDTO> resultado = new AtomicReference<>();

        volatile String estado = "PENDIENTE";
        volatile double progreso = 0.0;
        volatile int mejorPlanchasActual = 0;
        volatile double mejorAprovechamientoActual = 0.0;
        volatile String mensajeError;
        volatile long inicioCalculo;
        volatile long finCalculo;
        volatile CompletableFuture<OptimizadorVidrioResponseDTO> future;

        JobInfo(String jobId, OptimizadorVidrioRequestDTO request) {
            this.jobId = jobId;
            this.request = request;
        }
    }
}
