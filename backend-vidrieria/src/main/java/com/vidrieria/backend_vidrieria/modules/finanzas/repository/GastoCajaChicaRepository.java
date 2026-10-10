package com.vidrieria.backend_vidrieria.modules.finanzas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.finanzas.entity.GastoCajaChica;

@Repository
public interface GastoCajaChicaRepository extends JpaRepository<GastoCajaChica, Integer> {

    List<GastoCajaChica> findByCategoria(String categoria);
}
