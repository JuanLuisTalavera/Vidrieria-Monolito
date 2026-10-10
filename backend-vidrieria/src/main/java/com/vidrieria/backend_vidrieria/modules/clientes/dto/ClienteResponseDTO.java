package com.vidrieria.backend_vidrieria.modules.clientes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteResponseDTO {

    private Integer idCliente;
    private String tipoDocumento;
    private String numeroDocumento;
    private String nombreRazonSocial;
    private String telefono;
    private String direccion;
    private Boolean activo;
}
