-- Asignar NOTA_VENTA a todos los pedidos existentes que no tienen tipo_comprobante
UPDATE pedidos SET tipo_comprobante = 'NOTA_VENTA' WHERE tipo_comprobante IS NULL;

-- Normalizar valores antiguos de tipo_material a las categorías oficiales (MOLDURA, PERFIL_ALUMINIO, ACCESORIO, OTROS)
UPDATE materiales SET tipo_material = 'PERFIL_ALUMINIO' WHERE UPPER(tipo_material) IN ('ALUMINIO', 'PERFIL', 'PERFILES');
UPDATE materiales SET tipo_material = 'ACCESORIO' WHERE UPPER(tipo_material) IN ('ACCESORIOS', 'HERRAJE', 'HERRAJES');
UPDATE materiales SET tipo_material = 'MOLDURA' WHERE UPPER(tipo_material) IN ('MOLDURAS', 'MADERA', 'POLIESTIRENO');
UPDATE materiales SET tipo_material = 'OTROS' WHERE tipo_material IS NULL;

-- 1. Insertar Sistemas de Carpintería estándar si no existen
INSERT INTO sistemas_carpinteria (codigo, nombre, tipo_estructura, numero_hojas, altura_maxima_recomendada, descripcion, activo)
VALUES 
('S20_2H', 'Ventana Corrediza Serie 20 (2 Hojas)', 'VENTANA_SERIE_20_2H', 2, 2.10, 'Sistema corredizo liviano tradicional de 2 hojas corredizas con felpa perimétrica y garruchas simples.', true),
('S25_2H', 'Ventana Corrediza Serie 25 (2 Hojas)', 'VENTANA_SERIE_25_2H', 2, 2.40, 'Sistema corredizo mediano de 2 hojas para vanos residenciales y comerciales.', true),
('MAMP_S25_2H', 'Mampara Corrediza Serie 25 (2 Hojas)', 'MAMPARA_SERIE_25_2H', 2, 2.60, 'Mampara corrediza pesada de aluminio Serie 25 con garruchas dobles y cerradura pico de loro.', true),
('NOVA_2H', 'Mampara Sistema Nova (2 Hojas)', 'MAMPARA_NOVA_2H', 2, 2.80, 'Mampara suspendida de cristal templado con riel superior Nova y accesorios colgantes.', true),
('FIJO_PANAL', 'Fijo Panal Perimétrico', 'FIJO_PANAL', 1, 3.00, 'Estructura fija perimétrica con canal U de aluminio y cristal sellado.', true)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Insertar Materiales básicos (perfiles y accesorios) si no existen
INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Riel Superior S20', 'PERFIL_ALUMINIO', 0.00, 65.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Riel Superior S20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Riel Inferior S20', 'PERFIL_ALUMINIO', 0.00, 65.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Riel Inferior S20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Jamba Lateral S20', 'PERFIL_ALUMINIO', 0.00, 65.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Jamba Lateral S20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Parante / Traslape de Hoja S20', 'PERFIL_ALUMINIO', 0.00, 65.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Parante / Traslape de Hoja S20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Zócalo / Cabezal de Hoja S20', 'PERFIL_ALUMINIO', 0.00, 65.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Zócalo / Cabezal de Hoja S20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Riel Superior Sistema Nova', 'PERFIL_ALUMINIO', 0.00, 85.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Riel Superior Sistema Nova');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Perfil Guía / Canal U Inferior', 'PERFIL_ALUMINIO', 0.00, 50.00, 6.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Perfil Guía / Canal U Inferior');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Garrucha / Rueda simple Serie 20', 'ACCESORIO', 5.00, 0.00, 0.00, 500.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Garrucha / Rueda simple Serie 20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Seguro Caracol para Serie 20', 'ACCESORIO', 12.00, 0.00, 0.00, 200.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Seguro Caracol para Serie 20');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Felpa perimétrica hermética', 'ACCESORIO', 2.50, 0.00, 0.00, 1000.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Felpa perimétrica hermética');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Guías de nylon / accesorios de armado', 'ACCESORIO', 2.00, 0.00, 0.00, 500.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Guías de nylon / accesorios de armado');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Tornillos autorroscantes de fijación', 'ACCESORIO', 0.35, 0.00, 0.00, 5000.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Tornillos autorroscantes de fijación');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Kit de Accesorios Colgantes Nova', 'ACCESORIO', 85.00, 0.00, 0.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Kit de Accesorios Colgantes Nova');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Cerradura central / piso Nova', 'ACCESORIO', 45.00, 0.00, 0.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Cerradura central / piso Nova');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Tirador de acero inoxidable 20cm', 'ACCESORIO', 30.00, 0.00, 0.00, 100.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Tirador de acero inoxidable 20cm');

