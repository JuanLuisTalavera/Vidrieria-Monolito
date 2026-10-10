package com.vidrieria.backend_vidrieria.modules.cotizador.port;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionObraResponseDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.GuardarCotizacionObraRequestDTO;
import java.util.List;

/**
 * Puerto de Entrada (Inbound Port / Use Case) para cotización de obras y proyectos (Hexagonal).
 */
public interface CotizarObraUseCase {

    CotizacionObraResponseDTO guardarCotizacion(GuardarCotizacionObraRequestDTO request);

    List<CotizacionObraResponseDTO> listarTodas();

    CotizacionObraResponseDTO obtenerPorId(Long id);
}
