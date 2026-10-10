package com.vidrieria.backend_vidrieria.modules.cotizador.port;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoResponseDTO;

/**
 * Puerto de Entrada (Inbound Port / Use Case) para cotización de vidrios sueltos a medida (Hexagonal).
 */
public interface CotizarVidrioSueltoUseCase {

    CotizacionVidrioSueltoResponseDTO calcularCotizacionVidrioSuelto(CotizacionVidrioSueltoRequestDTO request);
}
