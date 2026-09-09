package com.vidrieria.backend_vidrieria.controller;

import com.vidrieria.backend_vidrieria.dto.LoginRequestDTO;
import com.vidrieria.backend_vidrieria.dto.LoginResponseDTO;
import com.vidrieria.backend_vidrieria.entity.Usuario;
import com.vidrieria.backend_vidrieria.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Autentica al usuario y retorna un JWT si las credenciales son válidas.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO request) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            Usuario usuario = (Usuario) authentication.getPrincipal();

            String token = jwtService.generarToken(usuario);

            LoginResponseDTO response = LoginResponseDTO.builder()
                    .token(token)
                    .username(usuario.getUsername())
                    .rol(usuario.getRol())
                    .build();

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
