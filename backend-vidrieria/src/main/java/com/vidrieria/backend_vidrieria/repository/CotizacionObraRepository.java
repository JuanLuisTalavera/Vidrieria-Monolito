package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.CotizacionObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CotizacionObraRepository extends JpaRepository<CotizacionObra, Long> {

    List<CotizacionObra> findByCliente_IdCliente(Integer idCliente);

    List<CotizacionObra> findByFechaRegistroBetween(LocalDateTime inicio, LocalDateTime fin);

    List<CotizacionObra> findAllByOrderByFechaRegistroDesc();
}
