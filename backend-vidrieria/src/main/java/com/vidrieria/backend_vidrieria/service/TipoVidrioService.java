package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.TipoVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.dto.TipoVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.repository.TipoVidrioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

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
                .margenMayorista(request.getMargenMayorista())
                .margenPublico(request.getMargenPublico())
                .margenCorteChico(request.getMargenCorteChico())
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
                .orElseThrow(() -> new RuntimeException("Tipo de vidrio no encontrado"));

        vidrio.setNombre(request.getNombre());
        vidrio.setDescripcion(request.getDescripcion());
        vidrio.setImagenUrl(request.getImagenUrl());
        vidrio.setEsTemplado(request.getEsTemplado());
        vidrio.setDiasProduccion(request.getDiasProduccion());
        vidrio.setCostoDefectoM2(request.getCostoDefectoM2());
        vidrio.setIdProveedorHabitual(request.getIdProveedorHabitual());
        vidrio.setPrecioPlancha(request.getPrecioPlancha());
        vidrio.setAnchoPlancha(request.getAnchoPlancha());
        vidrio.setAltoPlancha(request.getAltoPlancha());
        vidrio.setMargenMayorista(request.getMargenMayorista());
        vidrio.setMargenPublico(request.getMargenPublico());
        vidrio.setMargenCorteChico(request.getMargenCorteChico());

        TipoVidrio guardado = tipoVidrioRepository.save(vidrio);
        return mapToDTO(guardado);
    }

    /**
     * Borrado lógico: marca el tipo de vidrio como inactivo.
     */
    @Transactional
    public void eliminar(Integer id) {
        TipoVidrio vidrio = tipoVidrioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de vidrio no encontrado"));

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

        return TipoVidrioResponseDTO.builder()
                .idVidrio(v.getIdVidrio())
                .nombre(v.getNombre())
                .esTemplado(v.getEsTemplado())
                .costoRealM2(costoRealM2)
                .precioMayoristaM2(precioMayM2)
                .precioMayoristaPie2(m2aPie2(precioMayM2))
                .precioPublicoM2(precioPubM2)
                .precioPublicoPie2(m2aPie2(precioPubM2))
                .precioCorteChicoM2(precioChicoM2)
                .precioCorteChicoPie2(m2aPie2(precioChicoM2))
                .build();
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
