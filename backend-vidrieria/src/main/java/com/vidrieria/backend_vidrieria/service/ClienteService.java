package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.ClienteRequestDTO;
import com.vidrieria.backend_vidrieria.dto.ClienteResponseDTO;
import com.vidrieria.backend_vidrieria.entity.Cliente;
import com.vidrieria.backend_vidrieria.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    /**
     * Lista todos los clientes activos.
     */
    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> listarActivos() {
        return clienteRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Crea un nuevo cliente marcándolo como activo.
     * Valida que el número de documento no esté ya registrado.
     */
    @Transactional
    public ClienteResponseDTO crear(ClienteRequestDTO request) {
        clienteRepository.findByNumeroDocumento(request.getNumeroDocumento())
                .ifPresent(existente -> {
                    throw new IllegalArgumentException(
                            "Ya existe un cliente con el documento: " + request.getNumeroDocumento());
                });

        Cliente cliente = Cliente.builder()
                .tipoDocumento(request.getTipoDocumento())
                .numeroDocumento(request.getNumeroDocumento())
                .nombreRazonSocial(request.getNombreRazonSocial())
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .activo(true)
                .build();

        Cliente guardado = clienteRepository.save(cliente);
        return mapToDTO(guardado);
    }

    /**
     * Actualiza un cliente existente.
     */
    @Transactional
    public ClienteResponseDTO actualizar(Integer id, ClienteRequestDTO request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Cliente no encontrado con ID: " + id));

        // Validar unicidad del documento si cambió
        if (!cliente.getNumeroDocumento().equals(request.getNumeroDocumento())) {
            clienteRepository.findByNumeroDocumento(request.getNumeroDocumento())
                    .ifPresent(existente -> {
                        throw new IllegalArgumentException(
                                "Ya existe otro cliente con el documento: " + request.getNumeroDocumento());
                    });
        }

        cliente.setTipoDocumento(request.getTipoDocumento());
        cliente.setNumeroDocumento(request.getNumeroDocumento());
        cliente.setNombreRazonSocial(request.getNombreRazonSocial());
        cliente.setTelefono(request.getTelefono());
        cliente.setDireccion(request.getDireccion());

        Cliente guardado = clienteRepository.save(cliente);
        return mapToDTO(guardado);
    }

    /**
     * Borrado lógico: marca el cliente como inactivo.
     */
    @Transactional
    public void eliminar(Integer id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Cliente no encontrado con ID: " + id));

        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    /**
     * Busca un cliente por su número de documento exacto.
     * Ideal para autocompletar datos en cotizaciones.
     */
    @Transactional(readOnly = true)
    public ClienteResponseDTO buscarPorDocumento(String numeroDocumento) {
        Cliente cliente = clienteRepository.findByNumeroDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException(
                        "No se encontró un cliente con el documento: " + numeroDocumento));

        return mapToDTO(cliente);
    }

    /**
     * Busca clientes activos cuyo nombre o razón social contenga el texto dado.
     */
    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> buscarPorNombre(String nombre) {
        return clienteRepository.findByNombreRazonSocialContainingIgnoreCaseAndActivoTrue(nombre)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ----- Mapeo entidad → DTO -----

    private ClienteResponseDTO mapToDTO(Cliente c) {
        return ClienteResponseDTO.builder()
                .idCliente(c.getIdCliente())
                .tipoDocumento(c.getTipoDocumento())
                .numeroDocumento(c.getNumeroDocumento())
                .nombreRazonSocial(c.getNombreRazonSocial())
                .telefono(c.getTelefono())
                .direccion(c.getDireccion())
                .activo(c.getActivo())
                .build();
    }
}
