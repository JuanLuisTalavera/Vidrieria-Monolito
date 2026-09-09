package com.vidrieria.backend_vidrieria.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Vidriería y Marquería")
                        .description("Documentación interactiva de los endpoints del sistema ERP")
                        .version("1.0.0"));
    }
}
