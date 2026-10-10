package com.vidrieria.backend_vidrieria.modules.cotizador.port;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionResponseDTO;

/**
 * Puerto de Entrada (Inbound Port / Use Case) para cotización de marquería y cuadros (Hexagonal).
 */
public interface CotizarMarqueriaUseCase {

    CotizacionResponseDTO calcularCotizacion(CotizacionRequestDTO request);
}
