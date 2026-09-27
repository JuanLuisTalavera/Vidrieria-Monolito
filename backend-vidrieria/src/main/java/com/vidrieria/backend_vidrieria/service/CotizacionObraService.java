package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.CotizacionObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraRequestDTO;
import com.vidrieria.backend_vidrieria.dto.DespieceObraResponseDTO;
import com.vidrieria.backend_vidrieria.dto.GuardarCotizacionObraRequestDTO;
import com.vidrieria.backend_vidrieria.entity.Cliente;
import com.vidrieria.backend_vidrieria.entity.CotizacionObra;
import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import com.vidrieria.backend_vidrieria.repository.ClienteRepository;
import com.vidrieria.backend_vidrieria.repository.CotizacionObraRepository;
import com.vidrieria.backend_vidrieria.repository.TipoVidrioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CotizacionObraService {

    private final CotizacionObraRepository cotizacionObraRepository;
    private final ClienteRepository clienteRepository;
    private final TipoVidrioRepository tipoVidrioRepository;
    private final DespieceObraService despieceObraService;

    @Transactional
    public CotizacionObraResponseDTO guardarCotizacion(GuardarCotizacionObraRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("La cotización a guardar no puede ser nula");
        }

        Cliente cliente = null;
        if (request.getIdCliente() != null) {
            cliente = clienteRepository.findById(request.getIdCliente())
                    .orElseThrow(() -> new EntityNotFoundException("No se encontró el cliente con ID: " + request.getIdCliente()));
        }

        TipoVidrio vidrio = null;
        if (request.getIdVidrio() != null) {
            vidrio = tipoVidrioRepository.findById(request.getIdVidrio())
                    .orElseThrow(() -> new EntityNotFoundException("No se encontró el tipo de vidrio con ID: " + request.getIdVidrio()));
        }

        Double precioTotal = request.getPrecioTotal();
        Double costoAluminio = request.getCostoAluminio();
        Double costoVidrio = request.getCostoVidrio();
        Double costoAccesorios = request.getCostoAccesorios();
        Double costoManoObra = request.getCostoManoObra();

        // Si no se proveyeron costos explícitos, calcularlos mediante el motor de despiece
        if (precioTotal == null || precioTotal <= 0) {
            DespieceObraRequestDTO calcReq = DespieceObraRequestDTO.builder()
                    .anchoVanoMm(request.getAnchoVanoMm())
                    .altoVanoMm(request.getAltoVanoMm())
                    .tipoEstructura(request.getTipoEstructura())
                    .idVidrio(request.getIdVidrio())
                    .idCliente(request.getIdCliente())
                    .colorAluminio(request.getColorAluminio())
                    .build();

            DespieceObraResponseDTO despiece = despieceObraService.calcularDespiece(calcReq);
            if (despiece.getDesgloseCostos() != null) {
                costoAluminio = despiece.getDesgloseCostos().getCostoAluminio();
                costoVidrio = despiece.getDesgloseCostos().getCostoCristal();
                costoAccesorios = despiece.getDesgloseCostos().getCostoAccesorios();
                costoManoObra = despiece.getDesgloseCostos().getCostoManoObra();
                precioTotal = despiece.getDesgloseCostos().getPrecioTotal();
            }
        }

        CotizacionObra cotizacion = CotizacionObra.builder()
                .cliente(cliente)
                .anchoVanoMm(request.getAnchoVanoMm())
                .altoVanoMm(request.getAltoVanoMm())
                .tipoEstructura(request.getTipoEstructura())
                .tipoCristal(vidrio)
                .colorAluminio(request.getColorAluminio() != null ? request.getColorAluminio() : "Natural / Mate")
                .costoAluminio(costoAluminio)
                .costoVidrio(costoVidrio)
                .costoAccesorios(costoAccesorios)
                .costoManoObra(costoManoObra)
                .precioTotal(precioTotal != null ? precioTotal : 0.0)
                .observaciones(request.getObservaciones())
                .build();

        CotizacionObra guardada = cotizacionObraRepository.save(cotizacion);
        return mapearADTO(guardada);
    }

    @Transactional(readOnly = true)
    public List<CotizacionObraResponseDTO> listarTodas() {
        return cotizacionObraRepository.findAllByOrderByFechaRegistroDesc().stream()
                .map(this::mapearADTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CotizacionObraResponseDTO obtenerPorId(Long id) {
        CotizacionObra cotizacion = cotizacionObraRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró la cotización de obra con ID: " + id));
        return mapearADTO(cotizacion);
    }

    private CotizacionObraResponseDTO mapearADTO(CotizacionObra entidad) {
        return CotizacionObraResponseDTO.builder()
                .id(entidad.getId())
                .idCliente(entidad.getCliente() != null ? entidad.getCliente().getIdCliente() : null)
                .nombreCliente(entidad.getCliente() != null ? entidad.getCliente().getNombreRazonSocial() : null)
                .anchoVanoMm(entidad.getAnchoVanoMm())
                .altoVanoMm(entidad.getAltoVanoMm())
                .tipoEstructura(entidad.getTipoEstructura())
                .idVidrio(entidad.getTipoCristal() != null ? entidad.getTipoCristal().getIdVidrio() : null)
                .nombreVidrio(entidad.getTipoCristal() != null ? entidad.getTipoCristal().getNombre() : null)
                .colorAluminio(entidad.getColorAluminio())
                .costoAluminio(entidad.getCostoAluminio())
                .costoVidrio(entidad.getCostoVidrio())
                .costoAccesorios(entidad.getCostoAccesorios())
                .costoManoObra(entidad.getCostoManoObra())
                .precioTotal(entidad.getPrecioTotal())
                .observaciones(entidad.getObservaciones())
                .fechaRegistro(entidad.getFechaRegistro())
                .build();
    }
}
