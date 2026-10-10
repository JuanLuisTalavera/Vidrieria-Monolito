package com.vidrieria.backend_vidrieria.modules.cotizador.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionResponseDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.ServicioExtra;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.ServicioExtraRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.TipoVidrioRepository;

import com.vidrieria.backend_vidrieria.modules.cotizador.port.CotizarMarqueriaUseCase;
import com.vidrieria.backend_vidrieria.modules.cotizador.port.CotizarVidrioSueltoUseCase;

@Service
@RequiredArgsConstructor
@Slf4j
public class CotizadorService implements CotizarMarqueriaUseCase, CotizarVidrioSueltoUseCase {

    private static final BigDecimal FACTOR_MERMA = new BigDecimal("1.10"); // 10% extra por cortes en ángulo

    private final TipoVidrioRepository tipoVidrioRepository;
    private final MaterialRepository materialRepository;
    private final ServicioExtraRepository servicioExtraRepository;

    /**
     * Calcula la cotización completa de un trabajo de marquería/vidriería tradicional.
     *
     * @param request DTO con dimensiones (ancho, alto en metros) e IDs opcionales de vidrio, moldura y extras.
     * @return DTO con el desglose de costos y el total calculado.
     */
    @Transactional(readOnly = true)
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
            costoVidrio = areaM2.multiply(resolverPrecioM2(vidrio))
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

