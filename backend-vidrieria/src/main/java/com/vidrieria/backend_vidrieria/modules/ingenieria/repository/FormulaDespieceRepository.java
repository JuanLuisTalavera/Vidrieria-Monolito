package com.vidrieria.backend_vidrieria.modules.ingenieria.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.FormulaDespiece;

@Repository
public interface FormulaDespieceRepository extends JpaRepository<FormulaDespiece, Integer> {

    List<FormulaDespiece> findByIdSistema(Integer idSistema);
}
