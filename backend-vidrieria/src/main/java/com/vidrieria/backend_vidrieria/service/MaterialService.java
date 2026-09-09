package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.MaterialRequestDTO;
import com.vidrieria.backend_vidrieria.dto.MaterialResponseDTO;
import com.vidrieria.backend_vidrieria.entity.Material;
import com.vidrieria.backend_vidrieria.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public List<MaterialResponseDTO> listarActivos() {
        return materialRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Crea un nuevo material (moldura) marcándolo como activo.
     */
    @Transactional
    public MaterialResponseDTO crear(MaterialRequestDTO request) {
        Material material = Material.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .tipoMaterial(request.getTipoMaterial())
                .imagenUrl(request.getImagenUrl())
                .costoDefectoUnitario(request.getCostoDefectoUnitario())
                .idProveedorHabitual(request.getIdProveedorHabitual())
                .precioVarilla(request.getPrecioVarilla())
                .longitudVarilla(request.getLongitudVarilla())
                .margenMayorista(request.getMargenMayorista())
                .margenPublico(request.getMargenPublico())
                .margenCorteChico(request.getMargenCorteChico())
                .activo(true)
                .build();

        Material guardado = materialRepository.save(material);
        return mapToDTO(guardado);
    }

    /**
     * Actualiza un material existente con los datos del DTO recibido.
     */
    @Transactional
    public MaterialResponseDTO actualizar(Integer id, MaterialRequestDTO request) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        material.setNombre(request.getNombre());
        material.setDescripcion(request.getDescripcion());
        material.setTipoMaterial(request.getTipoMaterial());
        material.setImagenUrl(request.getImagenUrl());
        material.setCostoDefectoUnitario(request.getCostoDefectoUnitario());
        material.setIdProveedorHabitual(request.getIdProveedorHabitual());
        material.setPrecioVarilla(request.getPrecioVarilla());
        material.setLongitudVarilla(request.getLongitudVarilla());
        material.setMargenMayorista(request.getMargenMayorista());
        material.setMargenPublico(request.getMargenPublico());
        material.setMargenCorteChico(request.getMargenCorteChico());

        Material guardado = materialRepository.save(material);
        return mapToDTO(guardado);
    }

    /**
     * Borrado lógico: marca el material como inactivo.
     */
    @Transactional
    public void eliminar(Integer id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        material.setActivo(false);
        materialRepository.save(material);
    }

    // ----- Mapeo entidad → DTO con cálculo de precios -----

    private MaterialResponseDTO mapToDTO(Material m) {

        BigDecimal costoRealMetro = calcularCostoRealMetro(m);
        BigDecimal precioVarilla = safe(m.getPrecioVarilla());

        BigDecimal margenMay = safe(m.getMargenMayorista());
        BigDecimal margenPub = safe(m.getMargenPublico());
        BigDecimal margenChico = safe(m.getMargenCorteChico());

        return MaterialResponseDTO.builder()
                .idMaterial(m.getIdMaterial())
                .nombre(m.getNombre())
                .tipoMaterial(m.getTipoMaterial())
                .longitudVarilla(m.getLongitudVarilla())
                // Precios por metro lineal
                .costoRealMetro(costoRealMetro)
                .precioMayoristaMetro(aplicarMargen(costoRealMetro, margenMay))
                .precioPublicoMetro(aplicarMargen(costoRealMetro, margenPub))
                .precioCorteChicoMetro(aplicarMargen(costoRealMetro, margenChico))
                // Precios por varilla entera
                .precioMayoristaVarilla(aplicarMargen(precioVarilla, margenMay))
                .precioPublicoVarilla(aplicarMargen(precioVarilla, margenPub))
                .precioCorteChicoVarilla(aplicarMargen(precioVarilla, margenChico))
                .build();
    }

    /**
     * costoRealMetro = precioVarilla / longitudVarilla
     * Si algún valor es nulo o la longitud es cero, retorna BigDecimal.ZERO.
     */
    private BigDecimal calcularCostoRealMetro(Material m) {
        BigDecimal precio = m.getPrecioVarilla();
        BigDecimal longitud = m.getLongitudVarilla();

        if (precio == null || longitud == null || longitud.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return precio.divide(longitud, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal aplicarMargen(BigDecimal base, BigDecimal margen) {
        return base.multiply(BigDecimal.ONE.add(margen)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
