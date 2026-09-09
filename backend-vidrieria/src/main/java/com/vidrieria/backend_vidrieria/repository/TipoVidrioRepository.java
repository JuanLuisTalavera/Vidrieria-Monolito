package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.TipoVidrio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TipoVidrioRepository extends JpaRepository<TipoVidrio, Integer> {

    List<TipoVidrio> findByActivoTrue();
}
