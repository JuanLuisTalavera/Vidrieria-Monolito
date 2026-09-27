package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OptimizadorVidrioServiceTest {

    private OptimizadorVidrioService service;

    @BeforeEach
    void setUp() {
        service = new OptimizadorVidrioService();
    }

    @Test
    @DisplayName("Debe empaquetar correctamente múltiples piezas en una sola plancha con corte sin merma (kerf = 0)")
    void testEmpaquetadoUnaPlancha() {
        // Plancha de 2500 x 1800 mm
        // Piezas:
        // 2 de 1000 x 800 mm
        // 2 de 500 x 800 mm
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .permitirRotacion(true)
                .piezas(Arrays.asList(
                        PiezaCristalDTO.builder()
                                .descripcion("Ventana Grande")
                                .anchoMm(1000.0)
                                .altoMm(800.0)
                                .cantidad(2)
                                .build(),
                        PiezaCristalDTO.builder()
                                .descripcion("Ventana Chica")
                                .anchoMm(500.0)
                                .altoMm(800.0)
                                .cantidad(2)
                                .build()
                ))
                .build();

        java.util.concurrent.atomic.AtomicBoolean detener = new java.util.concurrent.atomic.AtomicBoolean(false);
        new Thread(() -> {
            try { Thread.sleep(250); } catch (InterruptedException ignored) {}
            detener.set(true);
        }).start();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request, detener, (p, i, pl, ap) -> {});

        assertNotNull(response);
        assertEquals(1, response.getTotalPlanchas(), "Todas las piezas deben caber en 1 plancha");
        assertEquals(4, response.getTotalPiezasSolicitadas());
        assertEquals(4, response.getTotalPiezasUbicadas());
        assertEquals(2500.0, response.getAnchoPlanchaMm());
        assertEquals(1800.0, response.getAltoPlanchaMm());

        PlanchaVidrioOptimizadaDTO plancha = response.getPlanchas().get(0);
        assertEquals(1, plancha.getNumeroPlancha());
        assertEquals(4, plancha.getPiezas().size());

        // Verificar que cada pieza esté dentro de los límites de la plancha
        for (PiezaVidrioUbicadaDTO pieza : plancha.getPiezas()) {
            assertTrue(pieza.getX() >= 0.0, "X debe ser >= 0");
            assertTrue(pieza.getY() >= 0.0, "Y debe ser >= 0");
            assertTrue(pieza.getX() + pieza.getAncho() <= 2500.0 + 0.01,
                    "Pieza no debe desbordar el ancho de la plancha");
            assertTrue(pieza.getY() + pieza.getAlto() <= 1800.0 + 0.01,
                    "Pieza no debe desbordar el alto de la plancha");
        }

        // Verificar rigurosamente que NINGUNA pieza se solape con otra
        verificarNoSolapamiento(plancha.getPiezas());

        // Verificación de métricas
        // Área piezas = 2 * (1.0 * 0.8) + 2 * (0.5 * 0.8) = 1.6 + 0.8 = 2.4 m²
        // Área plancha = 2.5 * 1.8 = 4.5 m²
        // Aprovechamiento = 2.4 / 4.5 * 100 = 53.33%
        assertEquals(4.5, response.getTotalAreaPlanchasM2(), 0.01);
        assertEquals(2.4, response.getTotalAreaUtilM2(), 0.01);
        assertEquals(2.1, response.getTotalAreaDesperdicioM2(), 0.01);
        assertEquals(53.33, response.getPorcentajeAprovechamiento(), 0.1);
        assertTrue(response.getTotalAreaDesperdicioM2() > 0);

        // Verificar retazos
        assertNotNull(plancha.getRetazos());
        assertFalse(plancha.getRetazos().isEmpty());
    }

    @Test
    @DisplayName("Debe abrir múltiples planchas cuando la cantidad de piezas excede el área de una sola plancha")
    void testMultiplesPlanchas() {
        // Plancha de 2000 x 1000 mm = 2.0 m²
        // Pedimos 5 piezas de 1000 x 800 mm = 0.8 m² cada una. Total = 4.0 m²
        // Mínimo requiere 3 planchas (ya que en 2000x1000 caben como máximo 2 de 1000x800 por plancha)
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2000.0)
                .altoPlancha(1000.0)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Paño fijo")
                                .anchoMm(1000.0)
                                .altoMm(800.0)
                                .cantidad(5)
                                .build()
                ))
                .build();

        java.util.concurrent.atomic.AtomicBoolean detener = new java.util.concurrent.atomic.AtomicBoolean(false);
        new Thread(() -> {
            try { Thread.sleep(250); } catch (InterruptedException ignored) {}
            detener.set(true);
        }).start();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request, detener, (p, i, pl, ap) -> {});

        assertNotNull(response);
        assertEquals(5, response.getTotalPiezasUbicadas());
        assertTrue(response.getTotalPlanchas() >= 3, "Debe requerir al menos 3 planchas");

        // Verificar que en cada plancha no haya solapamiento
        for (PlanchaVidrioOptimizadaDTO plancha : response.getPlanchas()) {
            verificarNoSolapamiento(plancha.getPiezas());
        }
    }

    @Test
    @DisplayName("Debe permitir rotar piezas de 90° cuando permitirRotacion es true para encajar")
    void testRotacionPiezas() {
        // Plancha de 2000 x 1000 mm
        // Pieza de 800 x 1500 mm.
        // Directo: ancho 800 <= 2000, alto 1500 > 1000 (no cabe directo)
        // Rotada 90°: ancho 1500 <= 2000, alto 800 <= 1000 (cabe perfectamente rotada)
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2000.0)
                .altoPlancha(1000.0)
                .permitirRotacion(true)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Vidrio Vertical")
                                .anchoMm(800.0)
                                .altoMm(1500.0)
                                .cantidad(1)
                                .build()
                ))
                .build();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request);

        assertNotNull(response);
        assertEquals(1, response.getTotalPlanchas());
        assertEquals(1, response.getTotalPiezasUbicadas());

        PiezaVidrioUbicadaDTO piezaUbicada = response.getPlanchas().get(0).getPiezas().get(0);
        assertTrue(piezaUbicada.getRotada(), "La pieza debió ser rotada para poder caber en la plancha");
        assertEquals(1500.0, piezaUbicada.getAncho());
        assertEquals(800.0, piezaUbicada.getAlto());
    }

    @Test
    @DisplayName("Debe lanzar excepción si una pieza no cabe y no se permite rotación")
    void testNoRotacionLanzaExcepcionSiExcedeAlto() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2000.0)
                .altoPlancha(1000.0)
                .permitirRotacion(false)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Vidrio no rotable")
                                .anchoMm(800.0)
                                .altoMm(1500.0)
                                .cantidad(1)
                                .build()
                ))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(request));
        assertTrue(ex.getMessage().contains("excede las dimensiones"));
    }

    @Test
    @DisplayName("Debe lanzar excepción si una pieza supera las dimensiones máximas incluso rotada")
    void testPiezaExcedeDimensionesTotales() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Vidrio Gigante")
                                .anchoMm(3000.0)
                                .altoMm(2000.0)
                                .cantidad(1)
                                .build()
                ))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(request));
        assertTrue(ex.getMessage().contains("excede las dimensiones de la plancha"));
    }

    @Test
    @DisplayName("Debe retornar respuesta vacía sin error cuando no hay piezas")
    void testListaVacia() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.emptyList())
                .build();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request);
        assertNotNull(response);
        assertEquals(0, response.getTotalPlanchas());
        assertEquals(0, response.getTotalPiezasSolicitadas());
        assertEquals(0.0, response.getTotalAreaUtilM2());
        assertEquals(0.0, response.getPorcentajeAprovechamiento());
    }

    @Test
    @DisplayName("Debe aceptar compatibilidad con getters getAncho y getAlto en PiezaCristalDTO")
    void testCompatibilidadGettersAnchoAlto() {
        PiezaCristalDTO pieza = new PiezaCristalDTO();
        pieza.setAncho(1200.0);
        pieza.setAlto(600.0);
        pieza.setCantidad(2);

        assertEquals(1200.0, pieza.getAnchoMm());
        assertEquals(600.0, pieza.getAltoMm());
        assertEquals(1200.0, pieza.getAncho());
        assertEquals(600.0, pieza.getAlto());

        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(pieza))
                .build();

        java.util.concurrent.atomic.AtomicBoolean detener = new java.util.concurrent.atomic.AtomicBoolean(false);
        new Thread(() -> {
            try { Thread.sleep(250); } catch (InterruptedException ignored) {}
            detener.set(true);
        }).start();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request, detener, (p, i, pl, ap) -> {});
        assertEquals(1, response.getTotalPlanchas());
        assertEquals(2, response.getTotalPiezasUbicadas());
    }

    @Test
    @DisplayName("Debe lanzar excepción si el ancho de la plancha es nulo o menor/igual a cero")
    void testAnchoPlanchaInvalido() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(0.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(PiezaCristalDTO.builder().anchoMm(500.0).altoMm(500.0).build()))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(request));
        assertTrue(ex.getMessage().contains("ancho de la plancha debe ser un valor mayor a cero"));
    }

    @Test
    @DisplayName("Debe lanzar excepción si el alto de la plancha es nulo o menor/igual a cero")
    void testAltoPlanchaInvalido() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(null)
                .piezas(Collections.singletonList(PiezaCristalDTO.builder().anchoMm(500.0).altoMm(500.0).build()))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(request));
        assertTrue(ex.getMessage().contains("alto de la plancha debe ser un valor mayor a cero"));
    }

    @Test
    @DisplayName("Debe lanzar excepción si una pieza tiene dimensiones nulas o menores/iguales a cero")
    void testPiezaDimensionesInvalidas() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Ventana inválida")
                                .anchoMm(0.0)
                                .altoMm(500.0)
                                .build()
                ))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(request));
        assertTrue(ex.getMessage().contains("ancho inválido"));

        OptimizadorVidrioRequestDTO requestAltoNulo = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder()
                                .descripcion("Ventana con alto nulo")
                                .anchoMm(500.0)
                                .altoMm(null)
                                .build()
                ))
                .build();

        IllegalArgumentException exAlto = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(requestAltoNulo));
        assertTrue(exAlto.getMessage().contains("alto inválido"));
    }

    @Test
    @DisplayName("Debe lanzar excepción si una pieza en la lista es nula")
    void testPiezaNula() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .piezas(Collections.singletonList(null))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(request));
        assertTrue(ex.getMessage().contains("no puede ser nula"));
    }

    @Test
    @DisplayName("Debe lanzar excepción si el request es nulo")
    void testRequestNulo() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.optimizarCorteVidrio(null));
        assertTrue(ex.getMessage().contains("no puede ser nula"));
    }

    @Test
    @DisplayName("Debe empaquetar con 100% de aprovechamiento en una sola plancha utilizando Multi-Pass/GRASP")
    void testMultiPassMejoraAprovechamientoYReducePlanchas() {
        // Plancha 2500 x 1800 mm = 4.5 m²
        // Piezas:
        // 1 de 1000 x 1800 mm = 1.8 m²
        // 1 de 1500 x 1000 mm = 1.5 m²
        // 1 de 1500 x 800 mm = 1.2 m²
        // Total = 4.5 m² = 100%
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .permitirRotacion(true)
                .piezas(Arrays.asList(
                        PiezaCristalDTO.builder().descripcion("Vidrio Alto").anchoMm(1000.0).altoMm(1800.0).cantidad(1).build(),
                        PiezaCristalDTO.builder().descripcion("Vidrio Medio").anchoMm(1500.0).altoMm(1000.0).cantidad(1).build(),
                        PiezaCristalDTO.builder().descripcion("Vidrio Bajo").anchoMm(1500.0).altoMm(800.0).cantidad(1).build()
                ))
                .build();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request);

        assertNotNull(response);
        assertEquals(1, response.getTotalPlanchas(), "Todas las piezas deben caber en exactamente 1 plancha");
        assertEquals(3, response.getTotalPiezasUbicadas());
        assertEquals(100.0, response.getPorcentajeAprovechamiento(), 0.01);
        assertEquals(0.0, response.getTotalAreaDesperdicioM2(), 0.01);

        PlanchaVidrioOptimizadaDTO plancha = response.getPlanchas().get(0);
        verificarNoSolapamiento(plancha.getPiezas());
    }

    @Test
    @DisplayName("Debe aplicar regla Guillotine Split Maximal Rectangle (MAXAS) preservando el rectángulo sobrante más grande")
    void testGuillotineSplitMaximalRectangle() {
        // Plancha de 2500 x 1800 mm
        // Pieza de 1500 x 800 mm colocada en (0,0)
        // Corte horizontal deja: (0, 800, 2500, 1000) de área 2.5 m² y (1500, 0, 1000, 800) de área 0.8 m²
        // Corte vertical dejaría: (1500, 0, 1000, 1800) de área 1.8 m² y (0, 800, 1500, 1000) de área 1.5 m²
        // MAXAS elige corte horizontal porque 2.5 m² > 1.8 m²
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .permitirRotacion(false)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder().descripcion("Pieza única").anchoMm(1500.0).altoMm(800.0).cantidad(1).build()
                ))
                .build();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request);

        assertNotNull(response);
        assertEquals(1, response.getTotalPlanchas());
        PlanchaVidrioOptimizadaDTO plancha = response.getPlanchas().get(0);

        // Debe existir un retazo continuo con área de al menos 2.5 m² (2500 x 1000)
        boolean existeRetazoGrande = plancha.getRetazos().stream()
                .anyMatch(r -> r.getAreaM2() >= 2.5 - 0.01 && (r.getAncho() >= 2500.0 - 0.01 || r.getAlto() >= 2500.0 - 0.01));

        assertTrue(existeRetazoGrande, "MAXAS debe generar el retazo continuo más grande posible (2500 x 1000 mm)");
    }

    @Test
    @DisplayName("Debe permitir detener la optimización asíncrona de inmediato mediante el flag atómico de interrupción")
    void testInterrupcionAsincronaStopFlag() {
        // Generar 16 piezas surtidas
        List<PiezaCristalDTO> piezas = Arrays.asList(
                PiezaCristalDTO.builder().descripcion("P1").anchoMm(900.0).altoMm(600.0).cantidad(3).build(),
                PiezaCristalDTO.builder().descripcion("P2").anchoMm(1200.0).altoMm(400.0).cantidad(4).build(),
                PiezaCristalDTO.builder().descripcion("P3").anchoMm(700.0).altoMm(700.0).cantidad(3).build(),
                PiezaCristalDTO.builder().descripcion("P4").anchoMm(500.0).altoMm(800.0).cantidad(6).build()
        );

        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .permitirRotacion(true)
                .piezas(piezas)
                .build();

        java.util.concurrent.atomic.AtomicBoolean detener = new java.util.concurrent.atomic.AtomicBoolean(false);
        new Thread(() -> {
            try {
                Thread.sleep(150);
            } catch (InterruptedException ignored) {}
            detener.set(true);
        }).start();

        long start = System.currentTimeMillis();
        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request, detener, (p, i, pl, ap) -> {});
        long duracion = System.currentTimeMillis() - start;

        assertNotNull(response);
        assertEquals(16, response.getTotalPiezasUbicadas());
        assertTrue(duracion < 2500, String.format("La detención cooperativa debe actuar de inmediato. Tardó %d ms", duracion));

        for (PlanchaVidrioOptimizadaDTO plancha : response.getPlanchas()) {
            verificarNoSolapamiento(plancha.getPiezas());
        }
    }

    @Test
    @DisplayName("Debe asegurar precisión milimétrica del Kerf: sin márgenes en los bordes exteriores de la plancha matriz")
    void testPrecisionKerfBordesExteriores() {
        // Plancha de 2000 x 1000 mm
        // 2 piezas de 1000 x 1000 mm (deben llenar exactamente la plancha al 100%)
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2000.0)
                .altoPlancha(1000.0)
                .permitirRotacion(false)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder().descripcion("Mitad").anchoMm(1000.0).altoMm(1000.0).cantidad(2).build()
                ))
                .build();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request);
        assertNotNull(response);
        assertEquals(1, response.getTotalPlanchas());
        assertEquals(2, response.getTotalPiezasUbicadas());
        assertEquals(100.0, response.getPorcentajeAprovechamiento(), 0.01);

        PlanchaVidrioOptimizadaDTO plancha = response.getPlanchas().get(0);
        PiezaVidrioUbicadaDTO p1 = plancha.getPiezas().get(0);
        PiezaVidrioUbicadaDTO p2 = plancha.getPiezas().get(1);

        double minX = Math.min(p1.getX(), p2.getX());
        double maxX = Math.max(p1.getX() + p1.getAncho(), p2.getX() + p2.getAncho());
        double minY = Math.min(p1.getY(), p2.getY());
        double maxY = Math.max(p1.getY() + p1.getAlto(), p2.getY() + p2.getAlto());

        assertEquals(0.0, minX, 0.01, "No debe haber margen en el borde exterior izquierdo");
        assertEquals(0.0, minY, 0.01, "No debe haber margen en el borde exterior inferior");
        assertEquals(2000.0, maxX, 0.01, "Debe alcanzar el borde exterior derecho sin margen robado");
        assertEquals(1000.0, maxY, 0.01, "Debe alcanzar el borde exterior superior sin margen robado");
    }

    @Test
    @DisplayName("Debe evaluar estrategias duales de partición MINAS y MAXAS garantizando cortes guillotina válidos")
    void testParticionDualMinasYMaxas() {
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .permitirRotacion(true)
                .piezas(Arrays.asList(
                        PiezaCristalDTO.builder().descripcion("Pieza Pequeña").anchoMm(300.0).altoMm(200.0).cantidad(2).build(),
                        PiezaCristalDTO.builder().descripcion("Pieza Mediana").anchoMm(1200.0).altoMm(800.0).cantidad(1).build()
                ))
                .build();

        java.util.concurrent.atomic.AtomicBoolean detener = new java.util.concurrent.atomic.AtomicBoolean(false);
        new Thread(() -> {
            try {
                Thread.sleep(200);
            } catch (InterruptedException ignored) {}
            detener.set(true);
        }).start();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request, detener, (p, i, pl, ap) -> {});
        assertNotNull(response);
        assertEquals(1, response.getTotalPlanchas());
        assertEquals(3, response.getTotalPiezasUbicadas());

        PlanchaVidrioOptimizadaDTO plancha = response.getPlanchas().get(0);
        verificarNoSolapamiento(plancha.getPiezas());
        assertFalse(plancha.getRetazos().isEmpty(), "Deben generarse retazos libres tras las particiones");
    }

    @Test
    @DisplayName("Debe manejar correctamente piezas idénticas con shuffling y rotación sin ningún solapamiento")
    void testShufflingPiezasIdenticasSinSolapamiento() {
        // 10 piezas idénticas de 600 x 500 mm
        OptimizadorVidrioRequestDTO request = OptimizadorVidrioRequestDTO.builder()
                .anchoPlancha(2500.0)
                .altoPlancha(1800.0)
                .permitirRotacion(true)
                .piezas(Collections.singletonList(
                        PiezaCristalDTO.builder().descripcion("Pieza Modular").anchoMm(600.0).altoMm(500.0).cantidad(10).build()
                ))
                .build();

        java.util.concurrent.atomic.AtomicBoolean detener = new java.util.concurrent.atomic.AtomicBoolean(false);
        new Thread(() -> {
            try {
                Thread.sleep(200);
            } catch (InterruptedException ignored) {}
            detener.set(true);
        }).start();

        OptimizadorVidrioResponseDTO response = service.optimizarCorteVidrio(request, detener, (p, i, pl, ap) -> {});

        assertNotNull(response);
        assertEquals(10, response.getTotalPiezasUbicadas());
        assertEquals(1, response.getTotalPlanchas());

        for (PlanchaVidrioOptimizadaDTO plancha : response.getPlanchas()) {
            verificarNoSolapamiento(plancha.getPiezas());
        }
    }

    /**
     * Utilidad para verificar geométricamente que no existan solapamientos entre piezas.
     */
    private void verificarNoSolapamiento(List<PiezaVidrioUbicadaDTO> piezas) {
        for (int i = 0; i < piezas.size(); i++) {
            PiezaVidrioUbicadaDTO p1 = piezas.get(i);
            double r1_x1 = p1.getX();
            double r1_y1 = p1.getY();
            double r1_x2 = p1.getX() + p1.getAncho();
            double r1_y2 = p1.getY() + p1.getAlto();

            for (int j = i + 1; j < piezas.size(); j++) {
                PiezaVidrioUbicadaDTO p2 = piezas.get(j);
                double r2_x1 = p2.getX();
                double r2_y1 = p2.getY();
                double r2_x2 = p2.getX() + p2.getAncho();
                double r2_y2 = p2.getY() + p2.getAlto();

                // Verificar intersección de rectángulos
                boolean solapamientoX = r1_x1 < r2_x2 - 0.001 && r1_x2 > r2_x1 + 0.001;
                boolean solapamientoY = r1_y1 < r2_y2 - 0.001 && r1_y2 > r2_y1 + 0.001;

                assertFalse(solapamientoX && solapamientoY,
                        String.format("Solapamiento detectado entre pieza %d (%s) y pieza %d (%s)",
                                p1.getIdPieza(), p1.getDescripcion(), p2.getIdPieza(), p2.getDescripcion()));
            }
        }
    }
}
