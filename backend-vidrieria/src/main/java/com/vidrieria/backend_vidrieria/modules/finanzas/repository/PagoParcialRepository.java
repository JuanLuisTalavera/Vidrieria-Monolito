package com.vidrieria.backend_vidrieria.modules.finanzas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.finanzas.entity.PagoParcial;

@Repository
public interface PagoParcialRepository extends JpaRepository<PagoParcial, Integer> {

    List<PagoParcial> findByPedidoIdPedido(Integer idPedido);
}
