package com.vidrieria.backend_vidrieria.modules.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.TipoVidrio;

@Repository
public interface TipoVidrioRepository extends JpaRepository<TipoVidrio, Integer> {

    List<TipoVidrio> findByActivoTrue();

    Optional<TipoVidrio> findByNombreIgnoreCase(String nombre);

    Optional<TipoVidrio> findByNombre(String nombre);
}

