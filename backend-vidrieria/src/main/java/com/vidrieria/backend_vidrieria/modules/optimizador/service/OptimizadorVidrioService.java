package com.vidrieria.backend_vidrieria.modules.optimizador.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;

import com.vidrieria.backend_vidrieria.modules.ingenieria.dto.PiezaCristalDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorVidrioRequestDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.OptimizadorVidrioResponseDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.PiezaVidrioUbicadaDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.PlanchaVidrioOptimizadaDTO;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.RetazoVidrioDTO;

/**
 * Motor de optimización 2D Guillotine Bin Packing para corte de vidrio.
 *
 * <p>Implementa <b>Simulated Annealing (SA)</b> con decodificador First-Fit Guillotine
 * y evaluación multi-heurística (BAF + BSSF) por cada candidato:</p>
 * <ul>
 *   <li><b>Genotipo</b>: Permutación de orden de inserción + vector booleano de rotaciones.</li>
 *   <li><b>Vecindad</b>: Swap, Insert, Reverse-Segment, Toggle-Rotation.</li>
 *   <li><b>Decodificador</b>: First-Fit Guillotine con MAXAS (Maximize Area Slicer).</li>
 *   <li><b>Multi-Heurística</b>: Cada candidato se decodifica con BAF y BSSF; se conserva el mejor.</li>
 *   <li><b>Interrupción</b>: Se detiene por tiempo límite, señal de stop externa, o convergencia.</li>
 *   <li><b>Retazos</b>: Consolidación de rectángulos libres (merge + containment removal).</li>
 * </ul>
 *
 * <p>Corte sin merma de material (kerf = 0, corte por diamante).</p>
 */
import com.vidrieria.backend_vidrieria.modules.optimizador.port.OptimizarCorteVidrioUseCase;

@Service
public class OptimizadorVidrioService implements OptimizarCorteVidrioUseCase {

    private static final double EPSILON = 0.0001;

    // ===== Parámetros del Motor Simulated Annealing =====
    /** Tiempo máximo de ejecución del motor en milisegundos (30 segundos). */
    static final long MAX_TIEMPO_EJECUCION_MS = 30_000;
    /** Factor para calcular la temperatura inicial: T0 = areaPlancha × factor (alta exploración). */
    private static final double SA_FACTOR_TEMPERATURA = 0.08;
    /** Tasa de enfriamiento geométrico (cooling rate): T_{k+1} = T_k × 0.999. */
    private static final double SA_COOLING_RATE = 0.999;
    /** Iteraciones sin mejora antes de ejecutar un reheat parcial. */
    private static final int SA_MAX_SIN_MEJORA = 1000;
    /** Factor de penalización por plancha en la función de fitness. */
    private static final double PENALIZACION_POR_PLANCHA = 2.0;
    /**
     * Margen de sierra (kerf) en milímetros.
     * En corte de vidrio estándar por diamante/rodel es 0.0 mm (sin merma).
     * NOTA DE PRECISIÓN MILIMÉTRICA: NUNCA se aplica a los bordes exteriores
     * de la plancha matriz (x=0, y=0, x=anchoPlancha, y=altoPlancha).
     */
    private static final double KERF_CORTE_MM = 0.0;

    // ===== Interfaz Funcional para Reporte de Progreso =====
    @FunctionalInterface
    public interface ReporteProgreso {
        void reportar(double progreso, int iteraciones, int mejorPlanchas, double mejorAprovechamiento);
    }

    // ==========================================
    // API Pública
    // ==========================================

