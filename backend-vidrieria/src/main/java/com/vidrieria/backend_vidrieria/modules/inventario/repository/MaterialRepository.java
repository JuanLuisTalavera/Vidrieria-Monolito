package com.vidrieria.backend_vidrieria.modules.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.CategoriaMaterial;
import com.vidrieria.backend_vidrieria.modules.inventario.entity.Material;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Integer> {

    List<Material> findByActivoTrue();

    List<Material> findByActivoTrueAndTipoMaterial(CategoriaMaterial tipoMaterial);

    List<Material> findByTipoMaterial(CategoriaMaterial tipoMaterial);

    Optional<Material> findByNombreIgnoreCase(String nombre);

    Optional<Material> findByNombre(String nombre);
}

