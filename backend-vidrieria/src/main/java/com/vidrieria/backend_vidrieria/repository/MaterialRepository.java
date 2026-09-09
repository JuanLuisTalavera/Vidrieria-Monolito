package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Integer> {

    List<Material> findByActivoTrue();
}
