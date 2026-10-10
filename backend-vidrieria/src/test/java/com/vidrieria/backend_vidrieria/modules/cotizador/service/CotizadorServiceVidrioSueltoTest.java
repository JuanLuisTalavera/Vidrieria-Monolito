package com.vidrieria.backend_vidrieria.modules.cotizador.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoRequestDTO;
import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CotizacionVidrioSueltoResponseDTO;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.ServicioExtra;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoCobro;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.MaterialRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.ServicioExtraRepository;
import com.vidrieria.backend_vidrieria.modules.inventario.repository.TipoVidrioRepository;

@ExtendWith(MockitoExtension.class)
class CotizadorServiceVidrioSueltoTest {

    @Mock
    private TipoVidrioRepository tipoVidrioRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private ServicioExtraRepository servicioExtraRepository;

    @InjectMocks
    private CotizadorService cotizadorService;

    private TipoVidrio vidrioTemplado6mm;
    private ServicioExtra servicioPulido;
    private ServicioExtra servicioBiselado;
    private ServicioExtra servicioHueco;

    @BeforeEach
    void setUp() {
        vidrioTemplado6mm = TipoVidrio.builder()
                .idVidrio(10)
                .nombre("Cristal Templado 6mm Incoloro")
                .costoDefectoM2(new BigDecimal("80.00"))
                .esTemplado(true)
                .activo(true)
                .build();

        servicioPulido = ServicioExtra.builder()
                .id(1)
                .nombre("Canto Pulido Plano")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("5.00"))
                .precioSugerido(new BigDecimal("5.00"))
                .activo(true)
                .build();

        servicioBiselado = ServicioExtra.builder()
                .id(2)
                .nombre("Biselado 1 pulgada (25mm)")
                .tipoCobro(TipoCobro.METRO_LINEAL)
                .precioBase(new BigDecimal("12.00"))
                .precioSugerido(new BigDecimal("12.00"))
                .activo(true)
                .build();

        servicioHueco = ServicioExtra.builder()
                .id(3)
                .nombre("Perforación / Hueco para Tirador")
                .tipoCobro(TipoCobro.UNIDAD)
                .precioBase(new BigDecimal("8.00"))
                .precioSugerido(new BigDecimal("8.00"))
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("Cálculo básico de vidrio suelto sin manufactura: Área M2 = (ancho * alto / 1,000,000) * cantidad")
    void testCalcularVidrioSuelto_SoloCristal() {
        // Vidrio de 1000mm x 500mm = 0.5 m² * 2 unidades = 1.0 m²
        // Costo Vidrio: 1.0 m² * S/. 80.00 = S/. 80.00
        when(tipoVidrioRepository.findById(10)).thenReturn(Optional.of(vidrioTemplado6mm));

        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(10)
                .anchoMm(1000.0)
                .altoMm(500.0)
                .cantidad(2)
                .build();

        CotizacionVidrioSueltoResponseDTO response = cotizadorService.calcularCotizacionVidrioSuelto(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("0.5000"), response.getAreaM2Individual());
        assertEquals(new BigDecimal("1.0000"), response.getAreaM2Total());
        assertEquals(new BigDecimal("80.00"), response.getCostoM2Vidrio());
        assertEquals(new BigDecimal("80.00"), response.getSubtotalVidrio());
        assertEquals(new BigDecimal("0.00"), response.getSubtotalPulido());
        assertEquals(new BigDecimal("0.00"), response.getSubtotalBiselado());
        assertEquals(new BigDecimal("0.00"), response.getSubtotalHuecos());
        assertEquals(new BigDecimal("80.00"), response.getSubtotalNeto());
        assertEquals(new BigDecimal("80.00"), response.getTotalCalculado());
    }

    @Test
    @DisplayName("Cálculo completo con pulido lineal, biselado lineal y perforaciones")
    void testCalcularVidrioSuelto_CompletoConManufactura() {
        // Vidrio 1000 x 1000 (1.0 m2) x 1 unidad = 1.0 m2 * 80 = 80.00
        // Pulido: 3.5 metros * 5.00 = 17.50
        // Biselado: 2.0 metros * 12.00 = 24.00
        // Huecos: 4 huecos * 8.00 = 32.00
        // Subtotal = 80 + 17.50 + 24 + 32 = 153.50
        // Total redondeado = Math.ceil(153.50) = 154.00
        when(tipoVidrioRepository.findById(10)).thenReturn(Optional.of(vidrioTemplado6mm));
        when(servicioExtraRepository.findFirstByActivoTrueAndNombreContainingIgnoreCase("PULIDO"))
                .thenReturn(Optional.of(servicioPulido));
        when(servicioExtraRepository.findFirstByActivoTrueAndNombreContainingIgnoreCase("BISELADO"))
                .thenReturn(Optional.of(servicioBiselado));
        when(servicioExtraRepository.findFirstByActivoTrueAndNombreContainingIgnoreCase("HUECO"))
                .thenReturn(Optional.of(servicioHueco));

        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(10)
                .anchoMm(1000.0)
                .altoMm(1000.0)
                .cantidad(1)
                .metrosPulido(3.5)
                .metrosBiselado(2.0)
                .cantidadHuecos(4)
                .build();

        CotizacionVidrioSueltoResponseDTO response = cotizadorService.calcularCotizacionVidrioSuelto(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("80.00"), response.getSubtotalVidrio());
        assertEquals(new BigDecimal("17.50"), response.getSubtotalPulido());
        assertEquals(new BigDecimal("24.00"), response.getSubtotalBiselado());
        assertEquals(new BigDecimal("32.00"), response.getSubtotalHuecos());
        assertEquals(new BigDecimal("153.50"), response.getSubtotalNeto());
        assertEquals(new BigDecimal("154.00"), response.getTotalCalculado());
        assertEquals(new BigDecimal("154.00"), response.getTotalRedondeado());
    }

