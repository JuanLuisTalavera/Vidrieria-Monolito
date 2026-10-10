package com.vidrieria.backend_vidrieria.modules.ingenieria.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.DesgloseCostosDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.AccesorioItemDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.DespieceObraRequestDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.DespieceObraResponseDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaAluminioDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaCristalDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.FormulaDespiece;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.SistemaCarpinteria;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.TipoEstructura;
import com.vidrieria.backend_vidrieria.modules.ingenieria.repository.FormulaDespieceRepository;
import com.vidrieria.backend_vidrieria.modules.ingenieria.repository.SistemaCarpinteriaRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.TipoVidrioRepository;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.CorteItemDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorResponseDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.service.CorteVarillaService;

@Service
@RequiredArgsConstructor
@Slf4j
public class DespieceObraService {

    private final CorteVarillaService corteVarillaService;
    private final TipoVidrioRepository tipoVidrioRepository;
    private final MaterialRepository materialRepository;
    private final SistemaCarpinteriaRepository sistemaCarpinteriaRepository;
    private final FormulaDespieceRepository formulaDespieceRepository;

    private final ExpressionParser parser = new SpelExpressionParser();

    /**
     * Calcula dinámicamente el despiece completo de perfiles de aluminio, paños de cristal, herrajes
     * y optimización de corte consultando la base de datos (SistemaCarpinteria y FormulaDespiece)
     * y validando la existencia de materiales y vidrios en el inventario.
     */
    @Transactional(readOnly = true)
    public DespieceObraResponseDTO calcularDespiece(DespieceObraRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de despiece no puede ser nula");
        }
        if (request.getAnchoVanoMm() == null || request.getAnchoVanoMm() <= 0) {
            throw new IllegalArgumentException("El ancho del vano en mm es obligatorio y debe ser mayor a 0");
        }
        if (request.getAltoVanoMm() == null || request.getAltoVanoMm() <= 0) {
            throw new IllegalArgumentException("El alto del vano en mm es obligatorio y debe ser mayor a 0");
        }

        double anchoVano = request.getAnchoVanoMm();
        double altoVano = request.getAltoVanoMm();

        // 1. Obtener SistemaCarpinteria de la base de datos
        SistemaCarpinteria sistema = obtenerSistema(request);

        // 2. Obtener fórmulas de despiece registradas para el sistema
        List<FormulaDespiece> formulas = formulaDespieceRepository.findByIdSistema(sistema.getIdSistema());
        if (formulas.isEmpty()) {
            throw new EntityNotFoundException("No se encontraron fórmulas de despiece para el sistema: " + sistema.getNombre());
        }

        // 3. Preparar contexto SpEL con las dimensiones del vano
        StandardEvaluationContext context = new StandardEvaluationContext();
        context.setVariable("ANCHO", anchoVano);
        context.setVariable("ALTO", altoVano);

        List<PiezaAluminioDTO> piezasAluminio = new ArrayList<>();
        List<PiezaCristalDTO> piezasCristal = new ArrayList<>();
        List<AccesorioItemDTO> accesorios = new ArrayList<>();
        List<Material> materialesAluminioUsados = new ArrayList<>();
        TipoVidrio tipoVidrioUsado = null;

