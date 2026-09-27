package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Integer> {

    List<Material> findByActivoTrue();

    List<Material> findByActivoTrueAndTipoMaterial(CategoriaMaterial tipoMaterial);

    List<Material> findByTipoMaterial(CategoriaMaterial tipoMaterial);

    Optional<Material> findByNombreIgnoreCase(String nombre);

    Optional<Material> findByNombre(String nombre);
}

