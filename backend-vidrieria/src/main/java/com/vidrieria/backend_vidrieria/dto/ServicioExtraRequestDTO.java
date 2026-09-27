package com.vidrieria.backend_vidrieria.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vidrieria.backend_vidrieria.entity.TipoCobro;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ServicioExtraRequestDTO {

    @NotBlank(message = "El nombre del servicio extra es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String nombre;

    private String descripcion;

    @JsonAlias({"categoria_aplicable", "categoria"})
    private String categoriaAplicable;

    @NotNull(message = "El tipo de cobro es obligatorio (METRO_LINEAL, UNIDAD, METRO_CUADRADO, GLOBAL)")
    @JsonAlias({"tipo_cobro", "tipo"})
    private TipoCobro tipoCobro;

    @NotNull(message = "El precio base es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio base no puede ser negativo")
    @JsonAlias({"precio_base", "precioSugerido", "precio_sugerido", "precio"})
    private BigDecimal precioBase;

    @JsonAlias({"precio_sugerido"})
    private BigDecimal precioSugerido;

    @Builder.Default
    private Boolean activo = true;

    /**
     * Retorna el precio especificado con fallback a precioSugerido si precioBase fuese nulo.
     */
    public BigDecimal getPrecioEfectivo() {
        if (this.precioBase != null) {
            return this.precioBase;
        }
        if (this.precioSugerido != null) {
            return this.precioSugerido;
        }
        return BigDecimal.ZERO;
    }
}
