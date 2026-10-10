package com.vidrieria.backend_vidrieria.modules.ingenieria.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.SistemaCarpinteria;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.TipoEstructura;

@Repository
public interface SistemaCarpinteriaRepository extends JpaRepository<SistemaCarpinteria, Integer> {

    List<SistemaCarpinteria> findByActivoTrue();

    Optional<SistemaCarpinteria> findByTipoEstructura(String tipoEstructura);

    Optional<SistemaCarpinteria> findByTipoEstructuraAndActivoTrue(String tipoEstructura);

    Optional<SistemaCarpinteria> findByCodigo(String codigo);
}