        // 4. Procesar y categorizar cada fórmula según tipoElemento
        for (FormulaDespiece formula : formulas) {
            String tipoElem = formula.getTipoElemento() != null ? formula.getTipoElemento().toUpperCase().trim() : "";

            if (tipoElem.contains("VIDRIO") || tipoElem.contains("CRISTAL")) {
                TipoVidrio tv = resolverYValidarVidrio(formula, request.getIdVidrio());
                tipoVidrioUsado = tv;

                double anchoCristal = redondear2(evaluarExpresion(formula.getFormulaLargo(), context));
                double altoCristal = redondear2(evaluarExpresion(formula.getFormulaAlto(), context));
                int cantidad = (formula.getCantidadPiezas() != null && formula.getCantidadPiezas() > 0)
                        ? formula.getCantidadPiezas()
                        : 1;

                double areaUnitaria = redondear4((anchoCristal / 1000.0) * (altoCristal / 1000.0));
                double areaTotal = redondear4(areaUnitaria * cantidad);

                piezasCristal.add(PiezaCristalDTO.builder()
                        .descripcion(formula.getDescripcion() != null ? formula.getDescripcion() : tv.getNombre())
                        .anchoMm(anchoCristal)
                        .altoMm(altoCristal)
                        .cantidad(cantidad)
                        .areaM2Unitaria(areaUnitaria)
                        .areaM2Total(areaTotal)
                        .build());

            } else if (tipoElem.contains("ACCESORIO") || tipoElem.contains("HERRAJE")) {
                Material mat = resolverYValidarMaterial(formula);

                double cantidad;
                String unidad = "UND";
                if (formula.getFormulaLargo() != null && !formula.getFormulaLargo().trim().isEmpty()) {
                    cantidad = redondear2(evaluarExpresion(formula.getFormulaLargo(), context));
                    if (formula.getFormulaLargo().toUpperCase().contains("ALTO") || formula.getFormulaLargo().toUpperCase().contains("ANCHO")) {
                        unidad = "MTR";
                    }
                } else {
                    cantidad = (formula.getCantidadPiezas() != null && formula.getCantidadPiezas() > 0)
                            ? formula.getCantidadPiezas().doubleValue()
                            : 1.0;
                }

                double costoUnitario = (mat.getCostoDefectoUnitario() != null)
                        ? mat.getCostoDefectoUnitario().doubleValue()
                        : 0.0;
                double costoEstimado = redondear2(cantidad * costoUnitario);

                accesorios.add(new AccesorioItemDTO(
                        mat.getNombre() != null ? mat.getNombre() : formula.getDescripcion(),
                        cantidad,
                        unidad,
                        costoEstimado
                ));

            } else {
                // Perfil de Aluminio
                Material mat = resolverYValidarMaterial(formula);
                materialesAluminioUsados.add(mat);

                double longitudMm = redondear2(evaluarExpresion(formula.getFormulaLargo(), context));
                int cantidad = (formula.getCantidadPiezas() != null && formula.getCantidadPiezas() > 0)
                        ? formula.getCantidadPiezas()
                        : 1;

                piezasAluminio.add(crearPiezaAluminio(
                        mat.getNombre() != null ? mat.getNombre() : formula.getDescripcion(),
                        formula.getFormulaLargo(),
                        longitudMm,
                        cantidad
                ));
            }
        }

        // 5. Determinar longitud de varilla estándar a partir de los materiales de aluminio (default 6000 mm)
        double longitudVarillaMm = 6000.0;
        for (Material m : materialesAluminioUsados) {
            if (m.getLongitudVarilla() != null && m.getLongitudVarilla().doubleValue() > 0) {
                // Si está en metros (ej. 6.0), convertir a mm; si ya está en mm (ej. 6000), usar directamente
                double val = m.getLongitudVarilla().doubleValue();
                longitudVarillaMm = (val < 100.0) ? val * 1000.0 : val;
                break;
            }
        }

        // 6. Optimizar cortes de aluminio con el motor 1D
        List<CorteItemDTO> cortesOptimizador = new ArrayList<>();
        for (PiezaAluminioDTO pieza : piezasAluminio) {
            cortesOptimizador.add(CorteItemDTO.builder()
                    .etiqueta(pieza.getNombrePerfil())
                    .longitudMm(pieza.getLongitudMm())
                    .cantidad(pieza.getCantidad())
                    .build());
        }

        OptimizadorRequestDTO requestOptimizador = OptimizadorRequestDTO.builder()
                .longitudVarillaEstandarMm(longitudVarillaMm)
                .anchoSierraMm(request.getAnchoSierraMm() != null ? request.getAnchoSierraMm() : 3.0)
                .cortes(cortesOptimizador)
                .build();

        OptimizadorResponseDTO optimizacionVarillas = corteVarillaService.optimizarCorte(requestOptimizador);

        // 7. Calcular costos basados en precios reales de base de datos
        DesgloseCostosDTO desgloseCostos = calcularCostosReales(
                request,
                materialesAluminioUsados,
                tipoVidrioUsado,
                piezasCristal,
                accesorios,
                optimizacionVarillas
        );

        TipoEstructura estructuraResultado = request.getTipoEstructura();
        if (estructuraResultado == null && sistema.getTipoEstructura() != null) {
            try {
                estructuraResultado = TipoEstructura.valueOf(sistema.getTipoEstructura());
            } catch (Exception ignored) {}
        }

