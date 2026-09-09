package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.ServicioExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioExtraRepository extends JpaRepository<ServicioExtra, Integer> {

    List<ServicioExtra> findByActivoTrue();
}