INSERT INTO materiales (nombre, tipo_material, costo_defecto_unitario, precio_varilla, longitud_varilla, stock, activo)
SELECT 'Guía de piso y topes de nylon', 'ACCESORIO', 7.50, 0.00, 0.00, 200.0, true
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre = 'Guía de piso y topes de nylon');

-- 3. Insertar Tipos de Vidrio si no existen
INSERT INTO tipos_vidrio (nombre, descripcion, es_templado, dias_produccion, costo_defecto_m2, precio_plancha, ancho_plancha, alto_plancha, ancho_plancha_mm, alto_plancha_mm, stock, activo)
SELECT 'Cristal Templado 6mm', 'Cristal transparente templado de seguridad 6mm', true, 5, 55.00, 250.00, 2.60, 1.80, 2440.0, 3660.0, 50.0, true
WHERE NOT EXISTS (SELECT 1 FROM tipos_vidrio WHERE nombre = 'Cristal Templado 6mm');

INSERT INTO tipos_vidrio (nombre, descripcion, es_templado, dias_produccion, costo_defecto_m2, precio_plancha, ancho_plancha, alto_plancha, ancho_plancha_mm, alto_plancha_mm, stock, activo)
SELECT 'Cristal Templado 8mm', 'Cristal transparente templado de seguridad 8mm', true, 5, 75.00, 350.00, 2.60, 1.80, 2440.0, 3660.0, 50.0, true
WHERE NOT EXISTS (SELECT 1 FROM tipos_vidrio WHERE nombre = 'Cristal Templado 8mm');

-- Normalizar dimensiones estándar de fábrica en mm para vidrios existentes si son NULL
UPDATE tipos_vidrio SET ancho_plancha_mm = 2440.0 WHERE ancho_plancha_mm IS NULL;
UPDATE tipos_vidrio SET alto_plancha_mm = 3660.0 WHERE alto_plancha_mm IS NULL;

-- 4. Insertar Fórmulas de Despiece para Serie 20 (2 Hojas) si no existen
INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 1, 'ANCHO - 2', null, 'Riel Superior S20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Riel Superior S20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 1, 'ANCHO - 2', null, 'Riel Inferior S20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Riel Inferior S20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 2, 'ALTO', null, 'Jamba Lateral S20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Jamba Lateral S20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 4, 'ALTO - 35', null, 'Parante / Traslape de Hoja S20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Parante / Traslape de Hoja S20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 4, '(ANCHO / 2) - 20', null, 'Zócalo / Cabezal de Hoja S20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Zócalo / Cabezal de Hoja S20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'VIDRIO', 2, '(ANCHO / 2) - 15', 'ALTO - 75', 'Cristal Templado 6mm'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Cristal Templado 6mm');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 4, '4', null, 'Garrucha / Rueda simple Serie 20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Garrucha / Rueda simple Serie 20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 1, '1', null, 'Seguro Caracol para Serie 20'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Seguro Caracol para Serie 20');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 1, '((4 * (ALTO - 35)) + (4 * ((ANCHO / 2) - 20))) / 1000 * 1.1', null, 'Felpa perimétrica hermética'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Felpa perimétrica hermética');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 4, '4', null, 'Guías de nylon / accesorios de armado'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Guías de nylon / accesorios de armado');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 16, '16', null, 'Tornillos autorroscantes de fijación'
FROM sistemas_carpinteria s WHERE s.codigo = 'S20_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Tornillos autorroscantes de fijación');