    @Test
    @DisplayName("Uso de IDs específicos de servicios extras")
    void testCalcularVidrioSuelto_ConIdsEspecificos() {
        when(tipoVidrioRepository.findById(10)).thenReturn(Optional.of(vidrioTemplado6mm));
        when(servicioExtraRepository.findById(1)).thenReturn(Optional.of(servicioPulido));
        when(servicioExtraRepository.findById(2)).thenReturn(Optional.of(servicioBiselado));
        when(servicioExtraRepository.findById(3)).thenReturn(Optional.of(servicioHueco));

        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(10)
                .anchoMm(1000.0)
                .altoMm(1000.0)
                .cantidad(1)
                .metrosPulido(2.0)
                .idServicioPulido(1)
                .metrosBiselado(1.0)
                .idServicioBiselado(2)
                .cantidadHuecos(2)
                .idServicioHueco(3)
                .build();

        CotizacionVidrioSueltoResponseDTO response = cotizadorService.calcularCotizacionVidrioSuelto(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("10.00"), response.getSubtotalPulido());
        assertEquals(new BigDecimal("12.00"), response.getSubtotalBiselado());
        assertEquals(new BigDecimal("16.00"), response.getSubtotalHuecos());
    }

    @Test
    @DisplayName("Uso de precios unitarios personalizados sobrescribe precios de catálogo")
    void testCalcularVidrioSuelto_ConPreciosPersonalizados() {
        when(tipoVidrioRepository.findById(10)).thenReturn(Optional.of(vidrioTemplado6mm));

        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(10)
                .anchoMm(1000.0)
                .altoMm(1000.0)
                .cantidad(1)
                .precioM2VidrioPersonalizado(new BigDecimal("100.00"))
                .metrosPulido(2.0)
                .precioMetroPulidoPersonalizado(new BigDecimal("7.00"))
                .metrosBiselado(1.0)
                .precioMetroBiseladoPersonalizado(new BigDecimal("15.00"))
                .cantidadHuecos(2)
                .precioUnitarioHuecoPersonalizado(new BigDecimal("10.00"))
                .build();

        CotizacionVidrioSueltoResponseDTO response = cotizadorService.calcularCotizacionVidrioSuelto(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("100.00"), response.getSubtotalVidrio());
        assertEquals(new BigDecimal("14.00"), response.getSubtotalPulido());
        assertEquals(new BigDecimal("15.00"), response.getSubtotalBiselado());
        assertEquals(new BigDecimal("20.00"), response.getSubtotalHuecos());
        assertEquals(new BigDecimal("149.00"), response.getTotalCalculado());
    }

    @Test
    @DisplayName("Cálculo de vidrio suelto con medidas pequeñas (100x100 mm)")
    void testCalcularVidrioSuelto_MedidasPequenas() {
        when(tipoVidrioRepository.findById(10)).thenReturn(Optional.of(vidrioTemplado6mm));

        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(10)
                .anchoMm(100.0)
                .altoMm(100.0)
                .cantidad(1)
                .build();

        CotizacionVidrioSueltoResponseDTO response = cotizadorService.calcularCotizacionVidrioSuelto(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("0.0100"), response.getAreaM2Individual());
        assertEquals(new BigDecimal("0.0100"), response.getAreaM2Total());
        assertEquals(new BigDecimal("0.80"), response.getSubtotalVidrio());
        assertEquals(new BigDecimal("0.80"), response.getSubtotalNeto());
        assertEquals(new BigDecimal("1.00"), response.getTotalCalculado());
    }

    @Test
    @DisplayName("Lanza IllegalArgumentException si el vidrio no existe")
    void testCalcularVidrioSuelto_VidrioNoExiste() {
        when(tipoVidrioRepository.findById(999)).thenReturn(Optional.empty());

        CotizacionVidrioSueltoRequestDTO request = CotizacionVidrioSueltoRequestDTO.builder()
                .idVidrio(999)
                .anchoMm(500.0)
                .altoMm(500.0)
                .build();

        assertThrows(IllegalArgumentException.class, () -> cotizadorService.calcularCotizacionVidrioSuelto(request));
    }
}
