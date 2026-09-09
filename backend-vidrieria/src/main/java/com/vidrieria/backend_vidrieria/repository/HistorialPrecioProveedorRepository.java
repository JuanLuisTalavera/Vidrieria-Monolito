package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.HistorialPrecioProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialPrecioProveedorRepository extends JpaRepository<HistorialPrecioProveedor, Integer> {

    List<HistorialPrecioProveedor> findByMaterialIdMaterialOrderByFechaCambioDesc(Integer idMaterial);

    List<HistorialPrecioProveedor> findByTipoVidrioIdVidrioOrderByFechaCambioDesc(Integer idVidrio);
}
