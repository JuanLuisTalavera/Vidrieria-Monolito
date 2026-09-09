package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.CotizacionRequestDTO;
import com.vidrieria.backend_vidrieria.dto.CotizacionResponseDTO;
import com.vidrieria.backend_vidrieria.entity.Material;
import com.vidrieria.backend_vidrieria.entity.ServicioExtra;
import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.repository.ServicioExtraRepository;
import com.vidrieria.backend_vidrieria.repository.TipoVidrioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CotizadorService {

    private static final BigDecimal FACTOR_MERMA = new BigDecimal("1.10"); // 10% extra por cortes en ángulo

    private final TipoVidrioRepository tipoVidrioRepository;
    private final MaterialRepository materialRepository;
    private final ServicioExtraRepository servicioExtraRepository;

    /**
     * Calcula la cotización completa de un trabajo de marquería/vidriería.
     *
     * @param request DTO con dimensiones (ancho, alto) e IDs opcionales de vidrio, moldura y extras.
     * @return DTO con el desglose de costos y el total calculado.
     */
    public CotizacionResponseDTO calcularCotizacion(CotizacionRequestDTO request) {

        BigDecimal costoVidrio = BigDecimal.ZERO;
        BigDecimal costoMoldura = BigDecimal.ZERO;
        BigDecimal costoExtras = BigDecimal.ZERO;

        BigDecimal ancho = BigDecimal.valueOf(request.getAncho());
        BigDecimal alto = BigDecimal.valueOf(request.getAlto());

        // --- a) Costo del vidrio: área (m²) × costoDefectoM2 ---
        if (request.getIdVidrio() != null) {
            TipoVidrio vidrio = tipoVidrioRepository.findById(request.getIdVidrio())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No se encontró el tipo de vidrio con ID: " + request.getIdVidrio()));

            BigDecimal areaM2 = ancho.multiply(alto);
            costoVidrio = areaM2.multiply(vidrio.getCostoDefectoM2())
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // --- b) Costo de moldura: perímetro con merma × costoDefectoUnitario ---
        if (request.getIdMaterialMoldura() != null) {
            Material moldura = materialRepository.findById(request.getIdMaterialMoldura())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No se encontró el material de moldura con ID: " + request.getIdMaterialMoldura()));

            // Perímetro = (ancho + alto) × 2
            BigDecimal perimetro = ancho.add(alto).multiply(BigDecimal.valueOf(2));
            // Sumar 10% de merma por cortes en ángulo (×1.10)
            BigDecimal perimetroConMerma = perimetro.multiply(FACTOR_MERMA);

            costoMoldura = perimetroConMerma.multiply(moldura.getCostoDefectoUnitario())
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // --- c) Costo de servicios extras: suma de precioSugerido ---
        if (request.getIdsServiciosExtras() != null && !request.getIdsServiciosExtras().isEmpty()) {
            List<ServicioExtra> extras = servicioExtraRepository
                    .findAllById(request.getIdsServiciosExtras());

            costoExtras = extras.stream()
                    .map(ServicioExtra::getPrecioSugerido)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // --- d) Subtotal y total (redondeado hacia arriba al entero más cercano a favor de la tienda) ---
        BigDecimal subtotalCrudo = costoVidrio.add(costoMoldura).add(costoExtras);
        BigDecimal subtotal = BigDecimal.valueOf(Math.ceil(subtotalCrudo.doubleValue()))
                .setScale(2, RoundingMode.HALF_UP);

        // Total calculado redondeado hacia arriba
        BigDecimal totalCalculado = subtotal;

        return CotizacionResponseDTO.builder()
                .costoVidrio(costoVidrio)
                .costoMoldura(costoMoldura)
                .costoExtras(costoExtras)
                .subtotal(subtotal)
                .totalCalculado(totalCalculado)
                .build();
    }
}
