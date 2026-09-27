package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.SistemaCarpinteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SistemaCarpinteriaRepository extends JpaRepository<SistemaCarpinteria, Integer> {

    List<SistemaCarpinteria> findByActivoTrue();

    Optional<SistemaCarpinteria> findByTipoEstructura(String tipoEstructura);

    Optional<SistemaCarpinteria> findByTipoEstructuraAndActivoTrue(String tipoEstructura);

    Optional<SistemaCarpinteria> findByCodigo(String codigo);
}