-- 5. Insertar Fórmulas de Despiece para Mampara Nova si no existen
INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 1, 'ANCHO', null, 'Riel Superior Sistema Nova'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Riel Superior Sistema Nova');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ALUMINIO', 1, 'ANCHO', null, 'Perfil Guía / Canal U Inferior'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Perfil Guía / Canal U Inferior');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'VIDRIO', 2, '(ANCHO / 2) + 15', 'ALTO - 60', 'Cristal Templado 8mm'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Cristal Templado 8mm');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 1, '1', null, 'Kit de Accesorios Colgantes Nova'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Kit de Accesorios Colgantes Nova');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 1, '1', null, 'Cerradura central / piso Nova'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Cerradura central / piso Nova');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 1, '1', null, 'Tirador de acero inoxidable 20cm'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Tirador de acero inoxidable 20cm');

INSERT INTO formulas_despiece (id_sistema, tipo_elemento, cantidad_piezas, formula_largo, formula_alto, descripcion)
SELECT s.id_sistema, 'ACCESORIO', 2, '2', null, 'Guía de piso y topes de nylon'
FROM sistemas_carpinteria s WHERE s.codigo = 'NOVA_2H'
AND NOT EXISTS (SELECT 1 FROM formulas_despiece f WHERE f.id_sistema = s.id_sistema AND f.descripcion = 'Guía de piso y topes de nylon');

-- 6. Actualizar constraint de tipo_cobro y migrar valores en servicios_extras
ALTER TABLE servicios_extras DROP CONSTRAINT IF EXISTS servicios_extras_tipo_cobro_check;
ALTER TABLE servicios_extras ADD CONSTRAINT servicios_extras_tipo_cobro_check 
    CHECK (tipo_cobro IN ('METRO_LINEAL', 'UNIDAD', 'METRO_CUADRADO', 'GLOBAL', 'MONTO_FIJO', 'POR_METRO_LINEAL', 'POR_PIEZA'));

UPDATE servicios_extras SET tipo_cobro = 'METRO_LINEAL' WHERE tipo_cobro = 'POR_METRO_LINEAL';
UPDATE servicios_extras SET tipo_cobro = 'UNIDAD' WHERE tipo_cobro = 'POR_PIEZA';
UPDATE servicios_extras SET tipo_cobro = 'GLOBAL' WHERE tipo_cobro = 'MONTO_FIJO';

-- 7. Asegurar existencia de servicios de procesamiento de vidrio suelto (PULIDO, BISELADO, HUECOS)
INSERT INTO servicios_extras (nombre, descripcion, categoria_aplicable, tipo_cobro, precio_base, precio_sugerido, activo)
SELECT 'Canto Pulido Plano', 'Pulido de bordes para vidrios y cristales', 'VIDRIO', 'METRO_LINEAL', 5.00, 5.00, true
WHERE NOT EXISTS (SELECT 1 FROM servicios_extras WHERE UPPER(nombre) LIKE '%PULIDO%');

INSERT INTO servicios_extras (nombre, descripcion, categoria_aplicable, tipo_cobro, precio_base, precio_sugerido, activo)
SELECT 'Biselado 1 pulgada (25mm)', 'Biselado decorativo en bordes de cristal', 'VIDRIO', 'METRO_LINEAL', 12.00, 12.00, true
WHERE NOT EXISTS (SELECT 1 FROM servicios_extras WHERE UPPER(nombre) LIKE '%BISELADO%');

INSERT INTO servicios_extras (nombre, descripcion, categoria_aplicable, tipo_cobro, precio_base, precio_sugerido, activo)
SELECT 'Perforación / Hueco para Tirador', 'Hueco estándar para tiradores y accesorios', 'VIDRIO', 'UNIDAD', 8.00, 8.00, true
WHERE NOT EXISTS (SELECT 1 FROM servicios_extras WHERE UPPER(nombre) LIKE '%HUECO%' OR UPPER(nombre) LIKE '%PERFORAC%');

-- 8. Actualizar constraint de tipo_trabajo en pedidos para soportar carritos mixtos
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_tipo_trabajo_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_tipo_trabajo_check 
     CHECK (tipo_trabajo IN ('MARQUERIA', 'OBRA', 'VIDRIOS', 'MIXTO', 'GENERAL', 'VIDRIERIA'));

-- 9. Índices de Rendimiento (B-Tree) para acelerar las métricas del Dashboard
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo_comprobante ON pedidos(tipo_comprobante);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_registro ON pedidos(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_creacion ON pedidos(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_pedidos_id_vendedor ON pedidos(id_vendedor);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha_registro ON pagos(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_pagos_id_registrador ON pagos(id_usuario_registrador);



