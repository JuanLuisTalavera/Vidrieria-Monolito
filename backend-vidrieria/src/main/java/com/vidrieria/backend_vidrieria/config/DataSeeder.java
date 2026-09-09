package com.vidrieria.backend_vidrieria.config;

import com.vidrieria.backend_vidrieria.entity.Usuario;
import com.vidrieria.backend_vidrieria.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = Usuario.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("123456"))
                    .rol("ADMIN")
                    .build();

            Usuario operario = Usuario.builder()
                    .username("operario")
                    .password(passwordEncoder.encode("123456"))
                    .rol("OPERARIO")
                    .build();

            usuarioRepository.save(admin);
            usuarioRepository.save(operario);
            log.info(">>> Usuarios creados por defecto: admin (ADMIN) y operario (OPERARIO). Password: 123456");
        } else {
            log.info(">>> Ya existen usuarios en la BD, no se crearon usuarios por defecto.");
        }
    }
}
