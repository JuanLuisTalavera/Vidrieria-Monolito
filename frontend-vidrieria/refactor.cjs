const fs = require('fs');
const filePath = 'src/pages/CotizadorObrasPage.jsx';
const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);

// 1. Find imports lines
const importsStart = lines.findIndex(l => l.includes("import DiagramaVanoSVG from './components/DiagramaVanoSVG';"));
const importsEnd = lines.findIndex(l => l.includes("} from '../utils/despieceObrasHelper';"));

if (importsStart === -1 || importsEnd === -1) {
    console.error("Could not find imports");
    process.exit(1);
}

const newImports = [
  "import FormularioParametrosObra from './cotizador-obras/components/FormularioParametrosObra';",
  "import PanelResultadosObra from './cotizador-obras/components/PanelResultadosObra';",
  "import VistaImpresionObra from './cotizador-obras/components/VistaImpresionObra';",
  "import {",
  "  CRISTALES_OBRA_DEFECTO,",
  "  calcularDespieceObra,",
  "} from '../utils/despieceObrasHelper';"
];

lines.splice(importsStart, importsEnd - importsStart + 1, ...newImports);

// 2. Find return statement and inject props
const returnIdx = lines.findIndex(l => l.includes('  return ('));

const childProps = [
  "  const childProps = {",
  "    clienteDoc, setClienteDoc,",
  "    clienteNombre, setClienteNombre,",
  "    clienteTelefono, setClienteTelefono,",
  "    buscandoCliente, setBuscandoCliente,",
  "    mensajeCliente, setMensajeCliente,",
  "    anchoVanoMm, setAnchoVanoMm,",
  "    altoVanoMm, setAltoVanoMm,",
  "    tipoEstructura, setTipoEstructura,",
  "    colorAluminio, setColorAluminio,",
  "    configuracionApertura, setConfiguracionApertura,",
  "    tipoCristalId, setTipoCristalId,",
  "    vidrios, setVidrios,",
  "    longitudVarillaMm, setLongitudVarillaMm,",
  "    anchoSierraMm, setAnchoSierraMm,",
  "    margenUtilidad, setMargenUtilidad,",
  "    pestañaActiva, setPestañaActiva,",
  "    datosOptimizacion, setDatosOptimizacion,",
  "    optimizando, setOptimizando,",
  "    datosOptimizacionVidrio, setDatosOptimizacionVidrio,",
  "    optimizandoVidrio, setOptimizandoVidrio,",
  "    errorOptimizacionVidrio, setErrorOptimizacionVidrio,",
  "    guardandoCotizacion, setGuardandoCotizacion,",
  "    mensajeExito, setMensajeExito,",
  "    buscarClientePorDoc,",
  "    despiece,",
  "    ejecutarOptimizacionVidrio,",
  "    nombreCristalSeleccionado,",
  "    aplicarPresetMedida,",
  "    handleGuardarCotizacion,",
  "    handleImprimirHojaTaller",
  "  };",
  ""
];

lines.splice(returnIdx, 0, ...childProps);

// 3. Find marker and replace everything after it
const markerIdx = lines.findIndex(l => l.includes('{/* 2. Grid Principal: Formulario a la Izquierda, Pestañas a la Derecha */}'));

if (markerIdx === -1) {
    console.error("Marker not found");
    process.exit(1);
}

const newJsx = [
  "      {/* 2. Grid Principal: Formulario a la Izquierda, Pestañas a la Derecha */}",
  "      <div className=\"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start\">",
  "        <FormularioParametrosObra {...childProps} />",
  "        <PanelResultadosObra {...childProps} />",
  "      </div>",
  "",
  "      <VistaImpresionObra {...childProps} />",
  "    </div>",
  "  );",
  "}"
];

// Re-evaluate line count after additions
const markerIdxNew = lines.findIndex(l => l.includes('{/* 2. Grid Principal: Formulario a la Izquierda, Pestañas a la Derecha */}'));

lines.splice(markerIdxNew, lines.length - markerIdxNew, ...newJsx);

fs.writeFileSync(filePath, lines.join('\\n'), 'utf-8');
console.log("Success");
