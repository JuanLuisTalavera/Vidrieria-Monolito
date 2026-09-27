package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.MaterialRequestDTO;
import com.vidrieria.backend_vidrieria.dto.MaterialResponseDTO;
import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.entity.Material;
import com.vidrieria.backend_vidrieria.repository.MaterialRepository;
import jakarta.persistence.EntityNotFoundException;
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
        return listarActivos(null);
    }

    @Transactional(readOnly = true)
    public List<MaterialResponseDTO> listarActivos(CategoriaMaterial categoria) {
        List<Material> lista = (categoria != null)
                ? materialRepository.findByActivoTrueAndTipoMaterial(categoria)
                : materialRepository.findByActivoTrue();

        return lista.stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MaterialResponseDTO> listar(CategoriaMaterial categoria) {
        return listarActivos(categoria);
    }

    /**
     * Crea un nuevo material marcándolo como activo.
     */
    @Transactional
    public MaterialResponseDTO crear(MaterialRequestDTO request) {
        CategoriaMaterial categoria = (request.getTipoMaterial() != null)
                ? request.getTipoMaterial()
                : CategoriaMaterial.MOLDURA;

        Material material = Material.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .tipoMaterial(categoria)
                .imagenUrl(request.getImagenUrl())
                .costoDefectoUnitario(request.getCostoDefectoUnitario())
                .idProveedorHabitual(request.getIdProveedorHabitual())
                .precioVarilla(request.getPrecioVarilla())
                .longitudVarilla(request.getLongitudVarilla())
                .margenMayorista(request.getMargenMayorista())
                .margenPublico(request.getMargenPublico())
                .margenCorteChico(request.getMargenCorteChico())
                .stock(request.getStock() != null ? request.getStock() : 0.0)
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
                .orElseThrow(() -> new EntityNotFoundException("Material no encontrado con ID: " + id));

        material.setNombre(request.getNombre());
        material.setDescripcion(request.getDescripcion());
        if (request.getTipoMaterial() != null) {
            material.setTipoMaterial(request.getTipoMaterial());
        }
        if (request.getImagenUrl() != null) {
            material.setImagenUrl(request.getImagenUrl());
        }
        if (request.getIdProveedorHabitual() != null) {
            material.setIdProveedorHabitual(request.getIdProveedorHabitual());
        }

        // Asignación explícita de campos numéricos de costos, dimensiones y márgenes
        material.setCostoDefectoUnitario(request.getCostoDefectoUnitario());
        material.setPrecioVarilla(request.getPrecioVarilla());
        material.setLongitudVarilla(request.getLongitudVarilla());
        material.setMargenMayorista(request.getMargenMayorista());
        material.setMargenPublico(request.getMargenPublico());
        material.setMargenCorteChico(request.getMargenCorteChico());
        if (request.getStock() != null) {
            material.setStock(request.getStock());
        }

        Material guardado = materialRepository.save(material);
        return mapToDTO(guardado);
    }

    /**
     * Borrado lógico: marca el material como inactivo.
     */
    @Transactional
    public void eliminar(Integer id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Material no encontrado con ID: " + id));

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
                .descripcion(m.getDescripcion())
                .tipoMaterial(m.getTipoMaterial())
                .imagenUrl(m.getImagenUrl())
                .costoDefectoUnitario(m.getCostoDefectoUnitario())
                .idProveedorHabitual(m.getIdProveedorHabitual())
                .precioVarilla(precioVarilla)
                .longitudVarilla(m.getLongitudVarilla())
                .margenMayorista(margenMay)
                .margenPublico(margenPub)
                .margenCorteChico(margenChico)
                // Precios por metro lineal
                .costoRealMetro(costoRealMetro)
                .precioMayoristaMetro(aplicarMargen(costoRealMetro, margenMay))
                .precioPublicoMetro(aplicarMargen(costoRealMetro, margenPub))
                .precioCorteChicoMetro(aplicarMargen(costoRealMetro, margenChico))
                // Precios por varilla entera
                .precioMayoristaVarilla(aplicarMargen(precioVarilla, margenMay))
                .precioPublicoVarilla(aplicarMargen(precioVarilla, margenPub))
                .precioCorteChicoVarilla(aplicarMargen(precioVarilla, margenChico))
                .stock(m.getStock() != null ? m.getStock() : 0.0)
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
