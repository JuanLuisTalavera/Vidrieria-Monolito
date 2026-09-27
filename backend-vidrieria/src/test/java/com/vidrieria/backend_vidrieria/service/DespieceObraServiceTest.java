package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.DespieceObraRequestDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.PiezaAluminioDTO;
import com.vidrieria.backend_vidrieria.dto.PiezaCristalDTO;
import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.entity.FormulaDespiece;
import com.vidrieria.backend_vidrieria.entity.Material;
import com.vidrieria.backend_vidrieria.entity.SistemaCarpinteria;
import com.vidrieria.backend_vidrieria.entity.TipoEstructura;
import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.repository.FormulaDespieceRepository;
import com.vidrieria.backend_vidrieria.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.repository.SistemaCarpinteriaRepository;
import com.vidrieria.backend_vidrieria.repository.TipoVidrioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DespieceObraServiceTest {

    @Mock
    private TipoVidrioRepository tipoVidrioRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private SistemaCarpinteriaRepository sistemaCarpinteriaRepository;

    @Mock
    private FormulaDespieceRepository formulaDespieceRepository;

    private CorteVarillaService corteVarillaService;
    private DespieceObraService despieceObraService;

    @BeforeEach
    void setUp() {
        corteVarillaService = new CorteVarillaService();
        despieceObraService = new DespieceObraService(
                corteVarillaService,
                tipoVidrioRepository,
                materialRepository,
                sistemaCarpinteriaRepository,
                formulaDespieceRepository
        );
    }

    @Test
    @DisplayName("Debe calcular exactamente el despiece de Serie 20 (2 Hojas) consultando la BD y fórmulas")
    void testDespieceSerie20_2H() {
        // 1. Configurar mock de SistemaCarpinteria
        SistemaCarpinteria sistemaS20 = SistemaCarpinteria.builder()
                .idSistema(1)
                .codigo("S20_2H")
                .nombre("Ventana Corrediza Serie 20 (2 Hojas)")
                .tipoEstructura("VENTANA_SERIE_20_2H")
                .build();

        when(sistemaCarpinteriaRepository.findByTipoEstructura("VENTANA_SERIE_20_2H"))
                .thenReturn(Optional.of(sistemaS20));

        // 2. Fórmulas de Serie 20
        List<FormulaDespiece> formulasS20 = List.of(
                FormulaDespiece.builder().idFormula(1).idSistema(1).tipoElemento("ALUMINIO").cantidadPiezas(1).formulaLargo("ANCHO - 2").descripcion("Riel Superior S20").build(),
                FormulaDespiece.builder().idFormula(2).idSistema(1).tipoElemento("ALUMINIO").cantidadPiezas(1).formulaLargo("ANCHO - 2").descripcion("Riel Inferior S20").build(),
                FormulaDespiece.builder().idFormula(3).idSistema(1).tipoElemento("ALUMINIO").cantidadPiezas(2).formulaLargo("ALTO").descripcion("Jamba Lateral S20").build(),
                FormulaDespiece.builder().idFormula(4).idSistema(1).tipoElemento("ALUMINIO").cantidadPiezas(4).formulaLargo("ALTO - 35").descripcion("Parante / Traslape de Hoja S20").build(),
                FormulaDespiece.builder().idFormula(5).idSistema(1).tipoElemento("ALUMINIO").cantidadPiezas(4).formulaLargo("(ANCHO / 2) - 20").descripcion("Zócalo / Cabezal de Hoja S20").build(),
                FormulaDespiece.builder().idFormula(6).idSistema(1).tipoElemento("VIDRIO").cantidadPiezas(2).formulaLargo("(ANCHO / 2) - 15").formulaAlto("ALTO - 75").descripcion("Cristal Templado 6mm").build(),
                FormulaDespiece.builder().idFormula(7).idSistema(1).tipoElemento("ACCESORIO").cantidadPiezas(4).descripcion("Garrucha / Rueda simple Serie 20").build(),
                FormulaDespiece.builder().idFormula(8).idSistema(1).tipoElemento("ACCESORIO").cantidadPiezas(1).descripcion("Seguro Caracol para Serie 20").build(),
                FormulaDespiece.builder().idFormula(9).idSistema(1).tipoElemento("ACCESORIO").cantidadPiezas(1).formulaLargo("((4 * (ALTO - 35)) + (4 * ((ANCHO / 2) - 20))) / 1000 * 1.1").descripcion("Felpa perimétrica hermética").build()
        );

        when(formulaDespieceRepository.findByIdSistema(1)).thenReturn(formulasS20);

        // 3. Mockear Materiales en MaterialRepository
        Material rielSup = Material.builder().nombre("Riel Superior S20").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(65.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();
        Material rielInf = Material.builder().nombre("Riel Inferior S20").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(65.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();
        Material jamba = Material.builder().nombre("Jamba Lateral S20").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(65.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();
        Material parante = Material.builder().nombre("Parante / Traslape de Hoja S20").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(65.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();
        Material zocalo = Material.builder().nombre("Zócalo / Cabezal de Hoja S20").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(65.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();

        Material garrucha = Material.builder().nombre("Garrucha / Rueda simple Serie 20").tipoMaterial(CategoriaMaterial.ACCESORIO).costoDefectoUnitario(BigDecimal.valueOf(5.0)).build();
        Material seguro = Material.builder().nombre("Seguro Caracol para Serie 20").tipoMaterial(CategoriaMaterial.ACCESORIO).costoDefectoUnitario(BigDecimal.valueOf(12.0)).build();
        Material felpa = Material.builder().nombre("Felpa perimétrica hermética").tipoMaterial(CategoriaMaterial.ACCESORIO).costoDefectoUnitario(BigDecimal.valueOf(2.5)).build();

        when(materialRepository.findByNombreIgnoreCase("Riel Superior S20")).thenReturn(Optional.of(rielSup));
        when(materialRepository.findByNombreIgnoreCase("Riel Inferior S20")).thenReturn(Optional.of(rielInf));
        when(materialRepository.findByNombreIgnoreCase("Jamba Lateral S20")).thenReturn(Optional.of(jamba));
        when(materialRepository.findByNombreIgnoreCase("Parante / Traslape de Hoja S20")).thenReturn(Optional.of(parante));
        when(materialRepository.findByNombreIgnoreCase("Zócalo / Cabezal de Hoja S20")).thenReturn(Optional.of(zocalo));
        when(materialRepository.findByNombreIgnoreCase("Garrucha / Rueda simple Serie 20")).thenReturn(Optional.of(garrucha));
        when(materialRepository.findByNombreIgnoreCase("Seguro Caracol para Serie 20")).thenReturn(Optional.of(seguro));
        when(materialRepository.findByNombreIgnoreCase("Felpa perimétrica hermética")).thenReturn(Optional.of(felpa));

        // 4. Mockear Vidrio
        TipoVidrio cristalMock = TipoVidrio.builder()
                .idVidrio(10)
                .nombre("Cristal Templado 6mm")
                .costoDefectoM2(BigDecimal.valueOf(55.0))
                .build();
        when(tipoVidrioRepository.findByNombreIgnoreCase("Cristal Templado 6mm")).thenReturn(Optional.of(cristalMock));

        DespieceObraRequestDTO request = DespieceObraRequestDTO.builder()
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .anchoSierraMm(3.0)
                .costoManoObra(100.0)
                .build();

        DespieceObraResponseDTO response = despieceObraService.calcularDespiece(request);

        assertNotNull(response);
        assertEquals(TipoEstructura.VENTANA_SERIE_20_2H, response.getTipoEstructura());
        assertEquals(1500.0, response.getAnchoVanoMm());
        assertEquals(1200.0, response.getAltoVanoMm());

        // 1. Validar piezas de aluminio
        PiezaAluminioDTO piezaRielSup = findPiezaAluminio(response, "Riel Superior S20");
        assertNotNull(piezaRielSup);
        assertEquals(1498.0, piezaRielSup.getLongitudMm());
        assertEquals(1, piezaRielSup.getCantidad());

        PiezaAluminioDTO piezaRielInf = findPiezaAluminio(response, "Riel Inferior S20");
        assertNotNull(piezaRielInf);
        assertEquals(1498.0, piezaRielInf.getLongitudMm());
        assertEquals(1, piezaRielInf.getCantidad());

        PiezaAluminioDTO piezaJamba = findPiezaAluminio(response, "Jamba Lateral S20");
        assertNotNull(piezaJamba);
        assertEquals(1200.0, piezaJamba.getLongitudMm());
        assertEquals(2, piezaJamba.getCantidad());

        PiezaAluminioDTO piezaParante = findPiezaAluminio(response, "Parante / Traslape");
        assertNotNull(piezaParante);
        assertEquals(1165.0, piezaParante.getLongitudMm());
        assertEquals(4, piezaParante.getCantidad());

        PiezaAluminioDTO piezaZocalo = findPiezaAluminio(response, "Zócalo / Cabezal");
        assertNotNull(piezaZocalo);
        assertEquals(730.0, piezaZocalo.getLongitudMm());
        assertEquals(4, piezaZocalo.getCantidad());

        // 2. Validar cristales (2 paños)
        assertEquals(1, response.getPiezasCristal().size());
        PiezaCristalDTO cristal = response.getPiezasCristal().get(0);
        assertEquals(735.0, cristal.getAnchoMm());
        assertEquals(1125.0, cristal.getAltoMm());
        assertEquals(2, cristal.getCantidad());

        // 3. Validar accesorios requeridos
        assertTrue(response.getAccesorios().stream().anyMatch(a -> a.getDescripcion().contains("Garrucha") && a.getCantidad() == 4.0));
        assertTrue(response.getAccesorios().stream().anyMatch(a -> a.getDescripcion().contains("Seguro Caracol") && a.getCantidad() == 1.0));
        assertTrue(response.getAccesorios().stream().anyMatch(a -> a.getDescripcion().contains("Felpa")));

        // 4. Validar optimización de corte
        assertNotNull(response.getOptimizacionVarillas());
        assertTrue(response.getOptimizacionVarillas().getTotalVarillas() >= 3);

        // 5. Validar desglose de costos y redondeo hacia arriba (Math.ceil)
        assertNotNull(response.getDesgloseCostos());
        double precioTotal = response.getDesgloseCostos().getPrecioTotal();
        assertEquals(Math.ceil(precioTotal), precioTotal, "El precio total debe estar redondeado con Math.ceil");
        assertTrue(precioTotal > 0);
    }

    @Test
    @DisplayName("Debe calcular correctamente el despiece para Mampara Nova")
    void testDespieceMamparaNova() {
        SistemaCarpinteria sistemaNova = SistemaCarpinteria.builder()
                .idSistema(4)
                .codigo("NOVA_2H")
                .nombre("Mampara Sistema Nova (2 Hojas)")
                .tipoEstructura("MAMPARA_NOVA_2H")
                .build();

        when(sistemaCarpinteriaRepository.findByTipoEstructura("MAMPARA_NOVA_2H"))
                .thenReturn(Optional.of(sistemaNova));

        List<FormulaDespiece> formulasNova = List.of(
                FormulaDespiece.builder().idFormula(10).idSistema(4).tipoElemento("ALUMINIO").cantidadPiezas(1).formulaLargo("ANCHO").descripcion("Riel Superior Sistema Nova").build(),
                FormulaDespiece.builder().idFormula(11).idSistema(4).tipoElemento("ALUMINIO").cantidadPiezas(1).formulaLargo("ANCHO").descripcion("Perfil Guía / Canal U Inferior").build(),
                FormulaDespiece.builder().idFormula(12).idSistema(4).tipoElemento("VIDRIO").cantidadPiezas(2).formulaLargo("(ANCHO / 2) + 15").formulaAlto("ALTO - 60").descripcion("Cristal Templado 8mm").build()
        );

        when(formulaDespieceRepository.findByIdSistema(4)).thenReturn(formulasNova);

        Material rielNova = Material.builder().nombre("Riel Superior Sistema Nova").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(85.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();
        Material canalU = Material.builder().nombre("Perfil Guía / Canal U Inferior").tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO).precioVarilla(BigDecimal.valueOf(50.0)).longitudVarilla(BigDecimal.valueOf(6.0)).build();

        when(materialRepository.findByNombreIgnoreCase("Riel Superior Sistema Nova")).thenReturn(Optional.of(rielNova));
        when(materialRepository.findByNombreIgnoreCase("Perfil Guía / Canal U Inferior")).thenReturn(Optional.of(canalU));

        TipoVidrio cristal8mm = TipoVidrio.builder().idVidrio(20).nombre("Cristal Templado 8mm").costoDefectoM2(BigDecimal.valueOf(75.0)).build();
        when(tipoVidrioRepository.findByNombreIgnoreCase("Cristal Templado 8mm")).thenReturn(Optional.of(cristal8mm));

        DespieceObraRequestDTO request = DespieceObraRequestDTO.builder()
                .anchoVanoMm(2000.0)
                .altoVanoMm(2100.0)
                .tipoEstructura(TipoEstructura.MAMPARA_NOVA_2H)
                .build();

        DespieceObraResponseDTO response = despieceObraService.calcularDespiece(request);

        assertNotNull(response);
        assertEquals(TipoEstructura.MAMPARA_NOVA_2H, response.getTipoEstructura());

        // Cristal templado Nova: ancho = (2000/2) + 15 = 1015 mm, alto = 2100 - 60 = 2040 mm
        PiezaCristalDTO cristal = response.getPiezasCristal().get(0);
        assertEquals(1015.0, cristal.getAnchoMm());
        assertEquals(2040.0, cristal.getAltoMm());
        assertEquals(2, cristal.getCantidad());
    }

    @Test
    @DisplayName("Validación Estricta: Si un material no existe en inventario, debe lanzar EntityNotFoundException")
    void testValidacionEstrictaMaterialInexistente() {
        SistemaCarpinteria sistema = SistemaCarpinteria.builder()
                .idSistema(1)
                .codigo("S20_2H")
                .nombre("Ventana Corrediza Serie 20")
                .tipoEstructura("VENTANA_SERIE_20_2H")
                .build();

        when(sistemaCarpinteriaRepository.findByTipoEstructura("VENTANA_SERIE_20_2H"))
                .thenReturn(Optional.of(sistema));

        List<FormulaDespiece> formulas = List.of(
                FormulaDespiece.builder().idFormula(1).idSistema(1).tipoElemento("ALUMINIO").cantidadPiezas(1).formulaLargo("ANCHO - 2").descripcion("Riel S20").build()
        );

        when(formulaDespieceRepository.findByIdSistema(1)).thenReturn(formulas);
        when(materialRepository.findByNombreIgnoreCase("Riel S20")).thenReturn(Optional.empty());
        when(materialRepository.findByNombre("Riel S20")).thenReturn(Optional.empty());

        DespieceObraRequestDTO request = DespieceObraRequestDTO.builder()
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .build();

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class, () -> despieceObraService.calcularDespiece(request));
        assertTrue(ex.getMessage().contains("Material 'Riel S20' no encontrado"));
    }

    @Test
    @DisplayName("Validación Estricta: Si un vidrio no existe en inventario, debe lanzar EntityNotFoundException")
    void testValidacionEstrictaVidrioInexistente() {
        SistemaCarpinteria sistema = SistemaCarpinteria.builder()
                .idSistema(1)
                .codigo("S20_2H")
                .nombre("Ventana Corrediza Serie 20")
                .tipoEstructura("VENTANA_SERIE_20_2H")
                .build();

        when(sistemaCarpinteriaRepository.findByTipoEstructura("VENTANA_SERIE_20_2H"))
                .thenReturn(Optional.of(sistema));

        List<FormulaDespiece> formulas = List.of(
                FormulaDespiece.builder().idFormula(1).idSistema(1).tipoElemento("VIDRIO").cantidadPiezas(2).formulaLargo("(ANCHO / 2) - 15").formulaAlto("ALTO - 75").descripcion("Vidrio Inexistente 10mm").build()
        );

        when(formulaDespieceRepository.findByIdSistema(1)).thenReturn(formulas);
        when(tipoVidrioRepository.findByNombreIgnoreCase("Vidrio Inexistente 10mm")).thenReturn(Optional.empty());
        when(tipoVidrioRepository.findByNombre("Vidrio Inexistente 10mm")).thenReturn(Optional.empty());

        DespieceObraRequestDTO request = DespieceObraRequestDTO.builder()
                .anchoVanoMm(1500.0)
                .altoVanoMm(1200.0)
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .build();

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class, () -> despieceObraService.calcularDespiece(request));
        assertTrue(ex.getMessage().contains("Vidrio 'Vidrio Inexistente 10mm' no encontrado"));
    }

    private PiezaAluminioDTO findPiezaAluminio(DespieceObraResponseDTO response, String subcadena) {
        return response.getPiezasAluminio().stream()
                .filter(p -> p.getNombrePerfil().toLowerCase().contains(subcadena.toLowerCase()))
                .findFirst()
                .orElse(null);
    }
}
