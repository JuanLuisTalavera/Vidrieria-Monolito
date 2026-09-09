package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.PagoParcial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PagoParcialRepository extends JpaRepository<PagoParcial, Integer> {

    List<PagoParcial> findByPedidoIdPedido(Integer idPedido);
}
