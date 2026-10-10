package com.vidrieria.backend_vidrieria.modules.optimizador.port;

import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorResponseDTO;

/**
 * Puerto de Entrada (Inbound Port / Use Case) para optimización 1D de varillas lineales (Hexagonal).
 */
public interface OptimizarCorteVarillaUseCase {

    OptimizadorResponseDTO optimizarCorte(OptimizadorRequestDTO request);
}
