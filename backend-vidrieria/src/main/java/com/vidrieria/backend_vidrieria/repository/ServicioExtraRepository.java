package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.ServicioExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServicioExtraRepository extends JpaRepository<ServicioExtra, Integer> {

    List<ServicioExtra> findByActivoTrue();

    List<ServicioExtra> findByActivoTrueOrderByNombreAsc();

    List<ServicioExtra> findAllByOrderByNombreAsc();

    List<ServicioExtra> findByCategoriaAplicableAndActivoTrue(String categoriaAplicable);

    Optional<ServicioExtra> findFirstByActivoTrueAndNombreContainingIgnoreCase(String keyword);

    List<ServicioExtra> findByActivoTrueAndNombreContainingIgnoreCaseOrderByNombreAsc(String keyword);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Integer id);
}
