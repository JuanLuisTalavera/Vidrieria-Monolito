package com.vidrieria.backend_vidrieria.config;

import com.vidrieria.backend_vidrieria.entity.ServicioExtra;
import com.vidrieria.backend_vidrieria.entity.TipoCobro;
import com.vidrieria.backend_vidrieria.entity.Usuario;
import com.vidrieria.backend_vidrieria.repository.ServicioExtraRepository;
import com.vidrieria.backend_vidrieria.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ServicioExtraRepository servicioExtraRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsuarios();
        seedServiciosExtras();
    }

    private void seedUsuarios() {
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

    private void seedServiciosExtras() {
        try {
            if (servicioExtraRepository.count() == 0) {
                List<ServicioExtra> serviciosDefault = List.of(
                        ServicioExtra.builder()
                                .nombre("Canto Pulido Plano")
                                .descripcion("Pulido brillante de bordes perimetrales del vidrio para acabados finos y seguridad.")
                                .categoriaAplicable("VIDRIO")
                                .tipoCobro(TipoCobro.METRO_LINEAL)
                                .precioBase(new BigDecimal("5.00"))
                                .precioSugerido(new BigDecimal("5.00"))
                                .activo(true)
                                .build(),
                        ServicioExtra.builder()
                                .nombre("Biselado 1 pulgada (25mm)")
                                .descripcion("Biselado decorativo en los bordes de espejos y vidrios decorativos.")
                                .categoriaAplicable("VIDRIO")
                                .tipoCobro(TipoCobro.METRO_LINEAL)
                                .precioBase(new BigDecimal("12.00"))
                                .precioSugerido(new BigDecimal("12.00"))
                                .activo(true)
                                .build(),
                        ServicioExtra.builder()
                                .nombre("Perforación / Hueco para Tirador")
                                .descripcion("Hueco estándar para instalación de perillas y tiradores de puertas.")
                                .categoriaAplicable("VIDRIO")
                                .tipoCobro(TipoCobro.UNIDAD)
                                .precioBase(new BigDecimal("8.00"))
                                .precioSugerido(new BigDecimal("8.00"))
                                .activo(true)
                                .build(),
                        ServicioExtra.builder()
                                .nombre("Perforación para Bisagra / Encastre")
                                .descripcion("Mecanizado y corte especial para bisagras de mamparas y puertas templadas.")
                                .categoriaAplicable("VIDRIO")
                                .tipoCobro(TipoCobro.UNIDAD)
                                .precioBase(new BigDecimal("15.00"))
                                .precioSugerido(new BigDecimal("15.00"))
                                .activo(true)
                                .build(),
                        ServicioExtra.builder()
                                .nombre("Arenado / Pavonado")
                                .descripcion("Tratamiento superficial de privacidad mate o decorativo por metro cuadrado.")
                                .categoriaAplicable("VIDRIO")
                                .tipoCobro(TipoCobro.METRO_CUADRADO)
                                .precioBase(new BigDecimal("25.00"))
                                .precioSugerido(new BigDecimal("25.00"))
                                .activo(true)
                                .build(),
                        ServicioExtra.builder()
                                .nombre("Instalación en Obra y Montaje")
                                .descripcion("Mano de obra especializada para transporte, nivelación e instalación en sitio.")
                                .categoriaAplicable("GENERAL")
                                .tipoCobro(TipoCobro.GLOBAL)
                                .precioBase(new BigDecimal("120.00"))
                                .precioSugerido(new BigDecimal("120.00"))
                                .activo(true)
                                .build()
                );

                servicioExtraRepository.saveAll(serviciosDefault);
                log.info(">>> Catálogo inicial de servicios extras y manufactura creado con éxito ({} servicios).", serviciosDefault.size());
            }
        } catch (Exception e) {
            log.warn(">>> No se pudo sembrar el catálogo por defecto de servicios extras: {}", e.getMessage());
        }
    }
}
