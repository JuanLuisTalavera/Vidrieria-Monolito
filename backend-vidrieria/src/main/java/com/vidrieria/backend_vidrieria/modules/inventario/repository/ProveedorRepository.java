package com.vidrieria.backend_vidrieria.modules.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.Proveedor;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {

    List<Proveedor> findByActivoTrue();
}
