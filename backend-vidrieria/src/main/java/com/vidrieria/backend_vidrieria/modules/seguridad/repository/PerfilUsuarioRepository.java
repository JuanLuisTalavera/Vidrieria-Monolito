package com.vidrieria.backend_vidrieria.modules.seguridad.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.vidrieria.backend_vidrieria.modules.seguridad.entity.PerfilUsuario;

@Repository
public interface PerfilUsuarioRepository extends JpaRepository<PerfilUsuario, Integer> {

    List<PerfilUsuario> findByRolAndActivoTrue(String rol);

    Optional<PerfilUsuario> findByAuthId(UUID authId);
}
