package com.vidrieria.backend_vidrieria.modules.clientes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Integer idCliente;

    @Column(name = "tipo_documento", nullable = false, length = 10)
    private String tipoDocumento;

    @Column(name = "numero_documento", nullable = false, unique = true, length = 20)
    private String numeroDocumento;

    @Column(name = "nombre_razon_social", nullable = false, length = 300)
    private String nombreRazonSocial;

    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "direccion", length = 500)
    private String direccion;

    @Column(name = "activo")
    private Boolean activo;
}