        return CotizacionResponseDTO.builder()
                .costoVidrio(costoVidrio)
                .costoMoldura(costoMoldura)
                .costoExtras(costoExtras)
                .subtotal(subtotal)
                .totalCalculado(subtotal)
                .build();
    }

    /**
     * Calcula la cotización específica para "Vidrios Sueltos" / a medida.
     * Incluye cobros por procesamiento: área del cristal (m²), metros lineales de pulido/biselado
     * y cantidad de perforaciones/huecos/saques.
     *
     * @param request DTO con dimensiones en mm, tipo de vidrio y metros/cantidades de procesamiento.
     * @return CotizacionVidrioSueltoResponseDTO con el desglose exacto y total redondeado a favor de la tienda.
     */
    @Transactional(readOnly = true)
    public CotizacionVidrioSueltoResponseDTO calcularCotizacionVidrioSuelto(CotizacionVidrioSueltoRequestDTO request) {

        TipoVidrio vidrio = tipoVidrioRepository.findById(request.getIdVidrio())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el tipo de vidrio con ID: " + request.getIdVidrio()));

        int cantidad = (request.getCantidad() != null && request.getCantidad() > 0) ? request.getCantidad() : 1;
        double anchoMm = request.getAnchoMm() != null ? request.getAnchoMm() : 0.0;
        double altoMm = request.getAltoMm() != null ? request.getAltoMm() : 0.0;

        // 1. Cálculo de área: Área M2 = (anchoMm * altoMm / 1,000,000) * cantidad
        BigDecimal areaM2Individual = BigDecimal.valueOf(anchoMm)
                .multiply(BigDecimal.valueOf(altoMm))
                .divide(BigDecimal.valueOf(1_000_000L), 6, RoundingMode.HALF_UP);

        BigDecimal areaM2Total = areaM2Individual
                .multiply(BigDecimal.valueOf(cantidad))
                .setScale(4, RoundingMode.HALF_UP);

        // 2. Costo del vidrio
        BigDecimal costoM2Vidrio = request.getPrecioM2VidrioPersonalizado() != null
                ? request.getPrecioM2VidrioPersonalizado()
                : resolverPrecioM2(vidrio);

        BigDecimal subtotalVidrio = areaM2Total.multiply(costoM2Vidrio).setScale(2, RoundingMode.HALF_UP);

        // 3. Procesamiento de Pulido (cobro lineal)
        double metrosPulido = (request.getMetrosPulido() != null && request.getMetrosPulido() > 0)
                ? request.getMetrosPulido()
                : 0.0;
        BigDecimal costoMetroPulido = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotalPulido = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        String nombreServicioPulido = "Sin pulido";

        if (metrosPulido > 0) {
            if (request.getPrecioMetroPulidoPersonalizado() != null) {
                costoMetroPulido = request.getPrecioMetroPulidoPersonalizado();
                nombreServicioPulido = "Pulido (Personalizado)";
            } else {
                ServicioExtra servicioPulido = resolverServicio(
                        request.getIdServicioPulido(), "PULIDO", "Canto Pulido Plano", new BigDecimal("5.00"));
                costoMetroPulido = servicioPulido.getPrecioBase();
                nombreServicioPulido = servicioPulido.getNombre();
            }
            subtotalPulido = BigDecimal.valueOf(metrosPulido).multiply(costoMetroPulido).setScale(2, RoundingMode.HALF_UP);
        }

        // 4. Procesamiento de Biselado (cobro lineal)
        double metrosBiselado = (request.getMetrosBiselado() != null && request.getMetrosBiselado() > 0)
                ? request.getMetrosBiselado()
                : 0.0;
        BigDecimal costoMetroBiselado = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotalBiselado = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        String nombreServicioBiselado = "Sin biselado";

        if (metrosBiselado > 0) {
            if (request.getPrecioMetroBiseladoPersonalizado() != null) {
                costoMetroBiselado = request.getPrecioMetroBiseladoPersonalizado();
                nombreServicioBiselado = "Biselado (Personalizado)";
            } else {
                ServicioExtra servicioBiselado = resolverServicio(
                        request.getIdServicioBiselado(), "BISELADO", "Biselado 1 pulgada (25mm)", new BigDecimal("12.00"));
                costoMetroBiselado = servicioBiselado.getPrecioBase();
                nombreServicioBiselado = servicioBiselado.getNombre();
            }
            subtotalBiselado = BigDecimal.valueOf(metrosBiselado).multiply(costoMetroBiselado).setScale(2, RoundingMode.HALF_UP);
        }

        // 5. Procesamiento de Huecos / Perforaciones (cobro por unidad)
        int cantidadHuecos = (request.getCantidadHuecos() != null && request.getCantidadHuecos() > 0)
                ? request.getCantidadHuecos()
                : 0;
        BigDecimal costoUnitarioHueco = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotalHuecos = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        String nombreServicioHueco = "Sin perforaciones";

        if (cantidadHuecos > 0) {
            if (request.getPrecioUnitarioHuecoPersonalizado() != null) {
                costoUnitarioHueco = request.getPrecioUnitarioHuecoPersonalizado();
                nombreServicioHueco = "Perforación (Personalizada)";
            } else {
                ServicioExtra servicioHueco = resolverServicio(
                        request.getIdServicioHueco(), "HUECO", "Perforación / Hueco para Tirador", new BigDecimal("8.00"));
                costoUnitarioHueco = servicioHueco.getPrecioBase();
                nombreServicioHueco = servicioHueco.getNombre();
            }
            subtotalHuecos = BigDecimal.valueOf(cantidadHuecos).multiply(costoUnitarioHueco).setScale(2, RoundingMode.HALF_UP);
        }

        // 6. Subtotal neto y Total final redondeado hacia arriba
        BigDecimal subtotalNeto = subtotalVidrio
                .add(subtotalPulido)
                .add(subtotalBiselado)
                .add(subtotalHuecos)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalRedondeado = BigDecimal.valueOf(Math.ceil(subtotalNeto.doubleValue()))
                .setScale(2, RoundingMode.HALF_UP);

        log.info("Cotización vidrio suelto calculada: Vidrio={}, Cantidad={}, AreaM2={}, SubtotalVidrio={}, Pulido={}, Biselado={}, Huecos={}, Total={}",
                vidrio.getNombre(), cantidad, areaM2Total, subtotalVidrio, subtotalPulido, subtotalBiselado, subtotalHuecos, totalRedondeado);

        return CotizacionVidrioSueltoResponseDTO.builder()
                .idVidrio(vidrio.getIdVidrio())
                .nombreVidrio(vidrio.getNombre())
                .esTemplado(vidrio.getEsTemplado())
                .anchoMm(anchoMm)
                .altoMm(altoMm)
                .cantidad(cantidad)
                .areaM2Individual(areaM2Individual.setScale(4, RoundingMode.HALF_UP))
                .areaM2Total(areaM2Total)
                .costoM2Vidrio(costoM2Vidrio)
                .subtotalVidrio(subtotalVidrio)
                .metrosPulido(metrosPulido)
                .costoMetroPulido(costoMetroPulido)
                .subtotalPulido(subtotalPulido)
                .nombreServicioPulido(nombreServicioPulido)
                .metrosBiselado(metrosBiselado)
                .costoMetroBiselado(costoMetroBiselado)
                .subtotalBiselado(subtotalBiselado)
                .nombreServicioBiselado(nombreServicioBiselado)
                .cantidadHuecos(cantidadHuecos)
                .costoUnitarioHueco(costoUnitarioHueco)
                .subtotalHuecos(subtotalHuecos)
                .nombreServicioHueco(nombreServicioHueco)
                .subtotalNeto(subtotalNeto)
                .totalRedondeado(totalRedondeado)
                .totalCalculado(totalRedondeado)
                .build();
    }

    /**
     * Resuelve el precio por m² para un tipo de vidrio.
     * Prioriza costoDefectoM2, o calcula costo base a partir de las dimensiones de la plancha.
     */
    private BigDecimal resolverPrecioM2(TipoVidrio vidrio) {
        if (vidrio.getCostoDefectoM2() != null && vidrio.getCostoDefectoM2().compareTo(BigDecimal.ZERO) > 0) {
            return vidrio.getCostoDefectoM2();
        }
        if (vidrio.getPrecioPlancha() != null && vidrio.getAnchoPlancha() != null && vidrio.getAltoPlancha() != null) {
            BigDecimal areaPlancha = vidrio.getAnchoPlancha().multiply(vidrio.getAltoPlancha());
            if (areaPlancha.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal costoReal = vidrio.getPrecioPlancha().divide(areaPlancha, 2, RoundingMode.HALF_UP);
                if (vidrio.getMargenPublico() != null) {
                    return costoReal.multiply(BigDecimal.ONE.add(vidrio.getMargenPublico())).setScale(2, RoundingMode.HALF_UP);
                }
                return costoReal;
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Resuelve el servicio extra correspondiente.
     * Si se provee un ID explícito, lo busca por ID.
     * De lo contrario, busca el primer servicio activo cuyo nombre contenga la palabra clave.
     * Si no se encuentra ninguno en la BD, genera una instancia con valores por defecto seguros.
     */
    private ServicioExtra resolverServicio(Integer idEspecifico, String keyword, String fallbackNombre, BigDecimal fallbackPrecio) {
        if (idEspecifico != null) {
            return servicioExtraRepository.findById(idEspecifico)
                    .orElseThrow(() -> new IllegalArgumentException("No se encontró el servicio extra con ID: " + idEspecifico));
        }

        return servicioExtraRepository.findFirstByActivoTrueAndNombreContainingIgnoreCase(keyword)
                .orElseGet(() -> {
                    log.warn("No se encontró en BD un servicio activo para '{}'. Se utilizará valor de referencia: {}", keyword, fallbackPrecio);
                    return ServicioExtra.builder()
                            .nombre(fallbackNombre)
                            .precioBase(fallbackPrecio)
                            .precioSugerido(fallbackPrecio)
                            .activo(true)
                            .build();
                });
    }
}
