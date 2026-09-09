package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.GastoCajaChica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GastoCajaChicaRepository extends JpaRepository<GastoCajaChica, Integer> {

    List<GastoCajaChica> findByCategoria(String categoria);
}
