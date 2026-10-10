package com.vidrieria.backend_vidrieria.modules.optimizador.port;

import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.service.OptimizadorVidrioService.ReporteProgreso;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Puerto de Entrada (Inbound Port / Use Case) para optimización 2D de planchas de vidrio (Hexagonal).
 */
public interface OptimizarCorteVidrioUseCase {

    OptimizadorVidrioResponseDTO optimizarCorteVidrio(OptimizadorVidrioRequestDTO request);

    OptimizadorVidrioResponseDTO optimizarCorteVidrio(
            OptimizadorVidrioRequestDTO request,
            AtomicBoolean detener,
            ReporteProgreso reportarProgreso);
}
