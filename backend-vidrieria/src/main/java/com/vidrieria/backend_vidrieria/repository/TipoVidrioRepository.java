package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoVidrioRepository extends JpaRepository<TipoVidrio, Integer> {

    List<TipoVidrio> findByActivoTrue();

    Optional<TipoVidrio> findByNombreIgnoreCase(String nombre);

    Optional<TipoVidrio> findByNombre(String nombre);
}

