package com.vidrieria.backend_vidrieria.modules.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.inventario.entity.HistorialPrecioProveedor;

@Repository
public interface HistorialPrecioProveedorRepository extends JpaRepository<HistorialPrecioProveedor, Integer> {

    List<HistorialPrecioProveedor> findByMaterialIdMaterialOrderByFechaCambioDesc(Integer idMaterial);

    List<HistorialPrecioProveedor> findByTipoVidrioIdVidrioOrderByFechaCambioDesc(Integer idVidrio);
}
