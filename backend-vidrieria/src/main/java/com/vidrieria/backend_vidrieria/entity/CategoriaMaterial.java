package com.vidrieria.backend_vidrieria.entity;

/**
 * Categorías oficiales de materiales en el inventario.
 */
public enum CategoriaMaterial {
    /**
     * Madera, poliestireno para cuadros y marquetería.
     */
    MOLDURA,

    /**
     * Tubos, rieles, jambas, parantes para obras y estructuras de carpintería de aluminio.
     */
    PERFIL_ALUMINIO,

    /**
     * Garruchas, cerraduras/chapas, felpas, guías, tornillos y fijaciones.
     */
    ACCESORIO,

    /**
     * Artículos de venta directa y productos terminados (espejos, cuadros armados, etc.).
     */
    PRODUCTO_ESTANDAR,

    /**
     * Cintas, siliconas, empaques, insumos generales y otros materiales de taller.
     */
    OTROS
}
