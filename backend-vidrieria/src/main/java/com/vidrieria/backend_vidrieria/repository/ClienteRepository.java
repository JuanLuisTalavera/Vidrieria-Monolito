package com.vidrieria.backend_vidrieria.repository;

import com.vidrieria.backend_vidrieria.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    List<Cliente> findByActivoTrue();

    Optional<Cliente> findByNumeroDocumento(String numeroDocumento);

    List<Cliente> findByNombreRazonSocialContainingIgnoreCaseAndActivoTrue(String nombre);
}
