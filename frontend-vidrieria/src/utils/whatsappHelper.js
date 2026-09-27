/**
 * Utilidad para generación y envío de comprobantes / notas de pedido por WhatsApp
 */

export const generarMensajeWhatsApp = (pedido, estadoFormateado) => {
  if (!pedido) return '';

  const nombreCliente = (pedido.clienteNombre || 'Cliente').trim();
  const idPedido = pedido.idPedido || pedido.id || '—';
  const total = Number(pedido.total ?? 0).toFixed(2);
  const adelanto = Number(pedido.montoAdelanto ?? 0).toFixed(2);
  const saldoCalculado = pedido.saldoPendiente != null
    ? Number(pedido.saldoPendiente)
    : Math.max(0, Number(pedido.total || 0) - Number(pedido.montoAdelanto || 0));
  const saldo = saldoCalculado.toFixed(2);
  const estado = estadoFormateado || pedido.estado || 'Cotizado';

  // Formateo de lista de ítems con medidas y moldura
  let itemsTexto = '';
  if (Array.isArray(pedido.detalles) && pedido.detalles.length > 0) {
    itemsTexto = pedido.detalles
      .map((d, idx) => {
        const cant = d.cantidad && d.cantidad > 1 ? `${d.cantidad}x ` : '';
        const medidas = (d.ancho && d.alto)
          ? `${d.ancho}x${d.alto} cm`
          : (d.anchoVano && d.altoVano ? `${d.anchoVano}x${d.altoVano} cm` : '');
        const moldura = d.nombreMoldura || d.molduraNombre || '';
        const vidrio = d.nombreVidrio || d.vidrioNombre || '';

        if (medidas && moldura) {
          const textoVidrio = vidrio ? ` / Vidrio: ${vidrio}` : '';
          return `• ${cant}Cuadro ${medidas} - Moldura: ${moldura}${textoVidrio}`;
        }
        if (d.descripcion) {
          return `• ${cant}${d.descripcion}`;
        }
        if (medidas) {
          return `• ${cant}Cuadro ${medidas}`;
        }
        return `• ${cant}Ítem #${idx + 1}`;
      })
      .join('\n');
  } else if (pedido.referenciaObra) {
    itemsTexto = `• ${pedido.referenciaObra}`;
  } else {
    itemsTexto = '• Cuadro(s) a medida';
  }

  const lineaEntrega = pedido.fechaEntrega
    ? `\n📅 *Entrega estimada:* ${new Date(pedido.fechaEntrega).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '';

  return (
`*¡Hola ${nombreCliente}! Gracias por tu preferencia en Vidriería y Marquería.*
📋 *Nota de Pedido #${idPedido}*
-------------------------
${itemsTexto}
-------------------------
💰 *Total:* S/ ${total}
💵 *Adelanto:* S/ ${adelanto}
⏳ *Saldo pendiente:* S/ ${saldo}
📍 *Estado:* ${estado}${lineaEntrega}
Te avisaremos apenas tu pedido esté listo para entrega en taller.`
  );
};

export const enviarComprobanteWhatsApp = (pedido, estadoFormateado) => {
  if (!pedido) return;

  const rawTel = String(pedido.clienteTelefono || '').trim();
  let telefonoLimpio = rawTel.replace(/\D/g, '');

  // Si tiene prefijo 51 duplicado (11 dígitos peruanos), quitarlo para usar con la URL wa.me/51...
  if (telefonoLimpio.startsWith('51') && telefonoLimpio.length === 11) {
    telefonoLimpio = telefonoLimpio.substring(2);
  }

  // Validación: si no tiene teléfono o es genérico, solicitarlo amigablemente
  if (!telefonoLimpio || telefonoLimpio.length < 9 || rawTel.toLowerCase().includes('sin')) {
    const nuevoTel = window.prompt(
      `El cliente "${pedido.clienteNombre || 'Cliente'}" no tiene un número celular registrado.\nPor favor ingresa el número de WhatsApp (ej. 987654321):`,
      telefonoLimpio || ''
    );
    if (!nuevoTel) return;
    telefonoLimpio = nuevoTel.replace(/\D/g, '');
    if (telefonoLimpio.startsWith('51') && telefonoLimpio.length === 11) {
      telefonoLimpio = telefonoLimpio.substring(2);
    }
  }

  if (!telefonoLimpio) {
    alert('No se puede enviar el comprobante sin un número de teléfono válido.');
    return;
  }

  const mensaje = generarMensajeWhatsApp(pedido, estadoFormateado);
  const url = `https://wa.me/51${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};