        return DespieceObraResponseDTO.builder()
                .tipoEstructura(estructuraResultado)
                .anchoVanoMm(anchoVano)
                .altoVanoMm(altoVano)
                .colorAluminio(request.getColorAluminio() != null ? request.getColorAluminio() : "Natural / Mate")
                .piezasAluminio(piezasAluminio)
                .piezasCristal(piezasCristal)
                .accesorios(accesorios)
                .optimizacionVarillas(optimizacionVarillas)
                .desgloseCostos(desgloseCostos)
                .build();
    }

    /**
     * Resuelve el sistema de carpintería a partir del request.
     */
    private SistemaCarpinteria obtenerSistema(DespieceObraRequestDTO request) {
        if (request.getIdSistema() != null) {
            return sistemaCarpinteriaRepository.findById(request.getIdSistema())
                    .orElseThrow(() -> new EntityNotFoundException("Sistema de carpintería no encontrado con ID: " + request.getIdSistema()));
        }

        if (request.getTipoEstructura() != null) {
            String tipoStr = request.getTipoEstructura().name();
            return sistemaCarpinteriaRepository.findByTipoEstructura(tipoStr)
                    .orElseGet(() -> sistemaCarpinteriaRepository.findByCodigo(tipoStr)
                            .orElseThrow(() -> new EntityNotFoundException("Sistema de carpintería no encontrado para estructura: " + request.getTipoEstructura())));
        }

        throw new IllegalArgumentException("Debe especificar idSistema o tipoEstructura para calcular el despiece");
    }

    /**
     * Valida estrictamente la existencia del material en MaterialRepository.
     */
    private Material resolverYValidarMaterial(FormulaDespiece formula) {
        if (formula.getIdMaterialDefecto() != null) {
            return materialRepository.findById(formula.getIdMaterialDefecto())
                    .orElseThrow(() -> new EntityNotFoundException("Material '" +
                            (formula.getDescripcion() != null ? formula.getDescripcion() : formula.getIdMaterialDefecto()) +
                            "' no encontrado"));
        }

        if (formula.getDescripcion() != null && !formula.getDescripcion().trim().isEmpty()) {
            String desc = formula.getDescripcion().trim();
            return materialRepository.findByNombreIgnoreCase(desc)
                    .orElseGet(() -> materialRepository.findByNombre(desc)
                            .orElseThrow(() -> new EntityNotFoundException("Material '" + desc + "' no encontrado")));
        }

        throw new EntityNotFoundException("Material no especificado en la fórmula ID: " + formula.getIdFormula());
    }

    /**
     * Valida estrictamente la existencia del vidrio en TipoVidrioRepository.
     */
    private TipoVidrio resolverYValidarVidrio(FormulaDespiece formula, Integer idVidrioRequest) {
        if (idVidrioRequest != null) {
            return tipoVidrioRepository.findById(idVidrioRequest)
                    .orElseThrow(() -> new EntityNotFoundException("Vidrio con ID " + idVidrioRequest + " no encontrado"));
        }

        if (formula.getIdMaterialDefecto() != null) {
            return tipoVidrioRepository.findById(formula.getIdMaterialDefecto())
                    .orElseThrow(() -> new EntityNotFoundException("Vidrio '" +
                            (formula.getDescripcion() != null ? formula.getDescripcion() : formula.getIdMaterialDefecto()) +
                            "' no encontrado"));
        }

        if (formula.getDescripcion() != null && !formula.getDescripcion().trim().isEmpty()) {
            String desc = formula.getDescripcion().trim();
            return tipoVidrioRepository.findByNombreIgnoreCase(desc)
                    .orElseGet(() -> tipoVidrioRepository.findByNombre(desc)
                            .orElseThrow(() -> new EntityNotFoundException("Vidrio '" + desc + "' no encontrado")));
        }

        throw new EntityNotFoundException("Vidrio no especificado en la fórmula ID: " + formula.getIdFormula());
    }

    /**
     * Evalúa una expresión de fórmula SpEL (#ANCHO, #ALTO).
     */
    private Double evaluarExpresion(String formulaTexto, StandardEvaluationContext context) {
        if (formulaTexto == null || formulaTexto.trim().isEmpty()) {
            return 0.0;
        }

        String expresionSpel = formulaTexto.trim()
                .replaceAll("(?i)\\bANCHO\\b", "#ANCHO")
                .replaceAll("(?i)\\bALTO\\b", "#ALTO");

        try {
            Number resultado = parser.parseExpression(expresionSpel).getValue(context, Number.class);
            return (resultado != null) ? resultado.doubleValue() : 0.0;
        } catch (Exception e) {
            try {
                return Double.parseDouble(formulaTexto.trim());
            } catch (NumberFormatException nfe) {
                log.warn("No se pudo evaluar la expresión de despiece: '{}'", formulaTexto, e);
                return 0.0;
            }
        }
    }

    /**
     * Calcula los costos consultando precios reales en BD y redondea hacia arriba (Math.ceil).
     */
    private DesgloseCostosDTO calcularCostosReales(DespieceObraRequestDTO request,
                                                  List<Material> materialesAluminio,
                                                  TipoVidrio tipoVidrio,
                                                  List<PiezaCristalDTO> cristales,
                                                  List<AccesorioItemDTO> accesorios,
                                                  OptimizadorResponseDTO optimizacion) {

        // 1. Costo Aluminio: número de varillas requeridas × precio de varilla en BD
        double costoVarillaAluminio = 0.0;
        if (request.getCostoAluminioPorVarilla() != null && request.getCostoAluminioPorVarilla() > 0) {
            costoVarillaAluminio = request.getCostoAluminioPorVarilla();
        } else {
            for (Material m : materialesAluminio) {
                if (m.getPrecioVarilla() != null && m.getPrecioVarilla().doubleValue() > 0) {
                    costoVarillaAluminio = m.getPrecioVarilla().doubleValue();
                    break;
                }
            }
            if (costoVarillaAluminio <= 0) {
                List<Material> todos = materialRepository.findAll();
                for (Material m : todos) {
                    if (m.getTipoMaterial() == CategoriaMaterial.PERFIL_ALUMINIO
                            && m.getPrecioVarilla() != null && m.getPrecioVarilla().doubleValue() > 0) {
                        costoVarillaAluminio = m.getPrecioVarilla().doubleValue();
                        break;
                    }
                }
            }
            if (costoVarillaAluminio <= 0) {
                throw new EntityNotFoundException("No se encontró precio de varilla para el aluminio en el inventario");
            }
        }

        int varillasRequeridas = (optimizacion.getTotalVarillas() != null) ? optimizacion.getTotalVarillas() : 1;
        double costoAluminio = redondear2(varillasRequeridas * costoVarillaAluminio);

        // 2. Costo Cristal: m² total × costo por m² en BD
        double costoM2Vidrio = 0.0;
        if (request.getCostoM2Vidrio() != null && request.getCostoM2Vidrio() > 0) {
            costoM2Vidrio = request.getCostoM2Vidrio();
        } else if (tipoVidrio != null) {
            if (tipoVidrio.getCostoDefectoM2() != null && tipoVidrio.getCostoDefectoM2().doubleValue() > 0) {
                costoM2Vidrio = tipoVidrio.getCostoDefectoM2().doubleValue();
            } else if (tipoVidrio.getPrecioPlancha() != null && tipoVidrio.getAnchoPlancha() != null && tipoVidrio.getAltoPlancha() != null) {
                double areaPlancha = tipoVidrio.getAnchoPlancha().doubleValue() * tipoVidrio.getAltoPlancha().doubleValue();
                if (areaPlancha > 0) {
                    costoM2Vidrio = tipoVidrio.getPrecioPlancha().doubleValue() / areaPlancha;
                }
            }
        }

        if (costoM2Vidrio <= 0) {
            throw new EntityNotFoundException("No se encontró costo por m2 para el vidrio en el inventario");
        }

        double areaM2TotalCristal = cristales.stream()
                .mapToDouble(PiezaCristalDTO::getAreaM2Total)
                .sum();
        double costoCristal = redondear2(areaM2TotalCristal * costoM2Vidrio);

        // 3. Costo Accesorios: suma calculada a partir de los precios unitarios de materiales en BD
        double costoAccesorios = accesorios.stream()
                .filter(a -> a.getCostoEstimado() != null)
                .mapToDouble(AccesorioItemDTO::getCostoEstimado)
                .sum();
        costoAccesorios = redondear2(costoAccesorios);

        // 4. Costo Mano de Obra: explícito o 0 si no se ingresa
        double costoManoObra = (request.getCostoManoObra() != null && request.getCostoManoObra() > 0)
                ? request.getCostoManoObra()
                : 0.0;

        // Subtotal crudo
        double subtotalCrudo = costoAluminio + costoCristal + costoAccesorios + costoManoObra;

        // Margen comercial
        double factorMargen = (request.getMargenGanancia() != null && request.getMargenGanancia() >= 0)
                ? (1.0 + request.getMargenGanancia())
                : 1.25;

        double totalConMargen = subtotalCrudo * factorMargen;
        double precioTotalRedondeado = Math.ceil(totalConMargen);

        return DesgloseCostosDTO.builder()
                .costoAluminio(costoAluminio)
                .costoCristal(costoCristal)
                .costoAccesorios(costoAccesorios)
                .costoManoObra(costoManoObra)
                .subtotal(redondear2(subtotalCrudo))
                .precioTotal(precioTotalRedondeado)
                .build();
    }

    private PiezaAluminioDTO crearPiezaAluminio(String nombre, String formula, double longitudMm, int cantidad) {
        return PiezaAluminioDTO.builder()
                .nombrePerfil(nombre)
                .formula(formula)
                .longitudMm(longitudMm)
                .cantidad(cantidad)
                .longitudTotalMm(redondear2(longitudMm * cantidad))
                .build();
    }

    private double redondear2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double redondear4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }
}
