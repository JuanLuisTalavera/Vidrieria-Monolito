package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Servicio de optimización de trazado y empaquetamiento de varillas lineales 1D (Stock Cutting Problem).
 * Implementa el algoritmo Best-Fit Decreasing (BFD) considerando la merma del disco de sierra (kerf).
 */
@Service
public class CorteVarillaService {

    /**
     * Resuelve el empaquetamiento 1D de cortes en el menor número de varillas posibles.
     *
     * @param request DTO con longitud estándar, espesor de disco de corte y lista de piezas requeridas.
     * @return OptimizadorResponseDTO con trazado milimétrico de cada varilla y métricas globales.
     */
    public OptimizadorResponseDTO optimizarCorte(OptimizadorRequestDTO request) {
        if (request == null || request.getCortes() == null || request.getCortes().isEmpty()) {
            return OptimizadorResponseDTO.builder()
                    .longitudVarillaEstandarMm(request != null ? request.getLongitudVarillaEstandarMm() : 6000.0)
                    .anchoSierraMm(request != null ? request.getAnchoSierraMm() : 3.0)
                    .totalVarillas(0)
                    .totalMetrosConsumidos(0.0)
                    .totalMetrosUtiles(0.0)
                    .totalDesperdicioMm(0.0)
                    .porcentajeAprovechamientoGlobal(0.0)
                    .varillas(new ArrayList<>())
                    .build();
        }

        final double longitudVarilla = request.getLongitudVarillaEstandarMm() != null && request.getLongitudVarillaEstandarMm() > 0
                ? request.getLongitudVarillaEstandarMm()
                : 6000.0;
        final double anchoSierra = request.getAnchoSierraMm() != null && request.getAnchoSierraMm() >= 0
                ? request.getAnchoSierraMm()
                : 3.0;

        // 1. Expandir ítems según cantidad requerida
        List<PiezaCorteTemporal> piezasAplanadas = new ArrayList<>();
        for (CorteItemDTO item : request.getCortes()) {
            if (item.getLongitudMm() == null || item.getLongitudMm() <= 0) {
                continue;
            }
            if (item.getLongitudMm() > longitudVarilla) {
                throw new IllegalArgumentException(String.format(
                        "La pieza '%s' de %.2f mm excede la longitud estándar de la varilla (%.2f mm)",
                        item.getEtiqueta() != null ? item.getEtiqueta() : "Sin etiqueta",
                        item.getLongitudMm(),
                        longitudVarilla));
            }

            int cantidad = item.getCantidad() != null && item.getCantidad() > 0 ? item.getCantidad() : 1;
            for (int i = 0; i < cantidad; i++) {
                piezasAplanadas.add(new PiezaCorteTemporal(item.getEtiqueta(), item.getLongitudMm()));
            }
        }

        if (piezasAplanadas.isEmpty()) {
            return OptimizadorResponseDTO.builder()
                    .longitudVarillaEstandarMm(longitudVarilla)
                    .anchoSierraMm(anchoSierra)
                    .totalVarillas(0)
                    .totalMetrosConsumidos(0.0)
                    .totalMetrosUtiles(0.0)
                    .totalDesperdicioMm(0.0)
                    .porcentajeAprovechamientoGlobal(0.0)
                    .varillas(new ArrayList<>())
                    .build();
        }

        // 2. Ordenar en orden descendente de longitud (Decreasing)
        piezasAplanadas.sort(Comparator.comparingDouble(PiezaCorteTemporal::getLongitudMm).reversed());

        // 3. Empaquetamiento Best-Fit Decreasing
        List<VarillaEnConstruccion> varillasAbiertas = new ArrayList<>();

        for (PiezaCorteTemporal pieza : piezasAplanadas) {
            double longitudPieza = pieza.getLongitudMm();
            VarillaEnConstruccion mejorVarilla = null;
            double menorEspacioRestante = Double.MAX_VALUE;

            for (VarillaEnConstruccion varilla : varillasAbiertas) {
                double espacioNecesario = varilla.segmentos.isEmpty()
                        ? longitudPieza
                        : anchoSierra + longitudPieza;

                if (varilla.posicionActualMm + espacioNecesario <= longitudVarilla) {
                    double espacioRestante = longitudVarilla - (varilla.posicionActualMm + espacioNecesario);
                    if (espacioRestante < menorEspacioRestante) {
                        menorEspacioRestante = espacioRestante;
                        mejorVarilla = varilla;
                    }
                }
            }

            if (mejorVarilla == null) {
                // Abrir nueva varilla
                mejorVarilla = new VarillaEnConstruccion(varillasAbiertas.size() + 1, longitudVarilla);
                varillasAbiertas.add(mejorVarilla);
            }

            // Colocar la pieza en la varilla elegida
            mejorVarilla.agregarCorte(pieza.getEtiqueta(), longitudPieza, anchoSierra);
        }

        // 4. Mapear a DTOs y calcular métricas milimétricas
        List<VarillaOptimizadaDTO> varillasDTO = new ArrayList<>();
        double sumaMetrosUtiles = 0.0;

        for (VarillaEnConstruccion varilla : varillasAbiertas) {
            double sumaLongitudesCortes = varilla.segmentos.stream()
                    .mapToDouble(SegmentoCorteDTO::getLongitudMm)
                    .sum();
            sumaMetrosUtiles += (sumaLongitudesCortes / 1000.0);

            int cantidadSegmentos = varilla.segmentos.size();
            double posicionFinUltimoCorte = varilla.posicionActualMm;
            double espacioFinalLibre = longitudVarilla - posicionFinUltimoCorte;

            double mermaCorteMm;
            double retazoSobranteMm;

            if (espacioFinalLibre <= 0.0001) {
                // Terminó exactamente al final de la varilla
                mermaCorteMm = Math.max(0, cantidadSegmentos - 1) * anchoSierra;
                retazoSobranteMm = 0.0;
            } else if (espacioFinalLibre >= anchoSierra) {
                // Hay suficiente espacio para el corte de separación del retazo
                mermaCorteMm = cantidadSegmentos * anchoSierra;
                retazoSobranteMm = redondear2(espacioFinalLibre - anchoSierra);
            } else {
                // Espacio menor que el ancho del disco: se pierde como merma
                mermaCorteMm = redondear2(Math.max(0, cantidadSegmentos - 1) * anchoSierra + espacioFinalLibre);
                retazoSobranteMm = 0.0;
            }

            double porcentajeAprovechamiento = redondear2((sumaLongitudesCortes / longitudVarilla) * 100.0);

            varillasDTO.add(VarillaOptimizadaDTO.builder()
                    .numeroVarilla(varilla.numeroVarilla)
                    .longitudTotalMm(longitudVarilla)
                    .segmentos(varilla.segmentos)
                    .mermaCorteMm(redondear2(mermaCorteMm))
                    .retazoSobranteMm(retazoSobranteMm)
                    .porcentajeAprovechamiento(porcentajeAprovechamiento)
                    .build());
        }

        int totalVarillas = varillasDTO.size();
        double totalMetrosConsumidos = redondear2((totalVarillas * longitudVarilla) / 1000.0);
        double totalMetrosUtiles = redondear2(sumaMetrosUtiles);
        double totalDesperdicioMm = redondear2((totalVarillas * longitudVarilla) - (sumaMetrosUtiles * 1000.0));
        double porcentajeAprovechamientoGlobal = totalMetrosConsumidos > 0
                ? redondear2((totalMetrosUtiles / totalMetrosConsumidos) * 100.0)
                : 0.0;

        return OptimizadorResponseDTO.builder()
                .longitudVarillaEstandarMm(longitudVarilla)
                .anchoSierraMm(anchoSierra)
                .totalVarillas(totalVarillas)
                .totalMetrosConsumidos(totalMetrosConsumidos)
                .totalMetrosUtiles(totalMetrosUtiles)
                .totalDesperdicioMm(totalDesperdicioMm)
                .porcentajeAprovechamientoGlobal(porcentajeAprovechamientoGlobal)
                .varillas(varillasDTO)
                .build();
    }