    /**
     * Valida la solicitud de optimización sin ejecutar el motor.
     * Lanza {@link IllegalArgumentException} si algún campo es inválido.
     *
     * @param request DTO con dimensiones de plancha y lista de piezas.
     */
    public void validarRequest(OptimizadorVidrioRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de optimización de corte no puede ser nula");
        }
        if (request.getAnchoPlancha() == null || request.getAnchoPlancha() <= 0) {
            throw new IllegalArgumentException("El ancho de la plancha debe ser un valor mayor a cero");
        }
        if (request.getAltoPlancha() == null || request.getAltoPlancha() <= 0) {
            throw new IllegalArgumentException("El alto de la plancha debe ser un valor mayor a cero");
        }
    }

    /**
     * Versión síncrona (backward-compatible) del optimizador.
     * Ejecuta la optimización con un stop flag interno y sin reporte de progreso.
     */
    public OptimizadorVidrioResponseDTO optimizarCorteVidrio(OptimizadorVidrioRequestDTO request) {
        return optimizarCorteVidrio(request, new AtomicBoolean(false), (p, i, pl, ap) -> {});
    }

    /**
     * Punto de entrada principal del motor de optimización.
     * Diseñado para ser invocado desde un {@code CompletableFuture} o un hilo dedicado.
     *
     * @param request          Solicitud de optimización con dimensiones y piezas.
     * @param detener          Flag atómico para señalar interrupción cooperativa.
     * @param reportarProgreso Callback de progreso (fracción, iteraciones, mejor planchas, mejor %).
     * @return Respuesta completa con layout óptimo, coordenadas, retazos y métricas.
     */
    public OptimizadorVidrioResponseDTO optimizarCorteVidrio(
            OptimizadorVidrioRequestDTO request,
            AtomicBoolean detener,
            ReporteProgreso reportarProgreso) {

        validarRequest(request);

        if (request.getPiezas() == null || request.getPiezas().isEmpty()) {
            return construirRespuestaVacia(request);
        }

        final double anchoPlancha = request.getAnchoPlancha();
        final double altoPlancha = request.getAltoPlancha();
        final boolean permitirRotacion = request.getPermitirRotacion() == null || request.getPermitirRotacion();

        // 1. Expandir y validar ítems según su cantidad
        List<PiezaCristalTemporal> piezas = aplanarPiezas(request.getPiezas(), anchoPlancha, altoPlancha, permitirRotacion);
        if (piezas.isEmpty()) {
            return construirRespuestaVacia(request);
        }

        final int totalPiezasSolicitadas = piezas.size();

        // 2. Ejecutar Simulated Annealing
        Solucion mejorSolucion = ejecutarSimulatedAnnealing(
                piezas, anchoPlancha, altoPlancha, permitirRotacion,
                detener, reportarProgreso);

        // 3. Construir respuesta final
        return construirRespuesta(mejorSolucion, anchoPlancha, altoPlancha, totalPiezasSolicitadas);
    }

    // ==========================================
    // Motor Simulated Annealing
    // ==========================================

    /**
     * Ejecuta el bucle principal de Simulated Annealing con evaluación multi-heurística
     * y partición dual guillotina (MINAS / MAXAS).
     *
     * <p>Por cada candidato vecino, se evalúan ambas estrategias de partición guillotina
     * (MINAS y MAXAS) combinadas con BAF y BSSF, conservando la que encaje más piezas.
     * Incorpora enfriamiento geométrico gradual (0.999), Deep Shuffling de bloques de piezas
     * del mismo tamaño, y reheat parcial para escapar mínimos locales.</p>
     */
    private Solucion ejecutarSimulatedAnnealing(
            List<PiezaCristalTemporal> piezas,
            double anchoPlancha, double altoPlancha,
            boolean permitirRotacion,
            AtomicBoolean detener,
            ReporteProgreso reportarProgreso) {

        int n = piezas.size();
        double areaPlancha = anchoPlancha * altoPlancha;
        Random random = ThreadLocalRandom.current();

        // Precomputar grupos de piezas con dimensiones idénticas para Deep Shuffling
        List<List<Integer>> gruposMismoTamano = precomputarGruposMismoTamano(piezas, permitirRotacion);

        // --- Fase 1: Generar y evaluar semillas heurísticas deterministas ---
        List<Cromosoma> semillas = generarSemillas(piezas, permitirRotacion);

        Solucion mejorGlobal = null;
        for (Cromosoma semilla : semillas) {
            Solucion sol = decodificarMejor(semilla, piezas, anchoPlancha, altoPlancha, permitirRotacion);
            if (mejorGlobal == null || esMejorSolucion(sol, mejorGlobal)) {
                mejorGlobal = sol;
            }
        }

        // Agregar soluciones aleatorias adicionales para diversidad inicial
        int totalAleatorias = Math.max(20, semillas.size());
        for (int i = 0; i < totalAleatorias; i++) {
            Cromosoma cRandom = crearCromosomaAleatorio(n, permitirRotacion, random);
            Solucion sol = decodificarMejor(cRandom, piezas, anchoPlancha, altoPlancha, permitirRotacion);
            if (esMejorSolucion(sol, mejorGlobal)) {
                mejorGlobal = sol;
            }
        }

        // Si la solución inicial ya es 100% óptima (desperdicio cero), no hay margen de mejora matemática
        double aprovInicial = calcularAprovechamientoGlobal(mejorGlobal, areaPlancha);
        if (Math.abs(aprovInicial - 100.0) < EPSILON || n <= 1) {
            reportarProgreso.reportar(1.0, 0, mejorGlobal.totalPlanchas, aprovInicial);
            return mejorGlobal;
        }

        // --- Fase 2: Simulated Annealing ---
        Cromosoma actual = mejorGlobal.cromosoma.copiar();
        double fitnessActual = mejorGlobal.fitness;

        // Temperatura inicial calibrada alta para explorar el espacio de estados
        double T0 = areaPlancha * SA_FACTOR_TEMPERATURA;
        double T = T0;
        double Tmin = 1.0;
        long inicio = System.currentTimeMillis();
        int iteracion = 0;
        int sinMejora = 0;

        while (!detener.get()) {
            long elapsed = System.currentTimeMillis() - inicio;
            if (elapsed >= MAX_TIEMPO_EJECUCION_MS) break;

            // Enfriamiento geométrico gradual (tasa 0.999) para evitar mínimos locales prematuros
            T = Math.max(Tmin, T * SA_COOLING_RATE);

            // Generar vecino con operadores incluyendo Deep Shuffling de piezas idénticas
            Cromosoma vecino = generarVecino(actual, gruposMismoTamano, permitirRotacion, random);

            // Decodificar con evaluación dual de partición (MINAS y MAXAS) y heurísticas de corte
            Solucion solVecino = decodificarMejor(vecino, piezas, anchoPlancha, altoPlancha, permitirRotacion);
            double deltaE = solVecino.fitness - fitnessActual;

            // Criterio de aceptación Metropolis
            if (deltaE > 0 || (T > EPSILON && random.nextDouble() < Math.exp(deltaE / T))) {
                actual = vecino;
                fitnessActual = solVecino.fitness;

                if (esMejorSolucion(solVecino, mejorGlobal)) {
                    mejorGlobal = solVecino;
                    sinMejora = 0;

                    // Si se alcanza el 100% de aprovechamiento (desperdicio cero), la solución es óptima
                    double aprovActual = calcularAprovechamientoGlobal(mejorGlobal, areaPlancha);
                    if (Math.abs(aprovActual - 100.0) < EPSILON) {
                        break;
                    }
                } else {
                    sinMejora++;
                }
            } else {
                sinMejora++;
            }

            // Reheat: si se estanca en mínimo local, reiniciar desde mejor global con Deep Shuffling y recalentamiento
            if (sinMejora >= SA_MAX_SIN_MEJORA) {
                actual = mejorGlobal.cromosoma.copiar();
                aplicarDeepShuffling(actual, gruposMismoTamano, permitirRotacion, random);
                Solucion solPerturbada = decodificarMejor(actual, piezas, anchoPlancha, altoPlancha, permitirRotacion);
                actual = solPerturbada.cromosoma;
                fitnessActual = solPerturbada.fitness;
                T = Math.max(T, T0 * 0.35);
                sinMejora = 0;
            }

            iteracion++;

            // Reportar progreso periódicamente
            if (iteracion % 250 == 0) {
                double fraccionTiempo = Math.min(1.0, (double) elapsed / MAX_TIEMPO_EJECUCION_MS);
                double aprovechamiento = calcularAprovechamientoGlobal(mejorGlobal, areaPlancha);
                reportarProgreso.reportar(fraccionTiempo, iteracion,
                        mejorGlobal.totalPlanchas, aprovechamiento);
            }
        }

        // Reporte final
        double aprovFinal = calcularAprovechamientoGlobal(mejorGlobal, areaPlancha);
        reportarProgreso.reportar(1.0, iteracion, mejorGlobal.totalPlanchas, aprovFinal);

        return mejorGlobal;
    }

    // ==========================================
    // Operadores de Vecindad (SA) y Deep Shuffling
    // ==========================================

    /**
     * Genera un vecino del cromosoma actual aplicando un operador probabilístico:
     * <ul>
     *   <li><b>Deep Shuffling (20%)</b>: Permutaciones de bloques enteros de piezas del mismo tamaño.</li>
     *   <li><b>Swap (25%)</b>: Intercambiar dos posiciones aleatorias.</li>
     *   <li><b>Insert (20%)</b>: Mover una pieza a otra posición.</li>
     *   <li><b>Reverse Segment (15%)</b>: Invertir un segmento del orden.</li>
     *   <li><b>Toggle Rotation (20%)</b>: Invertir rotación de piezas aleatorias.</li>
     * </ul>
     */
    private Cromosoma generarVecino(
            Cromosoma actual,
            List<List<Integer>> gruposMismoTamano,
            boolean permitirRotacion,
            Random random) {

        Cromosoma vecino = actual.copiar();
        int n = vecino.orden.length;
        if (n <= 1) return vecino;

        double r = random.nextDouble();

        if (r < 0.20) {
            // DEEP SHUFFLING: permutación de bloques enteros de piezas del mismo tamaño
            aplicarDeepShuffling(vecino, gruposMismoTamano, permitirRotacion, random);

        } else if (r < 0.45) {
            // SWAP
            int i = random.nextInt(n);
            int j = random.nextInt(n);
            while (j == i) j = random.nextInt(n);
            swap(vecino.orden, i, j);
            swapBool(vecino.rotaciones, i, j);

        } else if (r < 0.65) {
            // INSERT: extraer pieza y reinsertar en otra posición
            int from = random.nextInt(n);
            int to = random.nextInt(n);
            while (to == from) to = random.nextInt(n);
            int gene = vecino.orden[from];
            boolean rot = vecino.rotaciones[from];
            if (from < to) {
                System.arraycopy(vecino.orden, from + 1, vecino.orden, from, to - from);
                System.arraycopy(vecino.rotaciones, from + 1, vecino.rotaciones, from, to - from);
            } else {
                System.arraycopy(vecino.orden, to, vecino.orden, to + 1, from - to);
                System.arraycopy(vecino.rotaciones, to, vecino.rotaciones, to + 1, from - to);
            }
            vecino.orden[to] = gene;
            vecino.rotaciones[to] = rot;

        } else if (r < 0.80) {
            // REVERSE SEGMENT
            int i = random.nextInt(n);
            int j = random.nextInt(n);
            if (i > j) { int tmp = i; i = j; j = tmp; }
            while (i < j) {
                swap(vecino.orden, i, j);
                swapBool(vecino.rotaciones, i, j);
                i++;
                j--;
            }

        } else if (permitirRotacion) {
            // TOGGLE ROTATION (1 a 3 piezas)
            int count = 1 + random.nextInt(Math.min(3, n));
            for (int k = 0; k < count; k++) {
                int i = random.nextInt(n);
                vecino.rotaciones[i] = !vecino.rotaciones[i];
            }
        } else {
            // Fallback: Deep Shuffling si rotación no permitida
            aplicarDeepShuffling(vecino, gruposMismoTamano, false, random);
        }

        return vecino;
    }

    /**
     * Estrategia de Deep Shuffling:
     * Identifica bloques enteros de piezas con las mismas dimensiones y los permuta
     * en bloque o los reubica contiguos en el cromosoma para favorecer cortes regulares en tiras.
     */
    private void aplicarDeepShuffling(
            Cromosoma vecino,
            List<List<Integer>> gruposMismoTamano,
            boolean permitirRotacion,
            Random random) {

        int n = vecino.orden.length;
        if (n <= 2) {
            if (n == 2) {
                swap(vecino.orden, 0, 1);
                swapBool(vecino.rotaciones, 0, 1);
            }
            return;
        }

        if (!gruposMismoTamano.isEmpty() && random.nextDouble() < 0.75) {
            // Elegir un grupo aleatorio de piezas del mismo tamaño
            List<Integer> grupo = gruposMismoTamano.get(random.nextInt(gruposMismoTamano.size()));
            Set<Integer> piezasGrupo = new HashSet<>(grupo);

            int[] nuevoOrden = new int[n];
            boolean[] nuevasRot = new boolean[n];

            List<Integer> extraidasOrden = new ArrayList<>();
            List<Boolean> extraidasRot = new ArrayList<>();
            int idxResto = 0;

            // Extraer las piezas del grupo preservando el resto
            for (int i = 0; i < n; i++) {
                int p = vecino.orden[i];
                if (piezasGrupo.contains(p)) {
                    extraidasOrden.add(p);
                    extraidasRot.add(vecino.rotaciones[i]);
                } else {
                    nuevoOrden[idxResto] = p;
                    nuevasRot[idxResto] = vecino.rotaciones[i];
                    idxResto++;
                }
            }

            // Permutar internamente el bloque de piezas idénticas
            Collections.shuffle(extraidasOrden, random);

            // Opcionalmente forzar la misma orientación a todo el bloque contiguo
            boolean forzarMismaOrientacion = permitirRotacion && random.nextBoolean();
            boolean rotacionBloque = random.nextBoolean();

            // Insertar el bloque completo como una secuencia contigua
            int posInsercion = random.nextInt(idxResto + 1);

            // Desplazar elementos hacia la derecha para hacer hueco al bloque
            int tamBloque = extraidasOrden.size();
            System.arraycopy(nuevoOrden, posInsercion, nuevoOrden, posInsercion + tamBloque, idxResto - posInsercion);
            System.arraycopy(nuevasRot, posInsercion, nuevasRot, posInsercion + tamBloque, idxResto - posInsercion);

            // Insertar el bloque
            for (int k = 0; k < tamBloque; k++) {
                nuevoOrden[posInsercion + k] = extraidasOrden.get(k);
                nuevasRot[posInsercion + k] = forzarMismaOrientacion ? rotacionBloque : extraidasRot.get(k);
            }

            vecino.orden = nuevoOrden;
            vecino.rotaciones = nuevasRot;
        } else {
            // Permutación de bloques contiguos de tamaño K (Block Swap)
            int maxBloque = Math.min(Math.max(2, n / 3), 4);
            int tamBloque = 2 + (maxBloque > 2 ? random.nextInt(maxBloque - 1) : 0);

            if (n >= tamBloque * 2) {
                int pos1 = random.nextInt(n - tamBloque * 2 + 1);
                int pos2 = pos1 + tamBloque + random.nextInt(n - (pos1 + tamBloque * 2) + 1);

                for (int k = 0; k < tamBloque; k++) {
                    swap(vecino.orden, pos1 + k, pos2 + k);
                    swapBool(vecino.rotaciones, pos1 + k, pos2 + k);
                }
            } else {
                int i = random.nextInt(n);
                int j = random.nextInt(n);
                while (j == i) j = random.nextInt(n);
                swap(vecino.orden, i, j);
                swapBool(vecino.rotaciones, i, j);
            }
        }
    }

    /**
     * Precomputa grupos de piezas que poseen las mismas dimensiones físicas (con o sin rotación).
     */
    private List<List<Integer>> precomputarGruposMismoTamano(
            List<PiezaCristalTemporal> piezas, boolean permitirRotacion) {

        Map<String, List<Integer>> mapaGrupos = new LinkedHashMap<>();

        for (int i = 0; i < piezas.size(); i++) {
            PiezaCristalTemporal p = piezas.get(i);
            String clave;
            if (permitirRotacion) {
                double min = Math.min(p.ancho, p.alto);
                double max = Math.max(p.ancho, p.alto);
                clave = String.format(Locale.US, "%.1fx%.1f", min, max);
            } else {
                clave = String.format(Locale.US, "%.1fx%.1f", p.ancho, p.alto);
            }
            mapaGrupos.computeIfAbsent(clave, k -> new ArrayList<>()).add(i);
        }

        List<List<Integer>> gruposMultiples = new ArrayList<>();
        for (List<Integer> grupo : mapaGrupos.values()) {
            if (grupo.size() >= 2) {
                gruposMultiples.add(grupo);
            }
        }
        return gruposMultiples;
    }

    private static void swap(int[] arr, int i, int j) {
        int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    private static void swapBool(boolean[] arr, int i, int j) {
        boolean tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    // ==========================================
    // Generación de Semillas Heurísticas
    // ==========================================

    /**
     * Genera cromosomas semilla deterministas a partir de 7 estrategias de ordenamiento,
     * cada una con 2 variantes de rotación (sin rotación forzada + landscape).
     * Total: 14 semillas (o 7 si la rotación no está permitida).
     */
    private List<Cromosoma> generarSemillas(List<PiezaCristalTemporal> piezas, boolean permitirRotacion) {
        List<Cromosoma> semillas = new ArrayList<>();
        SortStrategy[] estrategias = SortStrategy.values();

        for (SortStrategy strategy : estrategias) {
            semillas.add(crearCromosomaHeuristico(piezas, strategy, false, permitirRotacion));
            if (permitirRotacion) {
                semillas.add(crearCromosomaHeuristico(piezas, strategy, true, permitirRotacion));
            }
        }
        return semillas;
    }

    /**
     * Crea un cromosoma con orden heurístico determinista.
     */
    private Cromosoma crearCromosomaHeuristico(
            List<PiezaCristalTemporal> piezas,
            SortStrategy strategy,
            boolean rotarLandscape,
            boolean permitirRotacion) {

        int n = piezas.size();
        Integer[] indices = new Integer[n];
        for (int i = 0; i < n; i++) indices[i] = i;

        Comparator<PiezaCristalTemporal> comp = obtenerComparador(strategy);
        Arrays.sort(indices, (a, b) -> comp.compare(piezas.get(a), piezas.get(b)));

        int[] orden = new int[n];
        boolean[] rotaciones = new boolean[n];

        for (int i = 0; i < n; i++) {
            orden[i] = indices[i];
            if (rotarLandscape && permitirRotacion) {
                PiezaCristalTemporal pieza = piezas.get(indices[i]);
                rotaciones[i] = pieza.alto > pieza.ancho + EPSILON;
            }
        }

        return new Cromosoma(orden, rotaciones);
    }

    /**
     * Crea un cromosoma con permutación aleatoria (Fisher-Yates) y rotaciones aleatorias.
     */
    private Cromosoma crearCromosomaAleatorio(int n, boolean permitirRotacion, Random random) {
        int[] orden = new int[n];
        boolean[] rotaciones = new boolean[n];

        for (int i = 0; i < n; i++) orden[i] = i;
        for (int i = n - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            swap(orden, i, j);
        }

        if (permitirRotacion) {
            for (int i = 0; i < n; i++) {
                rotaciones[i] = random.nextBoolean();
            }
        }

        return new Cromosoma(orden, rotaciones);
    }

    // ==========================================
    // Decodificador Multi-Heurística (MINAS / MAXAS)
    // ==========================================

    /**
     * Decodifica un cromosoma evaluando rigurosamente ambas estrategias de partición
     * guillotina:
     * <ul>
     *   <li><b>MAXAS (Maximum Area Split)</b>: Maximiza el área del rectángulo resultante más grande
     *       para preservar retazos útiles.</li>
     *   <li><b>MINAS (Minimum Area Split)</b>: Minimiza el área del rectángulo resultante más pequeño,
     *       forzando a que la merma quede empaquetada herméticamente en un bloque residual mínimo.</li>
     * </ul>
     * Combinadas con BAF y BSSF. Se queda con la solución que encaje más piezas (menor número
     * de planchas) y logre el mayor aprovechamiento / fitness.
     */
    private Solucion decodificarMejor(
            Cromosoma cromosoma,
            List<PiezaCristalTemporal> piezas,
            double anchoPlancha, double altoPlancha,
            boolean permitirRotacion) {

        Solucion bafMaxas = decodificarConHeuristica(
                cromosoma, piezas, anchoPlancha, altoPlancha, permitirRotacion,
                HeuristicaSeleccion.BEST_AREA_FIT, EstrategiaParticion.MAXAS);

        Solucion bafMinas = decodificarConHeuristica(
                cromosoma, piezas, anchoPlancha, altoPlancha, permitirRotacion,
                HeuristicaSeleccion.BEST_AREA_FIT, EstrategiaParticion.MINAS);

        Solucion bssfMaxas = decodificarConHeuristica(
                cromosoma, piezas, anchoPlancha, altoPlancha, permitirRotacion,
                HeuristicaSeleccion.BEST_SHORT_SIDE_FIT, EstrategiaParticion.MAXAS);

        Solucion bssfMinas = decodificarConHeuristica(
                cromosoma, piezas, anchoPlancha, altoPlancha, permitirRotacion,
                HeuristicaSeleccion.BEST_SHORT_SIDE_FIT, EstrategiaParticion.MINAS);

        Solucion mejor = bafMaxas;
        if (esMejorSolucion(bafMinas, mejor)) mejor = bafMinas;
        if (esMejorSolucion(bssfMaxas, mejor)) mejor = bssfMaxas;
        if (esMejorSolucion(bssfMinas, mejor)) mejor = bssfMinas;

        return mejor;
    }

    /**
     * Compara dos soluciones priorizando estrictamente la que encaje más piezas
     * (menor número de planchas requeridas) y luego mayor fitness global.
     */
    private static boolean esMejorSolucion(Solucion candidata, Solucion actual) {
        if (candidata == null) return false;
        if (actual == null) return true;
        if (candidata.totalPlanchas != actual.totalPlanchas) {
            return candidata.totalPlanchas < actual.totalPlanchas;
        }
        return candidata.fitness > actual.fitness;
    }

    /**
     * Decodifica un cromosoma con una heurística de selección y una estrategia de partición guillotina.
     */
    private Solucion decodificarConHeuristica(
            Cromosoma cromosoma,
            List<PiezaCristalTemporal> piezas,
            double anchoPlancha, double altoPlancha,
            boolean permitirRotacion,
            HeuristicaSeleccion heuristica,
            EstrategiaParticion particion) {

        int n = cromosoma.orden.length;
        List<PlanchaEnConstruccion> planchas = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            int piezaIdx = cromosoma.orden[i];
            PiezaCristalTemporal pieza = piezas.get(piezaIdx);
            boolean intentarRotar = permitirRotacion && cromosoma.rotaciones[i];

            double w1 = intentarRotar ? pieza.alto : pieza.ancho;
            double h1 = intentarRotar ? pieza.ancho : pieza.alto;

            boolean rotAlt = !intentarRotar;
            double w2 = rotAlt ? pieza.alto : pieza.ancho;
            double h2 = rotAlt ? pieza.ancho : pieza.alto;
            boolean dimensionesDistintas = Math.abs(pieza.ancho - pieza.alto) > EPSILON;

            // === First-Fit Estricto ===
            MejorUbicacion mejor = null;
            for (int p = 0; p < planchas.size() && mejor == null; p++) {
                mejor = planchas.get(p).encontrarMejorRectangulo(w1, h1, intentarRotar, p, heuristica);
                if (mejor == null && permitirRotacion && dimensionesDistintas) {
                    mejor = planchas.get(p).encontrarMejorRectangulo(w2, h2, rotAlt, p, heuristica);
                }
            }

            // Abrir nueva plancha solo si es estrictamente necesario
            if (mejor == null) {
                int idx = planchas.size();
                PlanchaEnConstruccion nueva = new PlanchaEnConstruccion(idx + 1, anchoPlancha, altoPlancha);
                planchas.add(nueva);
                mejor = nueva.encontrarMejorRectangulo(w1, h1, intentarRotar, idx, heuristica);
                if (mejor == null && permitirRotacion && dimensionesDistintas) {
                    mejor = nueva.encontrarMejorRectangulo(w2, h2, rotAlt, idx, heuristica);
                }
            }

            planchas.get(mejor.indicePlancha).ubicarPiezaYPartir(pieza, mejor, particion);
        }

        return calcularFitness(cromosoma, planchas, anchoPlancha * altoPlancha);
    }

    // ==========================================
    // Función de Fitness Global
    // ==========================================

    /**
     * Calcula el fitness con penalización agresiva por número de planchas y bonos de concentración:
     * <ul>
     *   <li><b>Penalización por Plancha:</b> Factor 2.0x garantiza que N planchas siempre venza a N+1.</li>
     *   <li><b>Concentración Cuadrática:</b> Suma de (llenado_i)^2 impulsa a llenar las primeras planchas al 100%.</li>
     *   <li><b>Retazo Máximo:</b> Favorece que los sobrantes queden en piezas grandes utilizables.</li>
     * </ul>
     */
    private Solucion calcularFitness(Cromosoma cromosoma, List<PlanchaEnConstruccion> planchas, double areaPlancha) {
        int numPlanchas = planchas.size();
        double areaUtilTotal = 0.0;
        int totalRetazos = 0;
        double maxRetazoArea = 0.0;
        double sumaCuadradosLlenado = 0.0;

        for (PlanchaEnConstruccion plancha : planchas) {
            double areaPlanchaUtil = 0.0;
            for (PiezaVidrioUbicadaDTO pieza : plancha.piezasUbicadas) {
                double a = pieza.getAncho() * pieza.getAlto();
                areaUtilTotal += a;
                areaPlanchaUtil += a;
            }
            if (areaPlancha > 0) {
                double fillingRatio = Math.min(1.0, areaPlanchaUtil / areaPlancha);
                sumaCuadradosLlenado += (fillingRatio * fillingRatio);
            }
            for (RectanguloLibre rect : plancha.rectangulosLibres) {
                if (rect.w > EPSILON && rect.h > EPSILON) {
                    totalRetazos++;
                    double area = rect.w * rect.h;
                    if (area > maxRetazoArea) maxRetazoArea = area;
                }
            }
        }

        double penalizacionPlanchas = numPlanchas * areaPlancha * PENALIZACION_POR_PLANCHA;
        double bonoConcentracion = areaPlancha * sumaCuadradosLlenado;
        double bonoRetazoGrande = 0.05 * maxRetazoArea;
        double bonoMenosRetazos = 100.0 / (1.0 + totalRetazos);

        double fitness = areaUtilTotal - penalizacionPlanchas + bonoConcentracion + bonoRetazoGrande + bonoMenosRetazos;

        return new Solucion(cromosoma, fitness, planchas, numPlanchas, areaUtilTotal);
    }

    // ==========================================
    // Validación y Aplanamiento de Piezas
    // ==========================================

    private List<PiezaCristalTemporal> aplanarPiezas(
            List<PiezaCristalDTO> piezasDTO,
            double anchoPlancha, double altoPlancha,
            boolean permitirRotacion) {

        List<PiezaCristalTemporal> resultado = new ArrayList<>();
        int idContador = 1;

        for (int idx = 0; idx < piezasDTO.size(); idx++) {
            PiezaCristalDTO item = piezasDTO.get(idx);
            if (item == null) {
                throw new IllegalArgumentException(
                        String.format("La pieza en la posición %d no puede ser nula", idx + 1));
            }

            Double anchoItem = item.getAncho() != null ? item.getAncho() : item.getAnchoMm();
            Double altoItem = item.getAlto() != null ? item.getAlto() : item.getAltoMm();
            String descripcion = (item.getDescripcion() != null && !item.getDescripcion().isBlank())
                    ? item.getDescripcion()
                    : "Pieza #" + (idx + 1);

            if (anchoItem == null || anchoItem <= 0) {
                throw new IllegalArgumentException(String.format(
                        "La pieza '%s' tiene un ancho inválido (%s). Las dimensiones deben ser mayores a cero.",
                        descripcion, anchoItem == null ? "nulo" : String.format("%.2f mm", anchoItem)));
            }
            if (altoItem == null || altoItem <= 0) {
                throw new IllegalArgumentException(String.format(
                        "La pieza '%s' tiene un alto inválido (%s). Las dimensiones deben ser mayores a cero.",
                        descripcion, altoItem == null ? "nulo" : String.format("%.2f mm", altoItem)));
            }
            if (item.getCantidad() != null && item.getCantidad() <= 0) {
                throw new IllegalArgumentException(String.format(
                        "La pieza '%s' tiene una cantidad inválida (%d). Debe ser mayor a cero.",
                        descripcion, item.getCantidad()));
            }

            boolean cabeDirecto = anchoItem <= anchoPlancha + EPSILON && altoItem <= altoPlancha + EPSILON;
            boolean cabeRotado = permitirRotacion
                    && (altoItem <= anchoPlancha + EPSILON && anchoItem <= altoPlancha + EPSILON);

            if (!cabeDirecto && !cabeRotado) {
                throw new IllegalArgumentException(String.format(
                        "La pieza '%s' de %.2f x %.2f mm excede las dimensiones de la plancha (%.2f x %.2f mm)",
                        descripcion, anchoItem, altoItem, anchoPlancha, altoPlancha));
            }

            int cantidad = item.getCantidad() != null && item.getCantidad() > 0 ? item.getCantidad() : 1;
            for (int i = 1; i <= cantidad; i++) {
                String etiqueta = descripcion;
                if (cantidad > 1) {
                    etiqueta = etiqueta + " (" + i + "/" + cantidad + ")";
                }
                resultado.add(new PiezaCristalTemporal(idContador++, etiqueta, anchoItem, altoItem));
            }
        }

        return resultado;
    }

    // ==========================================
    // Construcción de Respuesta
    // ==========================================

    private OptimizadorVidrioResponseDTO construirRespuesta(
            Solucion solucion,
            double anchoPlancha, double altoPlancha,
            int totalPiezasSolicitadas) {

        List<PlanchaVidrioOptimizadaDTO> planchasDTO = new ArrayList<>();
        double sumaAreaPlanchasM2 = 0.0;
        double sumaAreaUtilM2 = 0.0;
        int totalPiezasUbicadas = 0;

        for (PlanchaEnConstruccion plancha : solucion.planchas) {
            PlanchaVidrioOptimizadaDTO dto = plancha.construirDTO();
            planchasDTO.add(dto);
            sumaAreaPlanchasM2 += dto.getAreaPlanchaM2();
            sumaAreaUtilM2 += dto.getAreaUtilM2();
            totalPiezasUbicadas += dto.getTotalPiezas();
        }

        int totalPlanchas = planchasDTO.size();
        double totalAreaPlanchasM2 = redondear4(sumaAreaPlanchasM2);
        double totalAreaUtilM2 = redondear4(sumaAreaUtilM2);
        double totalAreaDesperdicioM2 = redondear4(Math.max(0.0, totalAreaPlanchasM2 - totalAreaUtilM2));
        double areaRetazoMm2 = redondear2(totalAreaDesperdicioM2 * 1_000_000.0);

        double aprovechamientoGlobal = totalAreaPlanchasM2 > 0
                ? redondear2((totalAreaUtilM2 / totalAreaPlanchasM2) * 100.0)
                : 0.0;

        return OptimizadorVidrioResponseDTO.builder()
                .anchoPlanchaMm(redondear2(anchoPlancha))
                .altoPlanchaMm(redondear2(altoPlancha))
                .totalPlanchas(totalPlanchas)
                .totalPiezasSolicitadas(totalPiezasSolicitadas)
                .totalPiezasUbicadas(totalPiezasUbicadas)
                .totalAreaPlanchasM2(totalAreaPlanchasM2)
                .totalAreaUtilM2(totalAreaUtilM2)
                .totalAreaDesperdicioM2(totalAreaDesperdicioM2)
                .areaRetazoTotalM2(totalAreaDesperdicioM2)
                .areaRetazoTotalMm2(areaRetazoMm2)
                .mermaTotal(totalAreaDesperdicioM2)
                .mermaTotalMm2(areaRetazoMm2)
                .porcentajeAprovechamiento(aprovechamientoGlobal)
                .porcentajeAprovechamientoGlobal(aprovechamientoGlobal)
                .planchas(planchasDTO)
                .build();
    }

    private OptimizadorVidrioResponseDTO construirRespuestaVacia(OptimizadorVidrioRequestDTO request) {
        double ancho = request != null && request.getAnchoPlancha() != null ? request.getAnchoPlancha() : 2500.0;
        double alto = request != null && request.getAltoPlancha() != null ? request.getAltoPlancha() : 1800.0;

        return OptimizadorVidrioResponseDTO.builder()
                .anchoPlanchaMm(redondear2(ancho))
                .altoPlanchaMm(redondear2(alto))
                .totalPlanchas(0)
                .totalPiezasSolicitadas(0)
                .totalPiezasUbicadas(0)
                .totalAreaPlanchasM2(0.0)
                .totalAreaUtilM2(0.0)
                .totalAreaDesperdicioM2(0.0)
                .areaRetazoTotalM2(0.0)
                .areaRetazoTotalMm2(0.0)
                .mermaTotal(0.0)
                .mermaTotalMm2(0.0)
                .porcentajeAprovechamiento(0.0)
                .porcentajeAprovechamientoGlobal(0.0)
                .planchas(new ArrayList<>())
                .build();
    }

    // ==========================================
    // Utilidades
    // ==========================================

    private double calcularAprovechamientoGlobal(Solucion solucion, double areaPlancha) {
        if (solucion.totalPlanchas <= 0 || areaPlancha <= 0) return 0.0;
        return redondear2((solucion.areaUtilTotal / (solucion.totalPlanchas * areaPlancha)) * 100.0);
    }

    private static Comparator<PiezaCristalTemporal> obtenerComparador(SortStrategy strategy) {
        return switch (strategy) {
            case AREA_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getArea)
                    .thenComparingDouble(PiezaCristalTemporal::getDimensionMayor)
                    .thenComparingDouble(PiezaCristalTemporal::getAncho).reversed();
            case MAX_SIDE_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getDimensionMayor)
                    .thenComparingDouble(PiezaCristalTemporal::getDimensionMenor)
                    .thenComparingDouble(PiezaCristalTemporal::getArea).reversed();
            case PERIMETER_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getPerimetro)
                    .thenComparingDouble(PiezaCristalTemporal::getArea)
                    .thenComparingDouble(PiezaCristalTemporal::getDimensionMayor).reversed();
            case MIN_SIDE_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getDimensionMenor)
                    .thenComparingDouble(PiezaCristalTemporal::getDimensionMayor)
                    .thenComparingDouble(PiezaCristalTemporal::getArea).reversed();
            case WIDTH_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getAncho)
                    .thenComparingDouble(PiezaCristalTemporal::getAlto)
                    .thenComparingDouble(PiezaCristalTemporal::getArea).reversed();
            case HEIGHT_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getAlto)
                    .thenComparingDouble(PiezaCristalTemporal::getAncho)
                    .thenComparingDouble(PiezaCristalTemporal::getArea).reversed();
            case ASPECT_RATIO_DESC -> Comparator.comparingDouble(PiezaCristalTemporal::getAspectRatio)
                    .thenComparingDouble(PiezaCristalTemporal::getArea).reversed();
        };
    }

    private static double redondear2(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private static double redondear4(double valor) {
        return Math.round(valor * 10000.0) / 10000.0;
    }

    // ==========================================
    // Enums
    // ==========================================

    /** Heurística de selección de rectángulo libre dentro de una plancha. */
    enum HeuristicaSeleccion {
        /** Minimiza el área sobrante del rectángulo (Best Area Fit). */
        BEST_AREA_FIT,
        /** Minimiza el lado corto sobrante del rectángulo (Best Short Side Fit). */
        BEST_SHORT_SIDE_FIT
    }

    /** Estrategia de partición guillotina para división del espacio libre sobrante. */
    enum EstrategiaParticion {
        /**
         * MAXAS (Maximum Area Split):
         * Maximiza el área del rectángulo resultante más grande,
         * preservando retazos grandes continuos y reutilizables.
         */
        MAXAS,

        /**
         * MINAS (Minimum Area Split):
         * Para piezas pequeñas, divide el espacio creando el rectángulo sobrante más pequeño posible,
         * forzando a que la merma quede empaquetada en un bloque residual mínimo.
         */
        MINAS
    }

    /** Estrategia de ordenamiento heurístico para semillas. */
    private enum SortStrategy {
        AREA_DESC,
        MAX_SIDE_DESC,
        PERIMETER_DESC,
        MIN_SIDE_DESC,
        WIDTH_DESC,
        HEIGHT_DESC,
        ASPECT_RATIO_DESC
    }

    // ==========================================
    // Clases Internas de Soporte Algorítmico
    // ==========================================

    /**
     * Cromosoma: codifica el orden de inserción de piezas y sus rotaciones.
     */
    private static class Cromosoma {
        int[] orden;
        boolean[] rotaciones;

        Cromosoma(int[] orden, boolean[] rotaciones) {
            this.orden = orden;
            this.rotaciones = rotaciones;
        }

        Cromosoma copiar() {
            return new Cromosoma(
                    Arrays.copyOf(orden, orden.length),
                    Arrays.copyOf(rotaciones, rotaciones.length));
        }
    }

    /**
     * Solución evaluada: un cromosoma decodificado con su fitness y resultado visual.
     */
    private static class Solucion {
        final Cromosoma cromosoma;
        final double fitness;
        final List<PlanchaEnConstruccion> planchas;
        final int totalPlanchas;
        final double areaUtilTotal;

        Solucion(Cromosoma cromosoma, double fitness, List<PlanchaEnConstruccion> planchas,
                 int totalPlanchas, double areaUtilTotal) {
            this.cromosoma = cromosoma;
            this.fitness = fitness;
            this.planchas = planchas;
            this.totalPlanchas = totalPlanchas;
            this.areaUtilTotal = areaUtilTotal;
        }
    }

    /**
     * Pieza de cristal temporal para uso interno del algoritmo.
     */
    private static class PiezaCristalTemporal {
        final int id;
        final String descripcion;
        final double ancho;
        final double alto;

        PiezaCristalTemporal(int id, String descripcion, double ancho, double alto) {
            this.id = id;
            this.descripcion = descripcion;
            this.ancho = ancho;
            this.alto = alto;
        }

        double getAncho() { return ancho; }
        double getAlto() { return alto; }
        double getArea() { return ancho * alto; }
        double getDimensionMayor() { return Math.max(ancho, alto); }
        double getDimensionMenor() { return Math.min(ancho, alto); }
        double getPerimetro() { return 2.0 * (ancho + alto); }

        double getAspectRatio() {
            double menor = getDimensionMenor();
            return menor > EPSILON ? getDimensionMayor() / menor : 1.0;
        }
    }

    /**
     * Rectángulo libre (espacio disponible) dentro de una plancha.
     */
    private static class RectanguloLibre {
        double x, y, w, h;

        RectanguloLibre(double x, double y, double w, double h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }

        boolean cabe(double pieceW, double pieceH) {
            return pieceW <= w + EPSILON && pieceH <= h + EPSILON;
        }

        double getArea() { return w * h; }
    }

    /**
     * Resultado de la búsqueda de la mejor ubicación para una pieza en una plancha.
     */
    private static class MejorUbicacion {
        int indicePlancha;
        int indiceRectangulo;
        boolean rotada;
        double anchoColocado;
        double altoColocado;
        double shortSideFit;
        double longSideFit;
        double leftoverArea;

        MejorUbicacion(int indicePlancha, int indiceRectangulo, boolean rotada,
                       double anchoColocado, double altoColocado,
                       double shortSideFit, double longSideFit, double leftoverArea) {
            this.indicePlancha = indicePlancha;
            this.indiceRectangulo = indiceRectangulo;
            this.rotada = rotada;
            this.anchoColocado = anchoColocado;
            this.altoColocado = altoColocado;
            this.shortSideFit = shortSideFit;
            this.longSideFit = longSideFit;
            this.leftoverArea = leftoverArea;
        }

        /**
         * Compara dos ubicaciones según la heurística seleccionada.
         *
         * <ul>
         *   <li><b>BAF</b>: Minimiza área sobrante → preserva huecos grandes para piezas futuras.</li>
         *   <li><b>BSSF</b>: Minimiza lado corto sobrante → evita tiras delgadas inutilizables.</li>
         * </ul>
         */
        boolean esMejorQue(MejorUbicacion otra, HeuristicaSeleccion heuristica) {
            switch (heuristica) {
                case BEST_AREA_FIT:
                    if (Math.abs(this.leftoverArea - otra.leftoverArea) > EPSILON) {
                        return this.leftoverArea < otra.leftoverArea;
                    }
                    if (Math.abs(this.shortSideFit - otra.shortSideFit) > EPSILON) {
                        return this.shortSideFit < otra.shortSideFit;
                    }
                    if (Math.abs(this.longSideFit - otra.longSideFit) > EPSILON) {
                        return this.longSideFit < otra.longSideFit;
                    }
                    return this.indicePlancha < otra.indicePlancha;

                case BEST_SHORT_SIDE_FIT:
                    if (Math.abs(this.shortSideFit - otra.shortSideFit) > EPSILON) {
                        return this.shortSideFit < otra.shortSideFit;
                    }
                    if (Math.abs(this.longSideFit - otra.longSideFit) > EPSILON) {
                        return this.longSideFit < otra.longSideFit;
                    }
                    if (Math.abs(this.leftoverArea - otra.leftoverArea) > EPSILON) {
                        return this.leftoverArea < otra.leftoverArea;
                    }
                    return this.indicePlancha < otra.indicePlancha;

                default:
                    return this.leftoverArea < otra.leftoverArea;
            }
        }
    }

    /**
     * Plancha de vidrio en construcción con piezas ubicadas y rectángulos libres
     * para la heurística de guillotina.
     */
    private static class PlanchaEnConstruccion {
        private final int numeroPlancha;
        private final double anchoPlancha;
        private final double altoPlancha;
        final List<PiezaVidrioUbicadaDTO> piezasUbicadas = new ArrayList<>();
        final List<RectanguloLibre> rectangulosLibres = new ArrayList<>();

        PlanchaEnConstruccion(int numeroPlancha, double anchoPlancha, double altoPlancha) {
            this.numeroPlancha = numeroPlancha;
            this.anchoPlancha = anchoPlancha;
            this.altoPlancha = altoPlancha;
            this.rectangulosLibres.add(new RectanguloLibre(0.0, 0.0, anchoPlancha, altoPlancha));
        }

        /**
         * Busca el mejor rectángulo libre en esta plancha según la heurística especificada.
         */
        MejorUbicacion encontrarMejorRectangulo(
                double pieceW, double pieceH, boolean rotada, int indicePlancha,
                HeuristicaSeleccion heuristica) {
            MejorUbicacion mejor = null;

            for (int r = 0; r < rectangulosLibres.size(); r++) {
                RectanguloLibre rect = rectangulosLibres.get(r);
                if (rect.cabe(pieceW, pieceH)) {
                    double remW = Math.max(0.0, rect.w - pieceW);
                    double remH = Math.max(0.0, rect.h - pieceH);
                    double ssf = Math.min(remW, remH);
                    double lsf = Math.max(remW, remH);
                    double areaSobrante = rect.getArea() - (pieceW * pieceH);

                    MejorUbicacion candidata = new MejorUbicacion(
                            indicePlancha, r, rotada, pieceW, pieceH, ssf, lsf, areaSobrante);

                    if (mejor == null || candidata.esMejorQue(mejor, heuristica)) {
                        mejor = candidata;
                    }
                }
            }

            return mejor;
        }

        /**
         * Ubica una pieza en el rectángulo libre seleccionado y particiona el sobrante
         * con la estrategia de guillotina especificada (MINAS o MAXAS).
         *
         * <p><b>Precisión del Kerf (Ancho de Sierra):</b> El margen de sierra solo se aplica
         * a líneas de corte internas divisorias. NUNCA se aplica a los bordes exteriores de la
         * plancha matriz (x=0, y=0, x=anchoPlancha, y=altoPlancha), para no robar área útil artificialmente.</p>
         */
        void ubicarPiezaYPartir(
                PiezaCristalTemporal pieza,
                MejorUbicacion ubicacion,
                EstrategiaParticion particion) {

            RectanguloLibre rect = rectangulosLibres.remove(ubicacion.indiceRectangulo);

            double posX = rect.x;
            double posY = rect.y;
            double pieceW = ubicacion.anchoColocado;
            double pieceH = ubicacion.altoColocado;
            double areaM2 = redondear4((pieceW * pieceH) / 1_000_000.0);

            piezasUbicadas.add(PiezaVidrioUbicadaDTO.builder()
                    .idPieza(pieza.id)
                    .descripcion(pieza.descripcion)
                    .x(redondear2(posX))
                    .y(redondear2(posY))
                    .ancho(redondear2(pieceW))
                    .alto(redondear2(pieceH))
                    .rotada(ubicacion.rotada)
                    .areaM2(areaM2)
                    .build());

            // Margen de sierra (kerf) entre cortes internos:
            // Si la pieza alcanza el borde exterior derecho o superior de la plancha,
            // no se descuenta kerf en dicho extremo exterior.
            double kerfInternoX = (posX + pieceW < this.anchoPlancha - EPSILON) ? KERF_CORTE_MM : 0.0;
            double kerfInternoY = (posY + pieceH < this.altoPlancha - EPSILON) ? KERF_CORTE_MM : 0.0;

            double remW = Math.max(0.0, rect.w - pieceW - kerfInternoX);
            double remH = Math.max(0.0, rect.h - pieceH - kerfInternoY);

            // Corte Horizontal produce:
            // top1 = (rect.w, remH), right1 = (remW, pieceH)
            double top1Area = rect.w * remH;
            double right1Area = remW * pieceH;

            // Corte Vertical produce:
            // right2 = (remW, rect.h), top2 = (pieceW, remH)
            double right2Area = remW * rect.h;
            double top2Area = pieceW * remH;

            boolean splitHorizontal;

            if (particion == EstrategiaParticion.MINAS) {
                // MINAS (Minimum Area Split):
                // Minimiza el área del rectángulo sobrante más pequeño posible,
                // forzando a que la merma quede empaquetada herméticamente.
                double minArea1 = Math.min(top1Area, right1Area);
                double minArea2 = Math.min(right2Area, top2Area);

                if (Math.abs(minArea1 - minArea2) > EPSILON) {
                    splitHorizontal = minArea1 < minArea2;
                } else {
                    double maxArea1 = Math.max(top1Area, right1Area);
                    double maxArea2 = Math.max(right2Area, top2Area);
                    if (Math.abs(maxArea1 - maxArea2) > EPSILON) {
                        splitHorizontal = maxArea1 > maxArea2;
                    } else {
                        splitHorizontal = remH <= remW;
                    }
                }
            } else {
                // MAXAS (Maximum Area Split):
                // Maximiza el área del rectángulo resultante más grande posible,
                // para preservar retazos útiles continuos.
                double maxArea1 = Math.max(top1Area, right1Area);
                double maxArea2 = Math.max(right2Area, top2Area);

                if (Math.abs(maxArea1 - maxArea2) > EPSILON) {
                    splitHorizontal = maxArea1 > maxArea2;
                } else {
                    double minDim1 = (top1Area >= right1Area)
                            ? Math.min(rect.w, remH) : Math.min(remW, pieceH);
                    double minDim2 = (right2Area >= top2Area)
                            ? Math.min(remW, rect.h) : Math.min(pieceW, remH);

                    if (Math.abs(minDim1 - minDim2) > EPSILON) {
                        splitHorizontal = minDim1 > minDim2;
                    } else {
                        splitHorizontal = remH <= remW;
                    }
                }
            }

            double startRightX = posX + pieceW + kerfInternoX;
            double startTopY = posY + pieceH + kerfInternoY;

            if (splitHorizontal) {
                if (rect.w > EPSILON && remH > EPSILON) {
                    rectangulosLibres.add(new RectanguloLibre(posX, startTopY, rect.w, remH));
                }
                if (remW > EPSILON && pieceH > EPSILON) {
                    rectangulosLibres.add(new RectanguloLibre(startRightX, posY, remW, pieceH));
                }
            } else {
                if (remW > EPSILON && rect.h > EPSILON) {
                    rectangulosLibres.add(new RectanguloLibre(startRightX, posY, remW, rect.h));
                }
                if (pieceW > EPSILON && remH > EPSILON) {
                    rectangulosLibres.add(new RectanguloLibre(posX, startTopY, pieceW, remH));
                }
            }

            // Consolidación de retazos: fusionar rectángulos adyacentes (Maximal Rectangles)
            consolidarRectangulosLibres();
        }

        /**
         * Consolida rectángulos libres adyacentes que comparten un lado completo
         * y elimina rectángulos contenidos dentro de otros para obtener rectángulos máximos.
         */
        private void consolidarRectangulosLibres() {
            // Paso 1: Fusionar rectángulos adyacentes colineales
            boolean fusionado;
            do {
                fusionado = false;
                for (int i = 0; i < rectangulosLibres.size(); i++) {
                    RectanguloLibre a = rectangulosLibres.get(i);
                    for (int j = i + 1; j < rectangulosLibres.size(); j++) {
                        RectanguloLibre b = rectangulosLibres.get(j);

                        // Fusión vertical: misma X y mismo ancho W
                        if (Math.abs(a.x - b.x) < EPSILON && Math.abs(a.w - b.w) < EPSILON) {
                            if (Math.abs(a.y + a.h - b.y) < EPSILON) {
                                a.h += b.h;
                                rectangulosLibres.remove(j);
                                fusionado = true;
                                break;
                            } else if (Math.abs(b.y + b.h - a.y) < EPSILON) {
                                a.y = b.y;
                                a.h += b.h;
                                rectangulosLibres.remove(j);
                                fusionado = true;
                                break;
                            }
                        }

                        // Fusión horizontal: misma Y y mismo alto H
                        if (Math.abs(a.y - b.y) < EPSILON && Math.abs(a.h - b.h) < EPSILON) {
                            if (Math.abs(a.x + a.w - b.x) < EPSILON) {
                                a.w += b.w;
                                rectangulosLibres.remove(j);
                                fusionado = true;
                                break;
                            } else if (Math.abs(b.x + b.w - a.x) < EPSILON) {
                                a.x = b.x;
                                a.w += b.w;
                                rectangulosLibres.remove(j);
                                fusionado = true;
                                break;
                            }
                        }
                    }
                    if (fusionado) break;
                }
            } while (fusionado);

            // Paso 2: Eliminar rectángulos completamente contenidos dentro de otro
            for (int i = rectangulosLibres.size() - 1; i >= 0; i--) {
                RectanguloLibre a = rectangulosLibres.get(i);
                for (int j = 0; j < rectangulosLibres.size(); j++) {
                    if (i == j) continue;
                    RectanguloLibre b = rectangulosLibres.get(j);
                    // ¿a está contenido en b?
                    if (a.x >= b.x - EPSILON && a.y >= b.y - EPSILON
                            && a.x + a.w <= b.x + b.w + EPSILON
                            && a.y + a.h <= b.y + b.h + EPSILON) {
                        rectangulosLibres.remove(i);
                        break;
                    }
                }
            }
        }

        PlanchaVidrioOptimizadaDTO construirDTO() {
            double areaPlanchaM2 = redondear4((anchoPlancha * altoPlancha) / 1_000_000.0);
            double areaUtilM2 = redondear4(piezasUbicadas.stream().mapToDouble(PiezaVidrioUbicadaDTO::getAreaM2).sum());
            double areaDesperdicioM2 = redondear4(Math.max(0.0, areaPlanchaM2 - areaUtilM2));
            double porcentajeAprovechamiento = areaPlanchaM2 > 0
                    ? redondear2((areaUtilM2 / areaPlanchaM2) * 100.0)
                    : 0.0;

            List<RetazoVidrioDTO> retazosDTO = new ArrayList<>();
            int idRetazo = 1;

            for (RectanguloLibre rect : rectangulosLibres) {
                if (rect.w > EPSILON && rect.h > EPSILON) {
                    double retazoAreaM2 = redondear4((rect.w * rect.h) / 1_000_000.0);
                    boolean reutilizable = rect.w >= 200.0 && rect.h >= 200.0 && retazoAreaM2 >= 0.05;

                    retazosDTO.add(RetazoVidrioDTO.builder()
                            .idRetazo(idRetazo++)
                            .x(redondear2(rect.x))
                            .y(redondear2(rect.y))
                            .ancho(redondear2(rect.w))
                            .alto(redondear2(rect.h))
                            .areaM2(retazoAreaM2)
                            .reutilizable(reutilizable)
                            .build());
                }
            }

            return PlanchaVidrioOptimizadaDTO.builder()
                    .numeroPlancha(numeroPlancha)
                    .anchoPlanchaMm(redondear2(anchoPlancha))
                    .altoPlanchaMm(redondear2(altoPlancha))
                    .totalPiezas(piezasUbicadas.size())
                    .areaPlanchaM2(areaPlanchaM2)
                    .areaUtilM2(areaUtilM2)
                    .areaDesperdicioM2(areaDesperdicioM2)
                    .porcentajeAprovechamiento(porcentajeAprovechamiento)
                    .piezas(new ArrayList<>(piezasUbicadas))
                    .retazos(retazosDTO)
                    .build();
        }
    }
}
