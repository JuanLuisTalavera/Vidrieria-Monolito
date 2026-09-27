package com.vidrieria.backend_vidrieria.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO de entrada para cotización de vidrios sueltos / a medida.
 * Permite especificar dimensiones, cantidad y procesamiento de manufactura
 * (metros lineales de pulido/biselado y cantidad de huecos/perforaciones).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CotizacionVidrioSueltoRequestDTO {

    @NotNull(message = "El ID del tipo de vidrio es obligatorio")
    @JsonAlias({"id_vidrio", "vidrioId"})
    private Integer idVidrio;

    @NotNull(message = "El ancho en milímetros es obligatorio")
    @Positive(message = "El valor debe ser mayor a 0")
    @JsonAlias({"ancho_mm", "ancho"})
    private Double anchoMm;

    @NotNull(message = "El alto en milímetros es obligatorio")
    @Positive(message = "El valor debe ser mayor a 0")
    @JsonAlias({"alto_mm", "alto"})
    private Double altoMm;

    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser mayor a 0")
    @Builder.Default
    private Integer cantidad = 1;

    @DecimalMin(value = "0.0", message = "Los metros de pulido no pueden ser negativos")
    @Builder.Default
    @JsonAlias({"metros_pulido", "pulidoMetros", "pulido"})
    private Double metrosPulido = 0.0;

    @DecimalMin(value = "0.0", message = "Los metros de biselado no pueden ser negativos")
    @Builder.Default
    @JsonAlias({"metros_biselado", "biseladoMetros", "biselado"})
    private Double metrosBiselado = 0.0;

    @Min(value = 0, message = "La cantidad de huecos no puede ser negativa")
    @Builder.Default
    @JsonAlias({"cantidad_huecos", "huecos", "numeroHuecos"})
    private Integer cantidadHuecos = 0;

    // --- Identificadores opcionales de ServicioExtra específicos ---
    @JsonAlias({"id_servicio_pulido", "servicioPulidoId"})
    private Integer idServicioPulido;

    @JsonAlias({"id_servicio_biselado", "servicioBiseladoId"})
    private Integer idServicioBiselado;

    @JsonAlias({"id_servicio_hueco", "id_servicio_perforacion", "servicioHuecoId"})
    private Integer idServicioHueco;

    // --- Precios unitarios personalizados opcionales (sobrescriben los del catálogo) ---
    @JsonAlias({"precio_m2_vidrio_personalizado", "precioM2Personalizado"})
    private BigDecimal precioM2VidrioPersonalizado;

    @JsonAlias({"precio_metro_pulido_personalizado", "precioPulidoPersonalizado"})
    private BigDecimal precioMetroPulidoPersonalizado;

    @JsonAlias({"precio_metro_biselado_personalizado", "precioBiseladoPersonalizado"})
    private BigDecimal precioMetroBiseladoPersonalizado;

    @JsonAlias({"precio_unitario_hueco_personalizado", "precioHuecoPersonalizado"})
    private BigDecimal precioUnitarioHuecoPersonalizado;
}
