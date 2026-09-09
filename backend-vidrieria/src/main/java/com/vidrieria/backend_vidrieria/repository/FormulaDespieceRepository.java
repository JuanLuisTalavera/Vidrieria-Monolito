package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.FormulaDespiece;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormulaDespieceRepository extends JpaRepository<FormulaDespiece, Integer> {

    List<FormulaDespiece> findByIdSistema(Integer idSistema);
}
