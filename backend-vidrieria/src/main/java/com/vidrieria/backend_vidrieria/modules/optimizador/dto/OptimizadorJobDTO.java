package com.vidrieria.backend_vidrieria.modules.optimizador.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de estado de un job de optimización asíncrona.
 * Devuelto por el endpoint GET /status/{jobId}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OptimizadorJobDTO {

    /** Identificador único del job de optimización. */
    private String jobId;

    /** Estado del job: PENDIENTE, EN_PROGRESO, COMPLETADO, DETENIDO, ERROR. */
    private String estado;

    /** Progreso de 0.0 a 1.0. */
    private Double progreso;

    /** Milisegundos transcurridos desde el inicio del cálculo. */
    private Long tiempoTranscurridoMs;

    /** Número de iteraciones del motor metaheurístico. */
    private Integer iteraciones;

    /** Número de planchas de la mejor solución encontrada hasta el momento. */
    private Integer mejorPlanchasActual;

    /** Porcentaje de aprovechamiento de la mejor solución actual. */
    private Double mejorAprovechamientoActual;

    /** Mensaje descriptivo (errores, warnings, etc.). */
    private String mensaje;

    /** Resultado final de la optimización (solo presente cuando estado = COMPLETADO o DETENIDO). */
    private OptimizadorVidrioResponseDTO resultado;
}
