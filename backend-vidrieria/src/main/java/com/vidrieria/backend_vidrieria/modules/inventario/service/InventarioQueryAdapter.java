package com.vidrieria.backend_vidrieria.modules.inventario.service;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.modules.inventario.port.InventarioQueryPort;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.TipoVidrioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Adaptador de servicio que implementa el puerto público InventarioQueryPort.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventarioQueryAdapter implements InventarioQueryPort {

    private final TipoVidrioRepository tipoVidrioRepository;
    private final MaterialRepository materialRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<BigDecimal> obtenerCostoVidrioM2(Integer idVidrio) {
        if (idVidrio == null) return Optional.empty();
        return tipoVidrioRepository.findById(idVidrio)
                .map(TipoVidrio::getCostoDefectoM2);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BigDecimal> obtenerCostoMaterialUnitario(Integer idMaterial) {
        if (idMaterial == null) return Optional.empty();
        return materialRepository.findById(idMaterial)
                .map(Material::getCostoDefectoUnitario);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existeStockVidrio(Integer idVidrio, Double cantidadRequerida) {
        if (idVidrio == null || cantidadRequerida == null) return false;
        return tipoVidrioRepository.findById(idVidrio)
                .map(v -> (v.getStock() != null ? v.getStock() : 0.0) >= cantidadRequerida)
                .orElse(false);
    }

    @Override
    @Transactional
    public void descontarStockVidrio(Integer idVidrio, Double cantidad) {
        if (idVidrio == null || cantidad == null || cantidad <= 0) return;
        tipoVidrioRepository.findById(idVidrio).ifPresent(v -> {
            double actual = v.getStock() != null ? v.getStock() : 0.0;
            v.setStock(Math.max(0.0, actual - cantidad));
            tipoVidrioRepository.save(v);
            log.info("Stock descontado para vidrio {}: nuevo stock={}", idVidrio, v.getStock());
        });
    }

    @Override
    @Transactional
    public void descontarStockMaterial(Integer idMaterial, Double cantidad) {
        if (idMaterial == null || cantidad == null || cantidad <= 0) return;
        materialRepository.findById(idMaterial).ifPresent(m -> {
            double actual = m.getStock() != null ? m.getStock() : 0.0;
            m.setStock(Math.max(0.0, actual - cantidad));
            materialRepository.save(m);
            log.info("Stock descontado para material {}: nuevo stock={}", idMaterial, m.getStock());
        });
    }
}
