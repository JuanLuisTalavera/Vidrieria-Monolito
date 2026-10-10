package com.vidrieria.backend_vidrieria.modules.ingenieria.service;

import lombok.RequiredArgsConstructor;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import com.vidrieria.backend_vidrieria.modules.cotizador.dto.CalculoDespieceRequestDTO;
import com.vidrieria.backend_vidrieria.modules.ingenieria.entity.FormulaDespiece;
import com.vidrieria.backend_vidrieria.modules.ingenieria.repository.FormulaDespieceRepository;
import com.vidrieria.backend_vidrieria.modules.optimizador.dto.DetalleCorteDTO;

@Service
@RequiredArgsConstructor
public class MotorDespieceService {

    private final FormulaDespieceRepository formulaDespieceRepository;
    private final ExpressionParser parser = new SpelExpressionParser();

    @Transactional(readOnly = true)
    public List<DetalleCorteDTO> calcular(CalculoDespieceRequestDTO request) {

        // 1. Obtener fórmulas del sistema solicitado
        List<FormulaDespiece> formulas = formulaDespieceRepository.findByIdSistema(request.getIdSistema());

        // 2. Preparar contexto SpEL con las variables de medida del vano
        StandardEvaluationContext context = new StandardEvaluationContext();
        context.setVariable("ANCHO", request.getAncho() != null ? request.getAncho() : 0.0);
        context.setVariable("ALTO", request.getAlto() != null ? request.getAlto() : 0.0);

        int cantidadVentanas = (request.getCantidadVentanas() != null && request.getCantidadVentanas() > 0)
                ? request.getCantidadVentanas()
                : 1;

        // 3. Iterar fórmulas, evaluar expresiones y construir resultados
        List<DetalleCorteDTO> resultados = new ArrayList<>();

        for (FormulaDespiece formula : formulas) {

            // Evaluar formulaLargo con SpEL
            Double longitudCalculada = evaluarExpresion(formula.getFormulaLargo(), context);

            // Calcular cantidad total = piezas de la fórmula × ventanas solicitadas
            int piezasBase = (formula.getCantidadPiezas() != null && formula.getCantidadPiezas() > 0)
                    ? formula.getCantidadPiezas()
                    : 1;
            int cantidadTotal = piezasBase * cantidadVentanas;

            resultados.add(DetalleCorteDTO.builder()
                    .tipoElemento(formula.getTipoElemento())
                    .longitudCalculada(redondear(longitudCalculada))
                    .cantidadTotal(cantidadTotal)
                    .build());
        }

        return resultados;
    }

    /**
     * Evalúa una expresión de fórmula reemplazando ANCHO y ALTO
     * por referencias SpEL (#ANCHO, #ALTO) y retorna el valor numérico.
     */
    private Double evaluarExpresion(String formulaTexto, StandardEvaluationContext context) {
        if (formulaTexto == null || formulaTexto.trim().isEmpty()) {
            return 0.0;
        }

        // Convertir nombres de variable a sintaxis SpEL (#variable)
        String expresionSpel = formulaTexto.trim()
                .replaceAll("(?i)\\bANCHO\\b", "#ANCHO")
                .replaceAll("(?i)\\bALTO\\b", "#ALTO");

        try {
            Number resultado = parser.parseExpression(expresionSpel).getValue(context, Number.class);
            return (resultado != null) ? resultado.doubleValue() : 0.0;
        } catch (Exception e) {
            // Si la fórmula es un literal numérico directo
            try {
                return Double.parseDouble(formulaTexto.trim());
            } catch (NumberFormatException nfe) {
                return 0.0;
            }
        }
    }

    /**
     * Redondea un valor a 2 decimales.
     */
    private Double redondear(Double valor) {
        if (valor == null) return 0.0;
        return Math.round(valor * 100.0) / 100.0;
    }
}