    private double redondear2(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    // --- Clases de apoyo internas ---

    private static class PiezaCorteTemporal {
        private final String etiqueta;
        private final double longitudMm;

        public PiezaCorteTemporal(String etiqueta, double longitudMm) {
            this.etiqueta = etiqueta;
            this.longitudMm = longitudMm;
        }

        public String getEtiqueta() {
            return etiqueta;
        }

        public double getLongitudMm() {
            return longitudMm;
        }
    }

    private static class VarillaEnConstruccion {
        private final int numeroVarilla;
        private final double longitudTotalMm;
        private double posicionActualMm = 0.0;
        private final List<SegmentoCorteDTO> segmentos = new ArrayList<>();

        public VarillaEnConstruccion(int numeroVarilla, double longitudTotalMm) {
            this.numeroVarilla = numeroVarilla;
            this.longitudTotalMm = longitudTotalMm;
        }

        public void agregarCorte(String etiqueta, double longitudMm, double anchoSierra) {
            double inicio;
            if (segmentos.isEmpty()) {
                inicio = 0.0;
            } else {
                inicio = posicionActualMm + anchoSierra;
            }
            double fin = inicio + longitudMm;

            SegmentoCorteDTO segmento = SegmentoCorteDTO.builder()
                    .idSegmento(segmentos.size() + 1)
                    .etiqueta(etiqueta)
                    .longitudMm(Math.round(longitudMm * 100.0) / 100.0)
                    .posicionInicialMm(Math.round(inicio * 100.0) / 100.0)
                    .posicionFinalMm(Math.round(fin * 100.0) / 100.0)
                    .build();

            segmentos.add(segmento);
            this.posicionActualMm = fin;
        }
    }
}
