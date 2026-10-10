package com.vidrieria.backend_vidrieria.modules.inventario.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.inventario.dto.TipoVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.dto.TipoVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.TipoVidrioRepository;

@Service
@RequiredArgsConstructor
public class TipoVidrioService {

    private static final BigDecimal M2_A_PIE2 = new BigDecimal("10.7639");

    private final TipoVidrioRepository tipoVidrioRepository;

    @Transactional(readOnly = true)
    public List<TipoVidrioResponseDTO> listarActivos() {
        return tipoVidrioRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Crea un nuevo tipo de vidrio marcándolo como activo.
     */
    @Transactional
    public TipoVidrioResponseDTO crear(TipoVidrioRequestDTO request) {
        TipoVidrio vidrio = TipoVidrio.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .imagenUrl(request.getImagenUrl())
                .esTemplado(request.getEsTemplado())
                .diasProduccion(request.getDiasProduccion())
                .costoDefectoM2(request.getCostoDefectoM2())
                .idProveedorHabitual(request.getIdProveedorHabitual())
                .precioPlancha(request.getPrecioPlancha())
                .anchoPlancha(request.getAnchoPlancha())
                .altoPlancha(request.getAltoPlancha())
                .anchoPlanchaMm(request.getAnchoPlanchaMm() != null ? request.getAnchoPlanchaMm() : 2440.0)
                .altoPlanchaMm(request.getAltoPlanchaMm() != null ? request.getAltoPlanchaMm() : 3660.0)
                .margenMayorista(request.getMargenMayorista())
                .margenPublico(request.getMargenPublico())
                .margenCorteChico(request.getMargenCorteChico())
                .stock(request.getStock() != null ? request.getStock() : 0.0)
                .activo(true)
                .build();

        TipoVidrio guardado = tipoVidrioRepository.save(vidrio);
        return mapToDTO(guardado);
    }

    /**
     * Actualiza un tipo de vidrio existente con los datos del DTO recibido.
     */
    @Transactional
    public TipoVidrioResponseDTO actualizar(Integer id, TipoVidrioRequestDTO request) {
        TipoVidrio vidrio = tipoVidrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de vidrio no encontrado con ID: " + id));

        vidrio.setNombre(request.getNombre());
        vidrio.setDescripcion(request.getDescripcion());
        vidrio.setImagenUrl(request.getImagenUrl());
        if (request.getEsTemplado() != null) {
            vidrio.setEsTemplado(request.getEsTemplado());
        }
        if (request.getDiasProduccion() != null) {
            vidrio.setDiasProduccion(request.getDiasProduccion());
        }
        if (request.getIdProveedorHabitual() != null) {
            vidrio.setIdProveedorHabitual(request.getIdProveedorHabitual());
        }

        // Asignación explícita de medidas estándar de fábrica (mm)
        if (request.getAnchoPlanchaMm() != null) {
            vidrio.setAnchoPlanchaMm(request.getAnchoPlanchaMm());
        } else if (request.getAnchoPlancha() != null) {
            vidrio.setAnchoPlanchaMm(request.getAnchoPlancha().doubleValue() * 1000.0);
        }

        if (request.getAltoPlanchaMm() != null) {
            vidrio.setAltoPlanchaMm(request.getAltoPlanchaMm());
        } else if (request.getAltoPlancha() != null) {
            vidrio.setAltoPlanchaMm(request.getAltoPlancha().doubleValue() * 1000.0);
        }

        // Asignación explícita de precios, dimensiones base y márgenes comerciales
        vidrio.setCostoDefectoM2(request.getCostoDefectoM2());
        vidrio.setPrecioPlancha(request.getPrecioPlancha());
        vidrio.setAnchoPlancha(request.getAnchoPlancha());
        vidrio.setAltoPlancha(request.getAltoPlancha());
        vidrio.setMargenMayorista(request.getMargenMayorista());
        vidrio.setMargenPublico(request.getMargenPublico());
        vidrio.setMargenCorteChico(request.getMargenCorteChico());

        if (request.getStock() != null) {
            vidrio.setStock(request.getStock());
        }

        TipoVidrio guardado = tipoVidrioRepository.save(vidrio);
        return mapToDTO(guardado);
    }

    /**
     * Borrado lógico: marca el tipo de vidrio como inactivo.
     */
    @Transactional
    public void eliminar(Integer id) {
        TipoVidrio vidrio = tipoVidrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de vidrio no encontrado con ID: " + id));

        vidrio.setActivo(false);
        tipoVidrioRepository.save(vidrio);
    }

    // ----- Mapeo entidad → DTO con cálculo de precios -----

    private TipoVidrioResponseDTO mapToDTO(TipoVidrio v) {

        BigDecimal costoRealM2 = calcularCostoRealM2(v);

        BigDecimal margenMay = safe(v.getMargenMayorista());
        BigDecimal margenPub = safe(v.getMargenPublico());
        BigDecimal margenChico = safe(v.getMargenCorteChico());

        BigDecimal precioMayM2 = costoRealM2.multiply(BigDecimal.ONE.add(margenMay)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal precioPubM2 = costoRealM2.multiply(BigDecimal.ONE.add(margenPub)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal precioChicoM2 = costoRealM2.multiply(BigDecimal.ONE.add(margenChico)).setScale(2, RoundingMode.HALF_UP);

        Double anchoFinal = resolverDimensionMm(v.getAnchoPlanchaMm(), v.getAnchoPlancha(), 2440.0);
        Double altoFinal = resolverDimensionMm(v.getAltoPlanchaMm(), v.getAltoPlancha(), 3660.0);

        return TipoVidrioResponseDTO.builder()
                .idVidrio(v.getIdVidrio())
                .nombre(v.getNombre())
                .descripcion(v.getDescripcion())
                .imagenUrl(v.getImagenUrl())
                .esTemplado(v.getEsTemplado())
                .diasProduccion(v.getDiasProduccion())
                .idProveedorHabitual(v.getIdProveedorHabitual())
                .costoDefectoM2(v.getCostoDefectoM2())
                .precioPlancha(v.getPrecioPlancha())
                .anchoPlancha(anchoFinal)
                .altoPlancha(altoFinal)
                .anchoPlanchaMm(anchoFinal)
                .altoPlanchaMm(altoFinal)
                .margenMayorista(v.getMargenMayorista())
                .margenPublico(v.getMargenPublico())
                .margenCorteChico(v.getMargenCorteChico())
                .costoRealM2(costoRealM2)
                .precioMayoristaM2(precioMayM2)
                .precioMayoristaPie2(m2aPie2(precioMayM2))
                .precioPublicoM2(precioPubM2)
                .precioPublicoPie2(m2aPie2(precioPubM2))
                .precioCorteChicoM2(precioChicoM2)
                .precioCorteChicoPie2(m2aPie2(precioChicoM2))
                .stock(v.getStock() != null ? v.getStock() : 0.0)
                .build();
    }

    private Double resolverDimensionMm(Double valorMm, BigDecimal valorGenerico, double defaultMm) {
        if (valorMm != null && valorMm > 0) {
            return valorMm;
        }
        if (valorGenerico != null && valorGenerico.compareTo(BigDecimal.ZERO) > 0) {
            double val = valorGenerico.doubleValue();
            return val > 100.0 ? val : val * 1000.0;
        }
        return defaultMm;
    }

    /**
     * costoRealM2 = precioPlancha / (anchoPlancha * altoPlancha)
     * Si algún valor es nulo o el área es cero, retorna BigDecimal.ZERO.
     */
    private BigDecimal calcularCostoRealM2(TipoVidrio v) {
        BigDecimal precio = v.getPrecioPlancha();
        BigDecimal ancho = v.getAnchoPlancha();
        BigDecimal alto = v.getAltoPlancha();

        if (precio == null || ancho == null || alto == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal area = ancho.multiply(alto);
        if (area.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return precio.divide(area, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal m2aPie2(BigDecimal precioM2) {
        if (precioM2.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return precioM2.divide(M2_A_PIE2, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
