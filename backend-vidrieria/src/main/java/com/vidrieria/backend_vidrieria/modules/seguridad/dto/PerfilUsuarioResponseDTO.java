package com.vidrieria.backend_vidrieria.modules.seguridad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilUsuarioResponseDTO {

    private Integer idUsuario;
    private UUID authId;
    private String nombre;
    private String apellido;
    private String telefono;
    private String correo;
    private String rol;
    private Boolean activo;
}
