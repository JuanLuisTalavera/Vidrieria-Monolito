package com.vidrieria.backend_vidrieria.service;

import com.vidrieria.backend_vidrieria.dto.PerfilUsuarioResponseDTO;
import com.vidrieria.backend_vidrieria.entity.PerfilUsuario;
import com.vidrieria.backend_vidrieria.repository.PerfilUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final String ROL_MAESTRO = "MAESTRO_INSTALADOR";
    private static final String ROL_TALLER = "TALLER";

    private final PerfilUsuarioRepository perfilUsuarioRepository;

    /**
     * Lista al personal operativo activo (maestros instaladores y personal de taller).
     *
     * @return Lista de perfiles con rol MAESTRO_INSTALADOR o TALLER.
     */
    public List<PerfilUsuarioResponseDTO> listarMaestros() {
        List<PerfilUsuario> maestros = perfilUsuarioRepository.findByRolAndActivoTrue(ROL_MAESTRO);
        List<PerfilUsuario> taller = perfilUsuarioRepository.findByRolAndActivoTrue(ROL_TALLER);

        maestros.addAll(taller);

        return maestros.stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    /**
     * Obtiene un perfil de usuario a partir de su authId de Supabase.
     *
     * @param authId UUID proporcionado por Supabase Auth.
     * @return DTO con los datos del perfil.
     */
    public PerfilUsuarioResponseDTO obtenerPorAuthId(UUID authId) {
        PerfilUsuario perfil = perfilUsuarioRepository.findByAuthId(authId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No se encontró un perfil con authId: " + authId));

        return mapToResponseDTO(perfil);
    }

    // ----- Mapeo entidad → DTO -----

    private PerfilUsuarioResponseDTO mapToResponseDTO(PerfilUsuario perfil) {
        return PerfilUsuarioResponseDTO.builder()
                .idUsuario(perfil.getIdUsuario())
                .authId(perfil.getAuthId())
                .nombre(perfil.getNombre())
                .apellido(perfil.getApellido())
                .telefono(perfil.getTelefono())
                .correo(perfil.getCorreo())
                .rol(perfil.getRol())
                .activo(perfil.getActivo())
                .build();
    }
}
