-- Asignar NOTA_VENTA a todos los pedidos existentes que no tienen tipo_comprobante
UPDATE pedidos SET tipo_comprobante = 'NOTA_VENTA' WHERE tipo_comprobante IS NULL;
