package com.vidrieria.backend_vidrieria.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vidrieria.backend_vidrieria.dto.*;
import com.vidrieria.backend_vidrieria.entity.*;
import com.vidrieria.backend_vidrieria.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PedidoServiceDespieceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private TipoVidrioRepository tipoVidrioRepository;

    @Mock
    private PagoRepository pagoRepository;

    private ObjectMapper objectMapper;
    private PedidoService pedidoService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        pedidoService = new PedidoService(
                pedidoRepository,
                usuarioRepository,
                materialRepository,
                tipoVidrioRepository,
                pagoRepository
        );
    }

    @Test
    @DisplayName("Debe descontar el inventario real al crear un pedido con despiece de obra")
    void testDescuentoInventarioAlCrearPedido() throws Exception {
        // Despiece JSON con 1 perfil de aluminio (3000 mm), 1 cristal (1.5 m2) y 1 accesorio (4 unidades)
        DespieceObraResponseDTO despieceDTO = DespieceObraResponseDTO.builder()
                .tipoEstructura(TipoEstructura.VENTANA_SERIE_20_2H)
                .piezasAluminio(List.of(
                        PiezaAluminioDTO.builder()
                                .nombrePerfil("Riel Superior S20")
                                .longitudMm(3000.0)
                                .cantidad(1)
                                .longitudTotalMm(3000.0)
                                .build()
                ))
                .piezasCristal(List.of(
                        PiezaCristalDTO.builder()
                                .descripcion("Cristal Templado 6mm")
                                .areaM2Total(1.5)
                                .cantidad(1)
                                .build()
                ))
                .accesorios(List.of(
                        new AccesorioItemDTO("Garrucha / Rueda simple Serie 20", 4.0, "UND", 20.0)
                ))
                .build();

        String despieceJson = objectMapper.writeValueAsString(despieceDTO);

        // Mockear entidades de inventario
        Material riel = Material.builder()
                .idMaterial(1)
                .nombre("Riel Superior S20")
                .tipoMaterial(CategoriaMaterial.PERFIL_ALUMINIO)
                .longitudVarilla(BigDecimal.valueOf(6.0)) // 6 metros
                .stock(10.0) // 10 varillas iniciales
                .build();

        TipoVidrio vidrio = TipoVidrio.builder()
                .idVidrio(2)
                .nombre("Cristal Templado 6mm")
                .anchoPlancha(BigDecimal.valueOf(2.5))
                .altoPlancha(BigDecimal.valueOf(2.0)) // Área plancha = 5.0 m2
                .stock(20.0) // 20 planchas iniciales
                .build();

        Material garrucha = Material.builder()
                .idMaterial(3)
                .nombre("Garrucha / Rueda simple Serie 20")
                .tipoMaterial(CategoriaMaterial.ACCESORIO)
                .stock(100.0) // 100 unidades iniciales
                .build();

        when(materialRepository.findByNombreIgnoreCase("Riel Superior S20")).thenReturn(Optional.of(riel));
        when(tipoVidrioRepository.findByNombreIgnoreCase("Cristal Templado 6mm")).thenReturn(Optional.of(vidrio));
        when(materialRepository.findByNombreIgnoreCase("Garrucha / Rueda simple Serie 20")).thenReturn(Optional.of(garrucha));

        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> {
            Pedido p = invocation.getArgument(0);
            p.setIdPedido(101);
            return p;
        });

        PedidoRequestDTO request = PedidoRequestDTO.builder()
                .clienteNombre("Cliente Obra")
                .clienteTelefono("999888777")
                .tipoTrabajo("OBRA")
                .total(BigDecimal.valueOf(500.0))
                .detalles(List.of(
                        DetallePedidoRequestDTO.builder()
                                .cantidad(1)
                                .subtotal(BigDecimal.valueOf(500.0))
                                .detallesDespiece(despieceJson)
                                .descontarStock(true)
                                .build()
                ))
                .build();

        PedidoResponseDTO response = pedidoService.crearPedido(request);

        assertNotNull(response);
        assertEquals(101, response.getIdPedido());

        // 1. Aluminio: 3000 mm = 3.0 m / 6.0 m = 0.5 varillas descontadas -> Stock final = 10.0 - 0.5 = 9.5
        assertEquals(9.5, riel.getStock(), 0.001);
        verify(materialRepository).save(riel);

        // 2. Vidrio: 1.5 m2 / (2.5 * 2.0 = 5.0 m2) = 0.3 planchas descontadas -> Stock final = 20.0 - 0.3 = 19.7
        assertEquals(19.7, vidrio.getStock(), 0.001);
        verify(tipoVidrioRepository).save(vidrio);

        // 3. Accesorios: 4 unidades descontadas -> Stock final = 100.0 - 4.0 = 96.0
        assertEquals(96.0, garrucha.getStock(), 0.001);
        verify(materialRepository).save(garrucha);
    }

    @Test
    @DisplayName("Debe lanzar EntityNotFoundException si un material del despiece no existe en el inventario")
    void testValidacionEstrictaMaterialEnPedido() throws Exception {
        DespieceObraResponseDTO despieceDTO = DespieceObraResponseDTO.builder()
                .piezasAluminio(List.of(
                        PiezaAluminioDTO.builder()
                                .nombrePerfil("Perfil Inexistente")
                                .longitudMm(2000.0)
                                .cantidad(1)
                                .build()
                ))
                .build();

        String despieceJson = objectMapper.writeValueAsString(despieceDTO);

        when(materialRepository.findByNombreIgnoreCase("Perfil Inexistente")).thenReturn(Optional.empty());
        when(materialRepository.findByNombre("Perfil Inexistente")).thenReturn(Optional.empty());

        PedidoRequestDTO request = PedidoRequestDTO.builder()
                .clienteNombre("Cliente Obra")
                .detalles(List.of(
                        DetallePedidoRequestDTO.builder()
                                .cantidad(1)
                                .detallesDespiece(despieceJson)
                                .descontarStock(true)
                                .build()
                ))
                .build();

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class, () -> pedidoService.crearPedido(request));
        assertTrue(ex.getMessage().contains("Material 'Perfil Inexistente' no encontrado"));
    }

    @Test
    @DisplayName("confirmarPedido debe cambiar el estado a CONFIRMADO y descontar stock pendiente")
    void testConfirmarPedido() throws Exception {
        DespieceObraResponseDTO despieceDTO = DespieceObraResponseDTO.builder()
                .accesorios(List.of(
                        new AccesorioItemDTO("Seguro Caracol para Serie 20", 2.0, "UND", 24.0)
                ))
                .build();
        String despieceJson = objectMapper.writeValueAsString(despieceDTO);

        Material seguro = Material.builder()
                .nombre("Seguro Caracol para Serie 20")
                .stock(50.0)
                .build();
        when(materialRepository.findByNombreIgnoreCase("Seguro Caracol para Serie 20")).thenReturn(Optional.of(seguro));

        DetallePedido detalle = DetallePedido.builder()
                .idDetalle(1)
                .cantidad(1)
                .detallesDespiece(despieceJson)
                .descontarStock(true)
                .build();

        Pedido pedido = Pedido.builder()
                .idPedido(200)
                .estado("COTIZADO")
                .total(BigDecimal.valueOf(150.0))
                .detalles(List.of(detalle))
                .build();

        when(pedidoRepository.findById(200)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PedidoResponseDTO response = pedidoService.confirmarPedido(200);

        assertNotNull(response);
        assertEquals("CONFIRMADO", response.getEstado());
        // 50.0 - 2.0 = 48.0
        assertEquals(48.0, seguro.getStock(), 0.001);
        assertFalse(detalle.getDescontarStock(), "El detalle debe quedar con descontarStock = false para prevenir doble descuento");
    }

    @Test
    @DisplayName("crearPedido debe clasificar como MIXTO si contiene cuadros (con moldura) y vidrios sueltos (sin moldura y con vidrio)")
    void testCrearPedidoMixtoAutomatico() {
        Material moldura = Material.builder().idMaterial(10).nombre("Moldura Clásica Dorada").build();
        TipoVidrio vidrio = TipoVidrio.builder().idVidrio(20).nombre("Vidrio Simple 3mm").build();

        when(materialRepository.findById(10)).thenReturn(Optional.of(moldura));
        when(tipoVidrioRepository.findById(20)).thenReturn(Optional.of(vidrio));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> {
            Pedido p = invocation.getArgument(0);
            p.setIdPedido(301);
            return p;
        });

        PedidoRequestDTO request = PedidoRequestDTO.builder()
                .clienteNombre("Cliente Mixto")
                .tipoTrabajo("CUADRO") // Originalmente enviado como CUADRO
                .detalles(List.of(
                        // Item 1: Cuadro (con moldura y con vidrio)
                        DetallePedidoRequestDTO.builder()
                                .idMoldura(10)
                                .idVidrio(20)
                                .ancho(BigDecimal.valueOf(40))
                                .alto(BigDecimal.valueOf(50))
                                .cantidad(1)
                                .subtotal(BigDecimal.valueOf(80))
                                .descontarStock(false)
                                .build(),
                        // Item 2: Vidrio suelto (sin moldura, con vidrio)
                        DetallePedidoRequestDTO.builder()
                                .idMoldura(null)
                                .idVidrio(20)
                                .ancho(BigDecimal.valueOf(30))
                                .alto(BigDecimal.valueOf(40))
                                .cantidad(2)
                                .subtotal(BigDecimal.valueOf(40))
                                .descontarStock(false)
                                .build()
                ))
                .build();

        PedidoResponseDTO response = pedidoService.crearPedido(request);

        assertNotNull(response);
        assertEquals("MIXTO", response.getTipoTrabajo(), "El tipoTrabajo debe sobreescribirse a MIXTO");
        assertEquals("MIXTO", request.getTipoTrabajo());
    }

    @Test
    @DisplayName("crearPedido mantiene el tipoTrabajo original si no es mixto")
    void testCrearPedidoNoMixtoMantieneTipoOriginal() {
        Material moldura = Material.builder().idMaterial(10).nombre("Moldura Clásica").build();
        when(materialRepository.findById(10)).thenReturn(Optional.of(moldura));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PedidoRequestDTO request = PedidoRequestDTO.builder()
                .clienteNombre("Cliente Cuadros")
                .tipoTrabajo("CUADRO")
                .detalles(List.of(
                        DetallePedidoRequestDTO.builder()
                                .idMoldura(10)
                                .cantidad(1)
                                .subtotal(BigDecimal.valueOf(50))
                                .descontarStock(false)
                                .build()
                ))
                .build();

        PedidoResponseDTO response = pedidoService.crearPedido(request);

        assertNotNull(response);
        assertEquals("CUADRO", response.getTipoTrabajo(), "Debe mantener CUADRO cuando no hay vidrios sueltos");
    }

    @Test
    @DisplayName("listarTodos debe utilizar findAllOptimizado y findByPedidoIdPedidoIn agrupando pagos en memoria")
    void testListarTodosOptimizado() {
        Pedido p1 = Pedido.builder()
                .idPedido(1)
                .clienteNombre("Cliente 1")
                .detalles(List.of())
                .build();

        Pedido p2 = Pedido.builder()
                .idPedido(2)
                .clienteNombre("Cliente 2")
                .detalles(List.of())
                .build();

        Pago pago1 = Pago.builder()
                .idPago(10)
                .monto(BigDecimal.valueOf(50.0))
                .pedido(p1)
                .build();

        Pago pago2 = Pago.builder()
                .idPago(20)
                .monto(BigDecimal.valueOf(30.0))
                .pedido(p2)
                .build();

        when(pedidoRepository.findAllOptimizado()).thenReturn(List.of(p1, p2));
        when(pagoRepository.findByPedidoIdPedidoIn(List.of(1, 2))).thenReturn(List.of(pago1, pago2));

        List<PedidoResponseDTO> resultados = pedidoService.listarTodos();

        assertNotNull(resultados);
        assertEquals(2, resultados.size());

        assertEquals(1, resultados.get(0).getIdPedido());
        assertEquals(1, resultados.get(0).getPagos().size());
        assertEquals(10, resultados.get(0).getPagos().get(0).getIdPago());

        assertEquals(2, resultados.get(1).getIdPedido());
        assertEquals(1, resultados.get(1).getPagos().size());
        assertEquals(20, resultados.get(1).getPagos().get(0).getIdPago());

        verify(pedidoRepository).findAllOptimizado();
        verify(pagoRepository).findByPedidoIdPedidoIn(List.of(1, 2));
        verify(pagoRepository, never()).findByPedidoIdPedidoOrderByFechaRegistroAsc(any());
    }

    @Test
    @DisplayName("listarTodos retorna lista vacía si no hay pedidos sin consultar pagos")
    void testListarTodosVacio() {
        when(pedidoRepository.findAllOptimizado()).thenReturn(List.of());

        List<PedidoResponseDTO> resultados = pedidoService.listarTodos();

        assertNotNull(resultados);
        assertTrue(resultados.isEmpty());
        verify(pedidoRepository).findAllOptimizado();
        verify(pagoRepository, never()).findByPedidoIdPedidoIn(any());
    }

    @Test
    @DisplayName("listarPaginados debe consultar IDs paginados primero y luego entidades y pagos por lote")
    void testListarPaginadosExitoso() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fechaRegistro"));
        Page<Integer> pageIds = new PageImpl<>(List.of(101, 102), pageable, 25);

        Pedido p1 = Pedido.builder().idPedido(101).clienteNombre("Cliente A").detalles(List.of()).build();
        Pedido p2 = Pedido.builder().idPedido(102).clienteNombre("Cliente B").detalles(List.of()).build();

        Pago pago1 = Pago.builder().idPago(1).monto(BigDecimal.valueOf(100.0)).pedido(p1).build();

        when(pedidoRepository.findPaginatedIds(pageable)).thenReturn(pageIds);
        when(pedidoRepository.findPedidosWithDetails(List.of(101, 102))).thenReturn(List.of(p1, p2));
        when(pagoRepository.findByPedidoIdPedidoIn(List.of(101, 102))).thenReturn(List.of(pago1));

        Page<PedidoResponseDTO> resultado = pedidoService.listarPaginados(0, 10, "DESC");

        assertNotNull(resultado);
        assertEquals(2, resultado.getContent().size());
        assertEquals(25, resultado.getTotalElements());
        assertEquals(101, resultado.getContent().get(0).getIdPedido());
        assertEquals(1, resultado.getContent().get(0).getPagos().size());
        assertEquals(102, resultado.getContent().get(1).getIdPedido());
        assertTrue(resultado.getContent().get(1).getPagos().isEmpty());

        verify(pedidoRepository).findPaginatedIds(pageable);
        verify(pedidoRepository).findPedidosWithDetails(List.of(101, 102));
        verify(pagoRepository).findByPedidoIdPedidoIn(List.of(101, 102));
    }

    @Test
    @DisplayName("listarPaginados retorna página vacía si no hay registros sin consultar detalles ni pagos")
    void testListarPaginadosVacio() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fechaRegistro"));
        Page<Integer> pageIds = new PageImpl<>(List.of(), pageable, 0);

        when(pedidoRepository.findPaginatedIds(pageable)).thenReturn(pageIds);

        Page<PedidoResponseDTO> resultado = pedidoService.listarPaginados(0, 10, "DESC");

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());
        assertEquals(0, resultado.getTotalElements());

        verify(pedidoRepository).findPaginatedIds(pageable);
        verify(pedidoRepository, never()).findPedidosWithDetails(any());
        verify(pagoRepository, never()).findByPedidoIdPedidoIn(any());
    }
}
