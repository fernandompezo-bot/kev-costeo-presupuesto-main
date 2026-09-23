/**
 * app.js - Motor Reactivo de Presupuesto, Costeo y Generador de Documentos XLSX/DOCX
 * KEV Process SpA - 2026
 */

class KEVPresupuestoApp {
  constructor() {
    this.modo = 'cuestionario'; // 'cuestionario' | 'desarrollo'
    this.pasoCuestionario = 1;
    this.tabExcelActual = 'RESUMEN GENERAL';

    // Estado reactivo del proyecto
    this.proyecto = null;
    this.cargarPreset('101-2026'); // Carga caso base 101-2026 por defecto
  }

  init() {
    this.inicializarSelectores();
    this.render();
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Carga un preset o inicializa proyecto en blanco
  cargarPreset(id) {
    if (id === 'blanco') {
      this.proyecto = {
        cliente: "NUEVO CLIENTE",
        planta: "PLANTA",
        correlativo: "129-2026",
        titulo: "Nuevo Proyecto de Ingeniería",
        contactoCliente: "Estimados Señores",
        dolar: 950,
        uf: 40800,
        semanasOficina: 1,
        diasTerreno: 2,
        ingenieria: [
          { id: "1.4", perfil: "HH Ingeniero PLC", hh: 40, costoUnitario: 20000, comentario: "Programación inicial" }
        ],
        adicionales: [],
        integracionElectrica: [],
        equipos: [],
        flete: [
          { item: "5.01", descripcion: "Flete a terreno", unidad: "C/U", cantidad: 1, costoUnitario: 150000 }
        ],
        montaje: [],
        otros: [
          { item: "7.01", descripcion: "Estadía", unidad: "C/U", cantidad: 2, costoUnitario: 100000 },
          { item: "7.02", descripcion: "Alimentación", unidad: "C/U", cantidad: 2, costoUnitario: 50000 }
        ],
        margenes: { ...KEV_MAESTROS.margenesPorDefecto },
        hitos: JSON.parse(JSON.stringify(KEV_MAESTROS.hitosPagoEstandar))
      };
    } else if (PRESETS_PROYECTOS[id]) {
      this.proyecto = JSON.parse(JSON.stringify(PRESETS_PROYECTOS[id]));
      if (!this.proyecto.hitos) {
        this.proyecto.hitos = JSON.parse(JSON.stringify(KEV_MAESTROS.hitosPagoEstandar));
      }
      if (!this.proyecto.adicionales) {
        this.proyecto.adicionales = [];
      }
    }
    this.render();
  }

  // Inicializa datalist de clientes y catálogo de equipos
  inicializarSelectores() {
    const dl = document.getElementById('listaClientes');
    if (dl) {
      dl.innerHTML = KEV_MAESTROS.clientesFrecuentes.map(c => 
        `<option value="${c.nombre}">${c.planta}</option>`
      ).join('');
    }

    const selectEquipo = document.getElementById('selectEquipoCatalogo');
    if (selectEquipo) {
      selectEquipo.innerHTML = KEV_MAESTROS.catalogoEquiposFrecuentes.map((eq, idx) => 
        `<option value="${idx}">[${eq.codigo}] ${eq.descripcion} (Lista: $${eq.listaUSD} USD / Grupo: ${eq.grupo})</option>`
      ).join('');
    }
  }

  // Alterna entre Modo Cuestionario y Modo Desarrollo
  setModo(nuevoModo) {
    this.modo = nuevoModo;
    const btnC = document.getElementById('btnModoCuestionario');
    const btnD = document.getElementById('btnModoDesarrollo');
    const vC = document.getElementById('vistaCuestionario');
    const vD = document.getElementById('vistaDesarrollo');

    if (nuevoModo === 'cuestionario') {
      btnC.classList.add('active');
      btnD.classList.remove('active');
      vC.classList.remove('hidden');
      vD.classList.add('hidden');
    } else {
      btnD.classList.add('active');
      btnC.classList.remove('active');
      vD.classList.remove('hidden');
      vC.classList.add('hidden');
      this.renderModoDesarrollo();
    }
    if (window.lucide) lucide.createIcons();
  }

  irAPasoCuestionario(num) {
    this.pasoCuestionario = num;
    for (let i = 1; i <= 7; i++) {
      const pane = document.getElementById(`pasoContenido${i}`);
      const nav = document.getElementById(`stepNav${i}`);
      if (pane) {
        if (i === num) {
          pane.classList.remove('hidden');
          nav.classList.add('active');
        } else {
          pane.classList.add('hidden');
          nav.classList.remove('active');
        }
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  // =========================================================================
  // MOTOR DE CÁLCULO FINANCIERO Y REACTIVIDAD
  // =========================================================================
  calcularTotales() {
    const p = this.proyecto;
    const dolar = Number(p.dolar) || 950;
    const margenes = p.margenes;

    // 1. Ingeniería
    let costoIngenieria = 0;
    let totalHH = 0;
    p.ingenieria.forEach(row => {
      const hh = Number(row.hh) || 0;
      const cu = Number(row.costoUnitario) || 0;
      totalHH += hh;
      costoIngenieria += hh * cu;
    });
    const precioIngenieria = Math.round(costoIngenieria / (1 - margenes.ingenieria));

    // 2. Adicionales
    let costoAdicionales = 0;
    p.adicionales.forEach(row => {
      costoAdicionales += Number(row.costo) || 0;
    });
    const precioAdicionales = Math.round(costoAdicionales / (1 - margenes.adicionales));

    // 3. Integración Eléctrica
    let costoIntegracion = 0;
    p.integracionElectrica.forEach(row => {
      const cant = Number(row.cantidad) || 0;
      const cu = Number(row.costoUnitario) || 0;
      costoIntegracion += cant * cu;
    });
    const precioIntegracion = Math.round(costoIntegracion / (1 - margenes.integracion));

    // 4. Equipos
    let costoEquipos = 0;
    let precioEquipos = 0;
    p.equipos.forEach(eq => {
      const cant = Number(eq.cantidad) || 0;
      let costoUnitCLP = 0;

      if (eq.listaUSD > 0) {
        const descInfo = KEV_MAESTROS.descuentosSiemens[eq.grupo] || { descuento: 0 };
        const factorDesc = 1 - descInfo.descuento;
        const costoUnitUSD = eq.listaUSD * factorDesc;
        costoUnitCLP = Math.round(costoUnitUSD * dolar);
      } else {
        costoUnitCLP = Number(eq.costoCLP) || 0;
      }

      const totalFilaCosto = costoUnitCLP * cant;
      costoEquipos += totalFilaCosto;
      precioEquipos += Math.round(costoUnitCLP / (1 - margenes.equipos)) * cant;
    });

    // 5. Flete
    let costoFlete = 0;
    p.flete.forEach(fl => {
      const cant = Number(fl.cantidad) || 0;
      const cu = Number(fl.costoUnitario) || 0;
      costoFlete += cant * cu;
    });
    const precioFlete = Math.round(costoFlete / (1 - margenes.flete));

    // 6. Montaje
    let costoMontaje = 0;
    p.montaje.forEach(m => {
      const cant = Number(m.cantidad) || 0;
      const cu = Number(m.costoUnitario) || 0;
      costoMontaje += cant * cu;
    });
    const precioMontaje = Math.round(costoMontaje / (1 - margenes.montaje));

    // 7. Otros (Logística/Terreno)
    let costoOtros = 0;
    p.otros.forEach(ot => {
      const cant = Number(ot.cantidad) || 0;
      const cu = Number(ot.costoUnitario) || 0;
      costoOtros += cant * cu;
    });
    const precioOtros = Math.round(costoOtros / (1 - margenes.otros));

    // Consolidado Total Proyecto
    const costoTotalProyecto = costoIngenieria + costoAdicionales + costoIntegracion + costoEquipos + costoFlete + costoMontaje + costoOtros;
    const precioTotalProyecto = precioIngenieria + precioAdicionales + precioIntegracion + precioEquipos + precioFlete + precioMontaje + precioOtros;
    const margenConsolidado = precioTotalProyecto > 0 ? (precioTotalProyecto - costoTotalProyecto) / precioTotalProyecto : 0;
    const precioTotalUSD = dolar > 0 ? Math.round(precioTotalProyecto / dolar) : 0;

    return {
      costoIngenieria, precioIngenieria, totalHH,
      costoAdicionales, precioAdicionales,
      costoIntegracion, precioIntegracion,
      costoEquipos, precioEquipos,
      costoFlete, precioFlete,
      costoMontaje, precioMontaje,
      costoOtros, precioOtros,
      costoTotalProyecto,
      precioTotalProyecto,
      margenConsolidado,
      precioTotalUSD
    };
  }

  // =========================================================================
  // RENDERIZADO GENERAL Y VISTAS
  // =========================================================================
  render() {
    const p = this.proyecto;
    const calc = this.calcularTotales();

    // Actualizar KPI Bar
    this.setElemText('kpiClienteCorrelativo', `${p.cliente} | ${p.correlativo}`);
    this.setElemText('kpiCostoTotal', this.fmtCLP(calc.costoTotalProyecto));
    this.setElemText('kpiMargenConsolidado', `${(calc.margenConsolidado * 100).toFixed(1)}%`);
    this.setElemText('kpiPrecioCLP', this.fmtCLP(calc.precioTotalProyecto));
    this.setElemText('kpiPrecioUSD', `$ ${calc.precioTotalUSD.toLocaleString('es-CL')} USD`);

    // Actualizar inputs generales
    this.setElemVal('q_cliente', p.cliente);
    this.setElemVal('q_planta', p.planta);
    this.setElemVal('q_correlativo', p.correlativo);
    this.setElemVal('q_titulo', p.titulo);
    this.setElemVal('q_contacto', p.contactoCliente);
    this.setElemVal('q_semanasOficina', p.semanasOficina);
    this.setElemVal('q_diasTerreno', p.diasTerreno);
    this.setElemVal('inputDolar', p.dolar);
    this.setElemVal('inputUF', p.uf);

    // Actualizar Paso 2 (HH)
    this.setElemText('q_totalHH', `${calc.totalHH} HH`);
    this.setElemText('q_costoIngenieria', this.fmtCLP(calc.costoIngenieria));
    this.renderTablaIngenieriaCuestionario();

    // Actualizar Paso 3 (Equipos)
    this.setElemText('q_totalEquiposCLP', this.fmtCLP(calc.costoEquipos));
    this.renderTablaEquiposCuestionario();

    // Actualizar Paso 4 (Integración)
    this.setElemText('q_totalIntegracionCLP', this.fmtCLP(calc.costoIntegracion));
    this.renderTablaIntegracionCuestionario();

    // Actualizar Paso 5 (Logística)
    this.setElemText('q_totalOtrosCLP', this.fmtCLP(calc.costoOtros));
    this.setElemText('q_totalFleteCLP', this.fmtCLP(calc.costoFlete));
    this.setElemText('q_totalMontajeCLP', this.fmtCLP(calc.costoMontaje));
    this.renderTablasLogisticaCuestionario();

    // Actualizar Paso 6 (Márgenes)
    this.actualizarSlidersMargen();
    this.setElemText('resumenEquiposVenta', this.fmtCLP(calc.precioEquipos));
    this.setElemText('resumenIngenieriaVenta', this.fmtCLP(calc.precioIngenieria + calc.precioIntegracion));
    this.setElemText('resumenLogisticaVenta', this.fmtCLP(calc.precioFlete + calc.precioOtros + calc.precioMontaje));
    this.setElemText('resumenTotalVentaCLP', this.fmtCLP(calc.precioTotalProyecto));
    this.setElemText('resumenTotalVentaUSD', `$ ${calc.precioTotalUSD.toLocaleString('es-CL')} USD`);
    this.setElemText('resumenMargenGlobal', `${(calc.margenConsolidado * 100).toFixed(1)}%`);
    this.setElemText('resumenUtilidadBruta', this.fmtCLP(calc.precioTotalProyecto - calc.costoTotalProyecto));

    // Actualizar Paso 7 (Hitos)
    this.renderTablaHitosPago(calc.precioTotalProyecto);
    this.renderBasesLegales();

    // Si está en Modo Desarrollo, refrescar la grilla matricial
    if (this.modo === 'desarrollo') {
      this.renderModoDesarrollo();
    }

    if (window.lucide) lucide.createIcons();
  }

  // --- RENDER TABLAS CUESTIONARIO ---

  renderTablaIngenieriaCuestionario() {
    const tbody = document.getElementById('tbodyIngenieriaCuestionario');
    if (!tbody) return;
    tbody.innerHTML = this.proyecto.ingenieria.map((row, idx) => `
      <tr>
        <td class="font-mono text-slate-500 text-xs">${row.id}</td>
        <td>
          <input type="text" value="${row.perfil}" onchange="app.actualizarFilaIngenieria(${idx}, 'perfil', this.value)" class="font-semibold text-xs">
        </td>
        <td>
          <input type="number" value="${row.hh}" min="0" onchange="app.actualizarFilaIngenieria(${idx}, 'hh', this.value)" class="text-right font-mono font-bold text-xs">
        </td>
        <td>
          <input type="number" value="${row.costoUnitario}" min="0" step="500" onchange="app.actualizarFilaIngenieria(${idx}, 'costoUnitario', this.value)" class="text-right font-mono text-xs">
        </td>
        <td class="text-right font-mono font-bold text-slate-700 text-xs">
          ${this.fmtCLP(row.hh * row.costoUnitario)}
        </td>
        <td>
          <input type="text" value="${row.comentario || ''}" placeholder="Ej: 2 Semanas..." onchange="app.actualizarFilaIngenieria(${idx}, 'comentario', this.value)" class="text-xs text-slate-600">
        </td>
        <td class="text-center">
          <button onclick="app.eliminarFilaIngenieria(${idx})" class="text-red-500 hover:text-red-700 text-xs font-bold" title="Eliminar fila">&times;</button>
        </td>
      </tr>
    `).join('');
  }

  renderTablaEquiposCuestionario() {
    const tbody = document.getElementById('tbodyEquiposCuestionario');
    if (!tbody) return;
    const p = this.proyecto;
    const dolar = Number(p.dolar) || 950;

    tbody.innerHTML = p.equipos.map((eq, idx) => {
      const cant = Number(eq.cantidad) || 0;
      let costoUnitUSD = 0;
      let costoUnitCLP = 0;

      if (eq.listaUSD > 0) {
        const descInfo = KEV_MAESTROS.descuentosSiemens[eq.grupo] || { descuento: 0 };
        costoUnitUSD = eq.listaUSD * (1 - descInfo.descuento);
        costoUnitCLP = Math.round(costoUnitUSD * dolar);
      } else {
        costoUnitCLP = Number(eq.costoCLP) || 0;
      }
      const totalCLP = costoUnitCLP * cant;

      const gruposOptions = Object.keys(KEV_MAESTROS.descuentosSiemens).map(g => 
        `<option value="${g}" ${eq.grupo === g ? 'selected' : ''}>${g} (${(KEV_MAESTROS.descuentosSiemens[g].descuento * 100).toFixed(0)}%)</option>`
      ).join('');

      return `
        <tr>
          <td class="font-mono text-slate-500 text-xs">${eq.item}</td>
          <td>
            <input type="text" value="${eq.codigo}" onchange="app.actualizarFilaEquipo(${idx}, 'codigo', this.value)" class="font-mono font-bold text-xs text-blue-900">
          </td>
          <td>
            <input type="text" value="${eq.descripcion}" onchange="app.actualizarFilaEquipo(${idx}, 'descripcion', this.value)" class="text-xs">
          </td>
          <td>
            <select onchange="app.actualizarFilaEquipo(${idx}, 'grupo', this.value)" class="text-xs font-mono font-semibold text-slate-700">
              ${gruposOptions}
            </select>
          </td>
          <td>
            <input type="number" value="${eq.listaUSD || 0}" step="0.01" onchange="app.actualizarFilaEquipo(${idx}, 'listaUSD', this.value)" class="text-right font-mono text-xs">
          </td>
          <td>
            <input type="number" value="${eq.cantidad}" min="0" onchange="app.actualizarFilaEquipo(${idx}, 'cantidad', this.value)" class="text-right font-mono font-bold text-xs">
          </td>
          <td class="text-right font-mono text-xs text-slate-600">
            ${eq.listaUSD > 0 ? '$ ' + costoUnitUSD.toFixed(2) : '-'}
          </td>
          <td class="text-right font-mono text-xs text-slate-700">
            ${eq.listaUSD === 0 ? `<input type="number" value="${eq.costoCLP || 0}" onchange="app.actualizarFilaEquipo(${idx}, 'costoCLP', this.value)" class="text-right font-mono text-xs">` : this.fmtCLP(costoUnitCLP)}
          </td>
          <td class="text-right font-mono font-bold text-blue-900 text-xs">
            ${this.fmtCLP(totalCLP)}
          </td>
          <td class="text-center">
            <button onclick="app.eliminarFilaEquipo(${idx})" class="text-red-500 hover:text-red-700 text-xs font-bold" title="Eliminar">&times;</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderTablaIntegracionCuestionario() {
    const tbody = document.getElementById('tbodyIntegracionCuestionario');
    if (!tbody) return;
    tbody.innerHTML = this.proyecto.integracionElectrica.map((row, idx) => `
      <tr>
        <td class="font-mono text-slate-500 text-xs">${row.id}</td>
        <td>
          <input type="text" value="${row.descripcion}" onchange="app.actualizarFilaIntegracion(${idx}, 'descripcion', this.value)" class="text-xs">
        </td>
        <td>
          <input type="text" value="${row.unidad}" onchange="app.actualizarFilaIntegracion(${idx}, 'unidad', this.value)" class="text-xs text-center">
        </td>
        <td>
          <input type="number" value="${row.cantidad}" min="0" onchange="app.actualizarFilaIntegracion(${idx}, 'cantidad', this.value)" class="text-right font-mono font-bold text-xs">
        </td>
        <td>
          <input type="number" value="${row.costoUnitario}" min="0" step="500" onchange="app.actualizarFilaIntegracion(${idx}, 'costoUnitario', this.value)" class="text-right font-mono text-xs">
        </td>
        <td class="text-right font-mono font-bold text-slate-700 text-xs">
          ${this.fmtCLP(row.cantidad * row.costoUnitario)}
        </td>
        <td class="text-center">
          <button onclick="app.eliminarFilaIntegracion(${idx})" class="text-red-500 hover:text-red-700 text-xs font-bold">&times;</button>
        </td>
      </tr>
    `).join('');
  }

  renderTablasLogisticaCuestionario() {
    // Otros (Viáticos)
    const tbodyOtros = document.getElementById('tbodyOtrosCuestionario');
    if (tbodyOtros) {
      tbodyOtros.innerHTML = this.proyecto.otros.map((ot, idx) => `
        <tr>
          <td class="text-xs">${ot.descripcion}</td>
          <td>
            <input type="number" value="${ot.cantidad}" min="0" onchange="app.actualizarFilaOtros(${idx}, 'cantidad', this.value)" class="text-right font-mono font-bold text-xs">
          </td>
          <td>
            <input type="number" value="${ot.costoUnitario}" min="0" step="5000" onchange="app.actualizarFilaOtros(${idx}, 'costoUnitario', this.value)" class="text-right font-mono text-xs">
          </td>
          <td class="text-right font-mono font-bold text-xs">${this.fmtCLP(ot.cantidad * ot.costoUnitario)}</td>
        </tr>
      `).join('');
    }

    // Fletes
    const tbodyFlete = document.getElementById('tbodyFleteCuestionario');
    if (tbodyFlete) {
      tbodyFlete.innerHTML = this.proyecto.flete.map((fl, idx) => `
        <tr>
          <td><input type="text" value="${fl.descripcion}" onchange="app.actualizarFilaFlete(${idx}, 'descripcion', this.value)" class="text-xs"></td>
          <td><input type="number" value="${fl.cantidad}" min="0" onchange="app.actualizarFilaFlete(${idx}, 'cantidad', this.value)" class="text-right font-mono font-bold text-xs"></td>
          <td><input type="number" value="${fl.costoUnitario}" min="0" step="10000" onchange="app.actualizarFilaFlete(${idx}, 'costoUnitario', this.value)" class="text-right font-mono text-xs"></td>
          <td class="text-right font-mono font-bold text-xs">${this.fmtCLP(fl.cantidad * fl.costoUnitario)}</td>
        </tr>
      `).join('');
    }

    // Montajes
    const tbodyMontaje = document.getElementById('tbodyMontajeCuestionario');
    if (tbodyMontaje) {
      tbodyMontaje.innerHTML = this.proyecto.montaje.map((m, idx) => `
        <tr>
          <td><input type="text" value="${m.descripcion}" onchange="app.actualizarFilaMontaje(${idx}, 'descripcion', this.value)" class="text-xs"></td>
          <td><input type="number" value="${m.cantidad}" min="0" onchange="app.actualizarFilaMontaje(${idx}, 'cantidad', this.value)" class="text-right font-mono font-bold text-xs"></td>
          <td><input type="number" value="${m.costoUnitario}" min="0" step="10000" onchange="app.actualizarFilaMontaje(${idx}, 'costoUnitario', this.value)" class="text-right font-mono text-xs"></td>
          <td class="text-right font-mono font-bold text-xs">${this.fmtCLP(m.cantidad * m.costoUnitario)}</td>
        </tr>
      `).join('');
    }
  }

  actualizarSlidersMargen() {
    const m = this.proyecto.margenes;
    this.setElemVal('sliderMargenIngenieria', Math.round(m.ingenieria * 100));
    this.setElemText('lblMargenIngenieria', `${Math.round(m.ingenieria * 100)}%`);

    this.setElemVal('sliderMargenIntegracion', Math.round(m.integracion * 100));
    this.setElemText('lblMargenIntegracion', `${Math.round(m.integracion * 100)}%`);

    this.setElemVal('sliderMargenEquipos', Math.round(m.equipos * 100));
    this.setElemText('lblMargenEquipos', `${Math.round(m.equipos * 100)}%`);

    this.setElemVal('sliderMargenFlete', Math.round(m.flete * 100));
    this.setElemText('lblMargenFlete', `${Math.round(m.flete * 100)}%`);

    this.setElemVal('sliderMargenOtros', Math.round(m.otros * 100));
    this.setElemText('lblMargenOtros', `${Math.round(m.otros * 100)}%`);
  }

  ajustarMargen(categoria, valPct) {
    this.proyecto.margenes[categoria] = Number(valPct) / 100;
    this.render();
  }

  renderTablaHitosPago(precioTotal) {
    const tbody = document.getElementById('tbodyHitosPago');
    if (!tbody) return;
    let totalPct = 0;
    let totalMonto = 0;

    tbody.innerHTML = this.proyecto.hitos.map((h, idx) => {
      const pct = Number(h.porcentaje) || 0;
      totalPct += pct;
      const montoHito = Math.round(precioTotal * (pct / 100));
      totalMonto += montoHito;

      return `
        <tr>
          <td class="font-mono font-bold text-xs text-blue-900">${h.ep}</td>
          <td>
            <input type="text" value="${h.hito}" onchange="app.actualizarHito(${idx}, 'hito', this.value)" class="text-xs">
          </td>
          <td>
            <input type="number" value="${h.porcentaje}" min="0" max="100" onchange="app.actualizarHito(${idx}, 'porcentaje', this.value)" class="text-right font-mono font-bold text-xs">
          </td>
          <td class="text-right font-mono font-bold text-slate-800 text-xs">
            ${this.fmtCLP(montoHito)}
          </td>
        </tr>
      `;
    }).join('');

    this.setElemText('q_totalPctHitos', `${totalPct}%`);
    this.setElemText('q_totalMontoHitos', this.fmtCLP(totalMonto));
  }

  renderBasesLegales() {
    const cont = document.getElementById('contenedorBasesLegales');
    if (!cont) return;
    cont.innerHTML = KEV_MAESTROS.basesLegalesGarantia.map(b => `
      <div class="border-b pb-2">
        <strong class="text-slate-800 font-bold block mb-0.5">${b.titulo}</strong>
        <p class="text-slate-600 text-xs">${b.texto}</p>
      </div>
    `).join('');
  }

  // =========================================================================
  // MODO DESARROLLO (PLANILLA MATRICIAL 9 PESTAÑAS)
  // =========================================================================
  setExcelTab(nombreTab) {
    this.tabExcelActual = nombreTab;
    document.querySelectorAll('.excel-tab').forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === nombreTab);
    });
    this.renderModoDesarrollo();
  }

  renderModoDesarrollo() {
    const tab = this.tabExcelActual;
    const tabResumen = document.getElementById('tabGrid_RESUMEN GENERAL');
    const tabGenerico = document.getElementById('tabGrid_Generico');
    const calc = this.calcularTotales();

    if (tab === 'RESUMEN GENERAL') {
      tabResumen.classList.remove('hidden');
      tabGenerico.classList.add('hidden');
      this.renderGridResumenGeneral(calc);
    } else {
      tabResumen.classList.add('hidden');
      tabGenerico.classList.remove('hidden');
      this.renderGridGenerico(tab, calc);
    }
  }

  renderGridResumenGeneral(calc) {
    const tbody = document.getElementById('gridTbodyResumenGeneral');
    const m = this.proyecto.margenes;

    const filas = [
      { item: "1,0", desc: "Ingeniería y planificación", costo: calc.costoIngenieria, margen: m.ingenieria, precio: calc.precioIngenieria },
      { item: "2,0", desc: "Adicionales", costo: calc.costoAdicionales, margen: m.adicionales, precio: calc.precioAdicionales },
      { item: "3,0", desc: "Integración Eléctrica", costo: calc.costoIntegracion, margen: m.integracion, precio: calc.precioIntegracion },
      { item: "4,0", desc: "Equipos", costo: calc.costoEquipos, margen: m.equipos, precio: calc.precioEquipos },
      { item: "5,0", desc: "Flete", costo: calc.costoFlete, margen: m.flete, precio: calc.precioFlete },
      { item: "6,0", desc: "Montaje y Puesta en Marcha", costo: calc.costoMontaje, margen: m.montaje, precio: calc.precioMontaje },
      { item: "7,0", desc: "Otros: Viajes, visitas a terreno, levantamientos", costo: calc.costoOtros, margen: m.otros, precio: calc.precioOtros }
    ];

    tbody.innerHTML = filas.map(f => {
      const precioUSD = this.proyecto.dolar > 0 ? Math.round(f.precio / this.proyecto.dolar) : 0;
      return `
        <tr>
          <td class="font-mono text-xs text-slate-500">${f.item}</td>
          <td class="font-semibold text-xs text-slate-800">${f.desc}</td>
          <td class="text-right font-mono font-bold text-xs text-slate-800">${this.fmtCLP(f.costo)}</td>
          <td class="text-right font-mono text-xs text-blue-600">${(f.margen * 100).toFixed(0)}%</td>
          <td class="text-right font-mono font-extrabold text-xs text-slate-900">${this.fmtCLP(f.precio)}</td>
          <td class="text-right font-mono font-semibold text-xs text-emerald-800">$ ${precioUSD.toLocaleString('es-CL')}</td>
        </tr>
      `;
    }).join('');

    this.setElemText('gridResumenTotalCosto', this.fmtCLP(calc.costoTotalProyecto));
    this.setElemText('gridResumenMargenTotal', `${(calc.margenConsolidado * 100).toFixed(1)}%`);
    this.setElemText('gridResumenTotalPrecioCLP', this.fmtCLP(calc.precioTotalProyecto));
    this.setElemText('gridResumenTotalPrecioUSD', `$ ${calc.precioTotalUSD.toLocaleString('es-CL')}`);

    // Desglose P&PEM vs Equipos
    this.setElemText('gridDesgloseEquipos', this.fmtCLP(calc.precioEquipos));
    this.setElemText('gridDesglosePPEM', this.fmtCLP(calc.precioIngenieria + calc.precioIntegracion));
    this.setElemText('gridDesgloseLogistica', this.fmtCLP(calc.precioFlete + calc.precioOtros + calc.precioMontaje));
    this.setElemText('gridDesgloseTotal', this.fmtCLP(calc.precioTotalProyecto));
  }

  renderGridGenerico(nombreTab, calc) {
    const titulo = document.getElementById('tituloTabGenerico');
    const cont = document.getElementById('contenedorTabGenerico');
    titulo.textContent = `Pestaña: ${nombreTab}`;

    if (nombreTab === 'Ingeniería y Planificación') {
      cont.innerHTML = `
        <table class="excel-table">
          <thead>
            <tr>
              <th style="width: 70px;">ITEM</th>
              <th>DESCRIPCIÓN</th>
              <th style="width: 80px;">UNIDAD</th>
              <th style="width: 100px;" class="text-right">CANTIDAD</th>
              <th style="width: 140px;" class="text-right">COSTO UNIT.</th>
              <th style="width: 150px;" class="text-right">COSTO</th>
              <th>OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            ${this.proyecto.ingenieria.map((r, i) => `
              <tr>
                <td class="font-mono text-xs">${r.id}</td>
                <td><input type="text" value="${r.perfil}" onchange="app.actualizarFilaIngenieria(${i}, 'perfil', this.value)" class="text-xs"></td>
                <td class="text-center font-mono text-xs">HH</td>
                <td><input type="number" value="${r.hh}" onchange="app.actualizarFilaIngenieria(${i}, 'hh', this.value)" class="text-right font-mono text-xs"></td>
                <td><input type="number" value="${r.costoUnitario}" onchange="app.actualizarFilaIngenieria(${i}, 'costoUnitario', this.value)" class="text-right font-mono text-xs"></td>
                <td class="text-right font-mono font-bold text-xs">${this.fmtCLP(r.hh * r.costoUnitario)}</td>
                <td><input type="text" value="${r.comentario || ''}" onchange="app.actualizarFilaIngenieria(${i}, 'comentario', this.value)" class="text-xs"></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="5" class="text-right font-bold">COSTO TOTAL INGENIERÍA:</td>
              <td class="text-right font-mono font-extrabold text-blue-900">${this.fmtCLP(calc.costoIngenieria)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (nombreTab === 'Equipos') {
      cont.innerHTML = `
        <table class="excel-table">
          <thead>
            <tr>
              <th style="width: 50px;">ITEM</th>
              <th style="width: 160px;">CÓDIGO</th>
              <th>DESCRIPCIÓN</th>
              <th style="width: 90px;">GRUPO</th>
              <th style="width: 110px;" class="text-right">LISTA USD</th>
              <th style="width: 60px;">UNID</th>
              <th style="width: 60px;">CANT</th>
              <th style="width: 120px;" class="text-right">COSTO CLP</th>
              <th style="width: 130px;" class="text-right">TOTAL CLP</th>
            </tr>
          </thead>
          <tbody>
            ${this.proyecto.equipos.map((eq, i) => {
              const cant = Number(eq.cantidad) || 0;
              let cuCLP = 0;
              if (eq.listaUSD > 0) {
                const desc = (KEV_MAESTROS.descuentosSiemens[eq.grupo] || { descuento: 0 }).descuento;
                cuCLP = Math.round(eq.listaUSD * (1 - desc) * this.proyecto.dolar);
              } else {
                cuCLP = Number(eq.costoCLP) || 0;
              }
              return `
                <tr>
                  <td class="font-mono text-xs">${eq.item}</td>
                  <td><input type="text" value="${eq.codigo}" onchange="app.actualizarFilaEquipo(${i}, 'codigo', this.value)" class="font-mono text-xs"></td>
                  <td><input type="text" value="${eq.descripcion}" onchange="app.actualizarFilaEquipo(${i}, 'descripcion', this.value)" class="text-xs"></td>
                  <td><input type="text" value="${eq.grupo}" onchange="app.actualizarFilaEquipo(${i}, 'grupo', this.value)" class="font-mono text-xs text-center"></td>
                  <td><input type="number" value="${eq.listaUSD || 0}" onchange="app.actualizarFilaEquipo(${i}, 'listaUSD', this.value)" class="text-right font-mono text-xs"></td>
                  <td class="text-center text-xs">CU</td>
                  <td><input type="number" value="${eq.cantidad}" onchange="app.actualizarFilaEquipo(${i}, 'cantidad', this.value)" class="text-right font-mono text-xs"></td>
                  <td class="text-right font-mono text-xs">${this.fmtCLP(cuCLP)}</td>
                  <td class="text-right font-mono font-bold text-xs text-blue-900">${this.fmtCLP(cuCLP * cant)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="8" class="text-right font-bold">TOTAL EQUIPOS:</td>
              <td class="text-right font-mono font-extrabold text-blue-900">${this.fmtCLP(calc.costoEquipos)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (nombreTab === 'Listado') {
      cont.innerHTML = `
        <div class="mb-2 text-xs text-slate-500 font-semibold">Lista de Suministro para Cliente (con Márgenes Aplicados):</div>
        <table class="excel-table">
          <thead>
            <tr>
              <th style="width: 40px;">N°</th>
              <th>DESCRIPCIÓN</th>
              <th style="width: 60px;" class="text-right">CANT.</th>
              <th style="width: 140px;" class="text-right">VALOR VENTA UNIT.</th>
              <th style="width: 150px;" class="text-right">VALOR VENTA TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${this.proyecto.equipos.map((eq, i) => {
              const cant = Number(eq.cantidad) || 0;
              let cuCLP = 0;
              if (eq.listaUSD > 0) {
                const desc = (KEV_MAESTROS.descuentosSiemens[eq.grupo] || { descuento: 0 }).descuento;
                cuCLP = Math.round(eq.listaUSD * (1 - desc) * this.proyecto.dolar);
              } else {
                cuCLP = Number(eq.costoCLP) || 0;
              }
              const ventaUnit = Math.round(cuCLP / (1 - this.proyecto.margenes.equipos));
              return `
                <tr>
                  <td class="font-mono text-xs text-center">${i + 1}</td>
                  <td class="font-semibold text-xs text-slate-800">${eq.codigo} - ${eq.descripcion}</td>
                  <td class="text-right font-mono text-xs">${cant}</td>
                  <td class="text-right font-mono text-xs">${this.fmtCLP(ventaUnit)}</td>
                  <td class="text-right font-mono font-bold text-xs text-slate-900">${this.fmtCLP(ventaUnit * cant)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="4" class="text-right font-bold">TOTAL VENTA EQUIPOS:</td>
              <td class="text-right font-mono font-extrabold text-emerald-800">${this.fmtCLP(calc.precioEquipos)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      // Otros tabs genéricos (Flete, Montaje, Otros, Integración, Adicionales)
      let dataArray = [];
      if (nombreTab === 'Integración Eléctrica') dataArray = this.proyecto.integracionElectrica;
      else if (nombreTab === 'Flete') dataArray = this.proyecto.flete;
      else if (nombreTab === 'Montaje') dataArray = this.proyecto.montaje;
      else if (nombreTab === 'Otros') dataArray = this.proyecto.otros;
      else if (nombreTab === 'Adicionales') dataArray = this.proyecto.adicionales;

      cont.innerHTML = `
        <table class="excel-table">
          <thead>
            <tr>
              <th style="width: 70px;">ITEM</th>
              <th>DESCRIPCIÓN</th>
              <th style="width: 80px;">UNIDAD</th>
              <th style="width: 100px;" class="text-right">CANTIDAD</th>
              <th style="width: 140px;" class="text-right">COSTO UNIT.</th>
              <th style="width: 150px;" class="text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${dataArray.map((r, i) => `
              <tr>
                <td class="font-mono text-xs">${r.item || r.id || (i + 1)}</td>
                <td><input type="text" value="${r.descripcion}" onchange="app.actualizarFilaGenerica('${nombreTab}', ${i}, 'descripcion', this.value)" class="text-xs"></td>
                <td class="text-center font-mono text-xs">${r.unidad || 'C/U'}</td>
                <td><input type="number" value="${r.cantidad || 1}" onchange="app.actualizarFilaGenerica('${nombreTab}', ${i}, 'cantidad', this.value)" class="text-right font-mono text-xs"></td>
                <td><input type="number" value="${r.costoUnitario || r.costo || 0}" onchange="app.actualizarFilaGenerica('${nombreTab}', ${i}, 'costoUnitario', this.value)" class="text-right font-mono text-xs"></td>
                <td class="text-right font-mono font-bold text-xs">${this.fmtCLP((r.cantidad || 1) * (r.costoUnitario || r.costo || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // --- MÉTODOS DE MUTACIÓN Y ACTUALIZACIÓN ---

  actualizarDato(campo, valor) {
    this.proyecto[campo] = valor;
    this.render();
  }

  actualizarParametro(campo, valor) {
    this.proyecto[campo] = Number(valor) || 0;
    this.render();
  }

  actualizarFilaIngenieria(idx, campo, valor) {
    if (campo === 'hh' || campo === 'costoUnitario') valor = Number(valor) || 0;
    this.proyecto.ingenieria[idx][campo] = valor;
    this.render();
  }

  agregarFilaIngenieria() {
    this.proyecto.ingenieria.push({
      id: `1.${this.proyecto.ingenieria.length + 1}`,
      perfil: "Nuevo Perfil HH",
      hh: 20,
      costoUnitario: 20000,
      comentario: ""
    });
    this.render();
  }

  eliminarFilaIngenieria(idx) {
    this.proyecto.ingenieria.splice(idx, 1);
    this.render();
  }

  actualizarFilaEquipo(idx, campo, valor) {
    if (campo === 'listaUSD' || campo === 'cantidad' || campo === 'costoCLP') valor = Number(valor) || 0;
    this.proyecto.equipos[idx][campo] = valor;
    this.render();
  }

  agregarFilaEquipo() {
    this.proyecto.equipos.push({
      item: `4.${String(this.proyecto.equipos.length + 1).padStart(2, '0')}`,
      codigo: "NUEVO-CODIGO",
      descripcion: "Descripción del equipo o insumo",
      grupo: "XG",
      listaUSD: 100,
      unidad: "CU",
      cantidad: 1,
      costoCLP: 0
    });
    this.render();
  }

  agregarDesdeCatalogo() {
    const sel = document.getElementById('selectEquipoCatalogo');
    if (!sel) return;
    const catItem = KEV_MAESTROS.catalogoEquiposFrecuentes[Number(sel.value)];
    if (!catItem) return;

    this.proyecto.equipos.push({
      item: `4.${String(this.proyecto.equipos.length + 1).padStart(2, '0')}`,
      codigo: catItem.codigo,
      descripcion: catItem.descripcion,
      grupo: catItem.grupo,
      listaUSD: catItem.listaUSD,
      unidad: catItem.unidad,
      cantidad: 1,
      costoCLP: catItem.costoCLP || 0
    });
    this.render();
  }

  eliminarFilaEquipo(idx) {
    this.proyecto.equipos.splice(idx, 1);
    this.render();
  }

  actualizarFilaIntegracion(idx, campo, valor) {
    if (campo === 'cantidad' || campo === 'costoUnitario') valor = Number(valor) || 0;
    this.proyecto.integracionElectrica[idx][campo] = valor;
    this.render();
  }

  agregarFilaIntegracion() {
    this.proyecto.integracionElectrica.push({
      id: `3.${String(this.proyecto.integracionElectrica.length + 1).padStart(2, '0')}`,
      descripcion: "Nuevo ítem de taller / canalización",
      unidad: "HH",
      cantidad: 10,
      costoUnitario: 17000
    });
    this.render();
  }

  eliminarFilaIntegracion(idx) {
    this.proyecto.integracionElectrica.splice(idx, 1);
    this.render();
  }

  actualizarFilaOtros(idx, campo, valor) {
    this.proyecto.otros[idx][campo] = Number(valor) || 0;
    this.render();
  }

  actualizarFilaFlete(idx, campo, valor) {
    if (campo === 'cantidad' || campo === 'costoUnitario') valor = Number(valor) || 0;
    this.proyecto.flete[idx][campo] = valor;
    this.render();
  }

  actualizarFilaMontaje(idx, campo, valor) {
    if (campo === 'cantidad' || campo === 'costoUnitario') valor = Number(valor) || 0;
    this.proyecto.montaje[idx][campo] = valor;
    this.render();
  }

  actualizarHito(idx, campo, valor) {
    if (campo === 'porcentaje') valor = Number(valor) || 0;
    this.proyecto.hitos[idx][campo] = valor;
    this.render();
  }

  actualizarFilaGenerica(nombreTab, idx, campo, valor) {
    let arr = null;
    if (nombreTab === 'Integración Eléctrica') arr = this.proyecto.integracionElectrica;
    else if (nombreTab === 'Flete') arr = this.proyecto.flete;
    else if (nombreTab === 'Montaje') arr = this.proyecto.montaje;
    else if (nombreTab === 'Otros') arr = this.proyecto.otros;
    else if (nombreTab === 'Adicionales') arr = this.proyecto.adicionales;

    if (arr && arr[idx]) {
      if (campo === 'cantidad' || campo === 'costoUnitario') valor = Number(valor) || 0;
      arr[idx][campo] = valor;
      this.render();
    }
  }

  agregarFilaTabActual() {
    const tab = this.tabExcelActual;
    if (tab === 'Ingeniería y Planificación') this.agregarFilaIngenieria();
    else if (tab === 'Equipos') this.agregarFilaEquipo();
    else if (tab === 'Integración Eléctrica') this.agregarFilaIntegracion();
    else if (tab === 'Flete') {
      this.proyecto.flete.push({ item: `5.0${this.proyecto.flete.length + 1}`, descripcion: "Nuevo flete", unidad: "C/U", cantidad: 1, costoUnitario: 100000 });
      this.render();
    } else if (tab === 'Montaje') {
      this.proyecto.montaje.push({ item: `6.0${this.proyecto.montaje.length + 1}`, descripcion: "Nuevo montaje", unidad: "C/U", cantidad: 1, costoUnitario: 200000 });
      this.render();
    } else if (tab === 'Otros') {
      this.proyecto.otros.push({ item: `7.0${this.proyecto.otros.length + 1}`, descripcion: "Nuevo gasto terreno", unidad: "C/U", cantidad: 1, costoUnitario: 50000 });
      this.render();
    }
  }

  // =========================================================================
  // EXPORTACIÓN A EXCEL (.XLSX) CON EXCELJS
  // =========================================================================
  async exportarXLSX() {
    try {
      const p = this.proyecto;
      const calc = this.calcularTotales();

      const wb = new ExcelJS.Workbook();
      wb.creator = 'KEV Process SpA';
      wb.created = new Date();

      const azulOscuro = { argb: 'FF0F2744' };
      const azulMedio = { argb: 'FF1B365D' };
      const grisClaro = { argb: 'FFF1F5F9' };
      const fontHeader = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      const fontRegular = { name: 'Calibri', size: 10 };
      const borderThin = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      // 1. RESUMEN GENERAL
      const wsResumen = wb.addWorksheet('RESUMEN GENERAL');
      wsResumen.columns = [
        { width: 5 }, { width: 10 }, { width: 45 }, { width: 22 }, { width: 14 }, { width: 22 }, { width: 18 }, { width: 15 }
      ];

      wsResumen.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR';
      wsResumen.getCell('B2').font = { size: 14, bold: true, color: azulOscuro };

      wsResumen.getCell('B5').value = 'CLIENTE:';
      wsResumen.getCell('D5').value = p.cliente;
      wsResumen.getCell('B6').value = 'NRO DE OFERTA:';
      wsResumen.getCell('D6').value = p.correlativo;
      wsResumen.getCell('B7').value = 'NOMBRE DE PROYECTO:';
      wsResumen.getCell('D7').value = p.titulo;

      wsResumen.getCell('B10').value = 'RESUMEN DE COSTOS';
      wsResumen.getCell('B10').font = { bold: true, size: 11, color: azulOscuro };

      // Encabezados Resumen
      const rHeaders = ['ITEM', 'DESCRIPCIÓN', 'COSTO TOTAL', 'MARGEN', 'PRECIO', 'PRECIO USD'];
      rHeaders.forEach((h, i) => {
        const c = wsResumen.getCell(12, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
        c.alignment = { horizontal: i >= 2 ? 'right' : 'left' };
      });

      // Filas de Resumen General
      const itemsResumen = [
        { item: '1,0', desc: 'Ingeniería y planificaci\u00f3n', refSheet: "'Ingeniería y Planificación'!G20", cost: calc.costoIngenieria, m: p.margenes.ingenieria },
        { item: '2,0', desc: 'Adicionales', refSheet: "'Adicionales'!G20", cost: calc.costoAdicionales, m: p.margenes.adicionales },
        { item: '3,0', desc: 'Integración Eléctrica', refSheet: "'Integración Eléctrica'!G18", cost: calc.costoIntegracion, m: p.margenes.integracion },
        { item: '4,0', desc: 'Equipos', refSheet: "'Equipos'!G30", cost: calc.costoEquipos, m: p.margenes.equipos },
        { item: '5,0', desc: 'Flete', refSheet: "'Flete'!G14", cost: calc.costoFlete, m: p.margenes.flete },
        { item: '6,0', desc: 'Montaje y Puesta en Marcha', refSheet: "'Montaje'!G17", cost: calc.costoMontaje, m: p.margenes.montaje },
        { item: '7,0', desc: 'Otros: Viajes, visitas a terreno, levantamientos', refSheet: "'Otros'!G16", cost: calc.costoOtros, m: p.margenes.otros }
      ];

      itemsResumen.forEach((it, idx) => {
        const rowNum = 13 + idx;
        const cellItem = wsResumen.getCell(`B${rowNum}`);
        const cellDesc = wsResumen.getCell(`C${rowNum}`);
        const cellCost = wsResumen.getCell(`D${rowNum}`);
        const cellMarg = wsResumen.getCell(`E${rowNum}`);
        const cellPrec = wsResumen.getCell(`F${rowNum}`);
        const cellUSD = wsResumen.getCell(`G${rowNum}`);

        cellItem.value = it.item;
        cellDesc.value = it.desc;
        cellCost.value = it.cost;
        cellCost.numFmt = '$ #,##0';
        cellMarg.value = it.m;
        cellMarg.numFmt = '0.0%';
        cellPrec.value = { formula: `D${rowNum}/(1-E${rowNum})`, result: Math.round(it.cost / (1 - it.m)) };
        cellPrec.numFmt = '$ #,##0';
        cellUSD.value = { formula: `F${rowNum}/$H$24`, result: Math.round(it.cost / (1 - it.m) / p.dolar) };
        cellUSD.numFmt = '$ #,##0';

        [cellItem, cellDesc, cellCost, cellMarg, cellPrec, cellUSD].forEach(c => {
          c.border = borderThin;
          c.font = fontRegular;
        });
      });

      // Total Oferta Fila 22
      wsResumen.getCell('C22').value = 'PRECIO OFERTA PROYECTO';
      wsResumen.getCell('C22').font = { bold: true };
      wsResumen.getCell('D22').value = { formula: 'SUM(D13:D19)', result: calc.costoTotalProyecto };
      wsResumen.getCell('D22').numFmt = '$ #,##0';
      wsResumen.getCell('D22').font = { bold: true };
      wsResumen.getCell('E22').value = { formula: '(F22-D22)/F22', result: calc.margenConsolidado };
      wsResumen.getCell('E22').numFmt = '0.0%';
      wsResumen.getCell('E22').font = { bold: true };
      wsResumen.getCell('F22').value = { formula: 'SUM(F13:F19)', result: calc.precioTotalProyecto };
      wsResumen.getCell('F22').numFmt = '$ #,##0';
      wsResumen.getCell('F22').font = { bold: true, size: 11, color: azulOscuro };
      wsResumen.getCell('G22').value = { formula: 'SUM(G13:G19)', result: calc.precioTotalUSD };
      wsResumen.getCell('G22').numFmt = '$ #,##0';
      wsResumen.getCell('G22').font = { bold: true };

      // Parámetros USD y UF
      wsResumen.getCell('E24').value = 'USD';
      wsResumen.getCell('F24').value = { formula: 'F22/H24', result: calc.precioTotalUSD };
      wsResumen.getCell('F24').numFmt = '$ #,##0';
      wsResumen.getCell('H24').value = p.dolar;
      wsResumen.getCell('H24').numFmt = '$ #,##0';
      wsResumen.getCell('H25').value = p.uf;
      wsResumen.getCell('H25').numFmt = '$ #,##0';

      // 2. INGENIERÍA Y PLANIFICACIÓN
      const wsIng = wb.addWorksheet('Ingeniería y Planificación');
      wsIng.columns = [{ width: 5 }, { width: 10 }, { width: 35 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 18 }, { width: 30 }];
      wsIng.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR';
      wsIng.getCell('B5').value = '1,0';
      wsIng.getCell('C5').value = 'Ingeniería y Planificación';
      const ingCols = ['ITEM', 'DESCRIPCIÓN', 'UNIDAD', 'CANTIDAD', 'COSTO UNIT.', 'COSTO', 'DETALLE'];
      ingCols.forEach((h, i) => {
        const c = wsIng.getCell(7, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
      });
      p.ingenieria.forEach((row, i) => {
        const r = 8 + i;
        wsIng.getCell(`B${r}`).value = row.id;
        wsIng.getCell(`C${r}`).value = row.perfil;
        wsIng.getCell(`D${r}`).value = 'HH';
        wsIng.getCell(`E${r}`).value = row.hh;
        wsIng.getCell(`F${r}`).value = row.costoUnitario;
        wsIng.getCell(`F${r}`).numFmt = '$ #,##0';
        wsIng.getCell(`G${r}`).value = { formula: `E${r}*F${r}`, result: row.hh * row.costoUnitario };
        wsIng.getCell(`G${r}`).numFmt = '$ #,##0';
        wsIng.getCell(`H${r}`).value = row.comentario || '';
      });
      wsIng.getCell('F20').value = 'COSTO TOTAL';
      wsIng.getCell('F20').font = { bold: true };
      wsIng.getCell('G20').value = { formula: `SUM(G8:G${7 + p.ingenieria.length})`, result: calc.costoIngenieria };
      wsIng.getCell('G20').numFmt = '$ #,##0';
      wsIng.getCell('G20').font = { bold: true };

      // 3. ADICIONALES
      const wsAdic = wb.addWorksheet('Adicionales');
      wsAdic.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR - ADICIONALES';
      wsAdic.getCell('G20').value = calc.costoAdicionales;

      // 4. INTEGRACIÓN ELÉCTRICA
      const wsInt = wb.addWorksheet('Integración Eléctrica');
      wsInt.columns = [{ width: 5 }, { width: 10 }, { width: 40 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 18 }];
      wsInt.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR';
      wsInt.getCell('B5').value = '3,0';
      wsInt.getCell('C5').value = 'Integración Eléctrica';
      ['ITEM', 'DESCRIPCIÓN', 'UNIDAD', 'CANTIDAD', 'COSTO UNIT', 'COSTO'].forEach((h, i) => {
        const c = wsInt.getCell(7, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
      });
      p.integracionElectrica.forEach((row, i) => {
        const r = 8 + i;
        wsInt.getCell(`B${r}`).value = row.id;
        wsInt.getCell(`C${r}`).value = row.descripcion;
        wsInt.getCell(`D${r}`).value = row.unidad;
        wsInt.getCell(`E${r}`).value = row.cantidad;
        wsInt.getCell(`F${r}`).value = row.costoUnitario;
        wsInt.getCell(`F${r}`).numFmt = '$ #,##0';
        wsInt.getCell(`G${r}`).value = { formula: `E${r}*F${r}`, result: row.cantidad * row.costoUnitario };
        wsInt.getCell(`G${r}`).numFmt = '$ #,##0';
      });
      wsInt.getCell('F18').value = 'COSTO TOTAL';
      wsInt.getCell('F18').font = { bold: true };
      wsInt.getCell('G18').value = { formula: `SUM(G8:G${7 + p.integracionElectrica.length})`, result: calc.costoIntegracion };
      wsInt.getCell('G18').numFmt = '$ #,##0';
      wsInt.getCell('G18').font = { bold: true };

      // 5. EQUIPOS
      const wsEq = wb.addWorksheet('Equipos');
      wsEq.columns = [{ width: 5 }, { width: 8 }, { width: 22 }, { width: 45 }, { width: 12 }, { width: 16 }, { width: 8 }, { width: 8 }, { width: 16 }, { width: 18 }, { width: 18 }];
      wsEq.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR';
      wsEq.getCell('B5').value = '4,0';
      wsEq.getCell('D5').value = 'Equipos';
      wsEq.getCell('K5').value = 'cambio usd';
      wsEq.getCell('L5').value = p.dolar;
      ['ITEM', 'CÓDIGO', 'DESCRIPCIÓN', 'DESCUENTO', 'LISTA', 'UNIDAD', 'CANTIDAD', 'COSTO UNIT USD', 'COSTO UNIT. CLP', 'COSTO $ TOTAL'].forEach((h, i) => {
        const c = wsEq.getCell(7, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
      });
      p.equipos.forEach((eq, i) => {
        const r = 8 + i;
        const cant = Number(eq.cantidad) || 0;
        let cuCLP = 0;
        let cuUSD = 0;
        if (eq.listaUSD > 0) {
          const desc = (KEV_MAESTROS.descuentosSiemens[eq.grupo] || { descuento: 0 }).descuento;
          cuUSD = eq.listaUSD * (1 - desc);
          cuCLP = Math.round(cuUSD * p.dolar);
        } else {
          cuCLP = Number(eq.costoCLP) || 0;
        }

        wsEq.getCell(`B${r}`).value = eq.item;
        wsEq.getCell(`C${r}`).value = eq.codigo;
        wsEq.getCell(`D${r}`).value = eq.descripcion;
        wsEq.getCell(`E${r}`).value = eq.grupo;
        wsEq.getCell(`F${r}`).value = eq.listaUSD;
        wsEq.getCell(`F${r}`).numFmt = '$ #,##0.00';
        wsEq.getCell(`G${r}`).value = eq.unidad;
        wsEq.getCell(`H${r}`).value = eq.cantidad;
        wsEq.getCell(`I${r}`).value = cuUSD;
        wsEq.getCell(`I${r}`).numFmt = '$ #,##0.00';
        wsEq.getCell(`J${r}`).value = cuCLP;
        wsEq.getCell(`J${r}`).numFmt = '$ #,##0';
        wsEq.getCell(`K${r}`).value = { formula: `H${r}*J${r}`, result: cuCLP * cant };
        wsEq.getCell(`K${r}`).numFmt = '$ #,##0';
      });
      wsEq.getCell('G30').value = { formula: `SUM(K8:K${7 + p.equipos.length})`, result: calc.costoEquipos };

      // 6. FLETE
      const wsFl = wb.addWorksheet('Flete');
      wsFl.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR - FLETE';
      wsFl.getCell('G14').value = calc.costoFlete;

      // 7. MONTAJE
      const wsMo = wb.addWorksheet('Montaje');
      wsMo.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR - MONTAJE';
      wsMo.getCell('G17').value = calc.costoMontaje;

      // 8. OTROS
      const wsOt = wb.addWorksheet('Otros');
      wsOt.columns = [{ width: 5 }, { width: 8 }, { width: 35 }, { width: 10 }, { width: 10 }, { width: 15 }, { width: 18 }];
      wsOt.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR - OTROS';
      wsOt.getCell('B5').value = '7,0';
      wsOt.getCell('C5').value = 'Otros';
      ['ITEM', 'DESCRIPCIÓN', 'UNIDAD', 'CANTIDAD', 'COSTO UNIT.', 'COSTO'].forEach((h, i) => {
        const c = wsOt.getCell(7, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
      });
      p.otros.forEach((ot, i) => {
        const r = 8 + i;
        wsOt.getCell(`B${r}`).value = ot.item;
        wsOt.getCell(`C${r}`).value = ot.descripcion;
        wsOt.getCell(`D${r}`).value = ot.unidad;
        wsOt.getCell(`E${r}`).value = ot.cantidad;
        wsOt.getCell(`F${r}`).value = ot.costoUnitario;
        wsOt.getCell(`F${r}`).numFmt = '$ #,##0';
        wsOt.getCell(`G${r}`).value = { formula: `E${r}*F${r}`, result: ot.cantidad * ot.costoUnitario };
        wsOt.getCell(`G${r}`).numFmt = '$ #,##0';
      });
      wsOt.getCell('F16').value = 'COSTO TOTAL';
      wsOt.getCell('G16').value = { formula: `SUM(G8:G${7 + p.otros.length})`, result: calc.costoOtros };
      wsOt.getCell('G16').numFmt = '$ #,##0';
      wsOt.getCell('G16').font = { bold: true };

      // 9. LISTADO (CLIENTE)
      const wsList = wb.addWorksheet('Listado');
      wsList.columns = [{ width: 5 }, { width: 50 }, { width: 8 }, { width: 18 }, { width: 18 }, { width: 18 }];
      wsList.getCell('I1').value = 'Margen';
      wsList.getCell('J1').value = p.margenes.equipos;
      ['N°', 'DESCRIPCIÓN', 'CANT.', 'COSTO UNIT.', 'COSTO TOTAL', 'VALOR VENTA'].forEach((h, i) => {
        const c = wsList.getCell(2, i + 1);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
      });
      p.equipos.forEach((eq, i) => {
        const r = 3 + i;
        const cant = Number(eq.cantidad) || 0;
        let cuCLP = 0;
        if (eq.listaUSD > 0) {
          const desc = (KEV_MAESTROS.descuentosSiemens[eq.grupo] || { descuento: 0 }).descuento;
          cuCLP = Math.round(eq.listaUSD * (1 - desc) * p.dolar);
        } else {
          cuCLP = Number(eq.costoCLP) || 0;
        }
        const venta = Math.round(cuCLP / (1 - p.margenes.equipos)) * cant;

        wsList.getCell(`A${r}`).value = i + 1;
        wsList.getCell(`B${r}`).value = `${eq.codigo} - ${eq.descripcion}`;
        wsList.getCell(`C${r}`).value = cant;
        wsList.getCell(`D${r}`).value = cuCLP;
        wsList.getCell(`D${r}`).numFmt = '$ #,##0';
        wsList.getCell(`E${r}`).value = cuCLP * cant;
        wsList.getCell(`E${r}`).numFmt = '$ #,##0';
        wsList.getCell(`F${r}`).value = venta;
        wsList.getCell(`F${r}`).numFmt = '$ #,##0';
      });

      // Generar buffer y descargar
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `Costos - ${p.correlativo} - ${p.titulo.replace(/[\/\\?%*:|"<>]/g, '_')}.xlsx`;
      saveAs(blob, filename);

    } catch (err) {
      console.error("Error al exportar XLSX:", err);
      alert("Error al exportar planilla Excel: " + err.message);
    }
  }

  // =========================================================================
  // EXPORTACIÓN A WORD (.DOCX) CON DOCX.JS
  // =========================================================================
  async exportarDOCX() {
    try {
      const p = this.proyecto;
      const calc = this.calcularTotales();
      const docxLib = window.docx;

      if (!docxLib) {
        throw new Error("Biblioteca docx no disponible");
      }

      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } = docxLib;

      const borderNone = {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
      };

      const tableBorderDefault = {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
      };

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: "Calibri", size: 21, color: "1E293B" }
            }
          }
        },
        sections: [{
          properties: {},
          children: [
            // ENCABEZADO
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: `${KEV_MAESTROS.empresa.ciudad}, ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 20, color: "64748B" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `CORRELATIVO: ${p.correlativo}`, bold: true, size: 26, color: "0F2744" })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({ children: [new TextRun({ text: "Señores", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: `${p.cliente} - ${p.planta}` })] }),
            new Paragraph({ children: [new TextRun({ text: "Presente" })], spacing: { after: 250 } }),
            new Paragraph({ children: [new TextRun({ text: p.contactoCliente || "Estimados Señores:", bold: true })] }),
            new Paragraph({
              children: [
                new TextRun({ text: `Por medio de la presente comunicación, envío a usted nuestra propuesta técnico-comercial por el requerimiento de "` }),
                new TextRun({ text: p.titulo, bold: true }),
                new TextRun({ text: `", para las instalaciones de ${p.planta}.` })
              ],
              spacing: { after: 300 }
            }),

            // 1. REQUERIMIENTO
            new Paragraph({
              text: "1. Requerimiento y Alcance General",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `De acuerdo con lo coordinado con ${p.cliente}, se presenta la oferta técnica y económica para la ejecución del servicio de ` }),
                new TextRun({ text: p.titulo, bold: true }),
                new TextRun({ text: `. El proyecto contempla las fases de diseño preliminar, ingeniería de detalle, programación de lógicas de control, suministro de equipos, integración de tableros, pruebas en taller y comisionamiento en faena.` })
              ],
              spacing: { after: 200 }
            }),

            // 2. PROPUESTA TÉCNICA
            new Paragraph({
              text: "2. Propuesta Técnica y Metodología",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Se contemplan ` }),
                new TextRun({ text: `${p.semanasOficina} semanas de trabajo en oficina`, bold: true }),
                new TextRun({ text: ` para análisis de planimetría, desarrollo de lógicas de control PLC/SCADA y pruebas de validación. Asimismo, se consideran ` }),
                new TextRun({ text: `${p.diasTerreno} días de faena en terreno`, bold: true }),
                new TextRun({ text: ` para levantamiento, marcaje, interconexión eléctrica, carga de software y pruebas de puesta en servicio (PEM).` })
              ],
              spacing: { after: 200 }
            }),

            // 3. REQUERIMIENTOS PREVIOS
            new Paragraph({
              text: "3. Requerimientos Previos del Cliente",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Paragraph({ text: "• Planimetría unilineal y diagramas de conexionado actualizados del área de intervención." }),
            new Paragraph({ text: "• Arquitectura de red y mapas de memoria vigentes de PLC / controladores existentes." }),
            new Paragraph({ text: "• Detención programada de equipos y disponibilidad de personal de operación y mantenimiento." }),
            new Paragraph({ text: "• Permisos de acceso a faena e inducciones de seguridad aplicables.", spacing: { after: 200 } }),

            // 4. SUMINISTRO DE HARDWARE (TABLA)
            new Paragraph({
              text: "4. Suministro de Hardware y Materiales",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: tableBorderDefault,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "ÍTEM", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "CÓDIGO", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPCIÓN", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "CANT.", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } })
                  ]
                }),
                ...p.equipos.map((eq, i) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: String(i + 1) })] }),
                    new TableCell({ children: [new Paragraph({ text: eq.codigo, bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: eq.descripcion })] }),
                    new TableCell({ children: [new Paragraph({ text: `${eq.cantidad} ${eq.unidad}` })] })
                  ]
                }))
              ]
            }),

            // 5. DETALLE DE SERVICIOS E INGENIERÍA
            new Paragraph({
              text: "5. Detalle de Servicios e Ingeniería",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: tableBorderDefault,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "ÍTEM", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPCIÓN SERVICIO / INGENIERÍA", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "UNID", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "CANT", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } })
                  ]
                }),
                ...p.ingenieria.map((row, i) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: String(i + 1) })] }),
                    new TableCell({ children: [new Paragraph({ text: `${row.perfil} ${row.comentario ? '(' + row.comentario + ')' : ''}` })] }),
                    new TableCell({ children: [new Paragraph({ text: "HH" })] }),
                    new TableCell({ children: [new Paragraph({ text: String(row.hh), bold: true })] })
                  ]
                }))
              ]
            }),

            // 6. ENTREGABLES & EXCLUSIONES
            new Paragraph({
              text: "6. Entregables y Exclusiones",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 120 }
            }),
            new Paragraph({ children: [new TextRun({ text: "Entregables al Término del Servicio:", bold: true })] }),
            new Paragraph({ text: "• Protocolos de prueba firmados en terreno." }),
            new Paragraph({ text: "• Respaldos completos de software (código fuente PLC/SCADA/Drives)." }),
            new Paragraph({ text: "• Planos red-line actualizados conforme a la implementación realizada.", spacing: { after: 150 } }),

            new Paragraph({ children: [new TextRun({ text: "Exclusiones de la Oferta:", bold: true })] }),
            new Paragraph({ text: "• No se incluye montaje mecánico o canalizaciones externas no especificadas." }),
            new Paragraph({ text: "• No se contempla integración a sistemas de terceros no detallados." }),
            new Paragraph({ text: "• Cualquier equipo o insumo no especificado en el presente documento.", spacing: { after: 200 } }),

            // 7. CUADRO DE PRECIOS
            new Paragraph({
              text: "7. Cuadro de Precios de la Oferta",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: tableBorderDefault,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "ÍTEM", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPCIÓN", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "VALOR CLP (NETO)", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "VALOR USD (REF)", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "1" })] }),
                    new TableCell({ children: [new Paragraph({ text: "Suministro e Integración de Hardware" })] }),
                    new TableCell({ children: [new Paragraph({ text: this.fmtCLP(calc.precioEquipos), bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: `$ ${Math.round(calc.precioEquipos / p.dolar).toLocaleString('es-CL')}` })] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "2" })] }),
                    new TableCell({ children: [new Paragraph({ text: "Servicios de Ingeniería, Puesta en Marcha & Logística" })] }),
                    new TableCell({ children: [new Paragraph({ text: this.fmtCLP(calc.precioTotalProyecto - calc.precioEquipos), bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: `$ ${Math.round((calc.precioTotalProyecto - calc.precioEquipos) / p.dolar).toLocaleString('es-CL')}` })] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "" })] }),
                    new TableCell({ children: [new Paragraph({ text: "TOTAL OFERTA (VALORES NETOS + IVA)", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: this.fmtCLP(calc.precioTotalProyecto), bold: true, color: "0F2744" })] }),
                    new TableCell({ children: [new Paragraph({ text: `$ ${calc.precioTotalUSD.toLocaleString('es-CL')} USD`, bold: true })] })
                  ]
                })
              ]
            }),

            // 8. CONDICIONES DE PAGO
            new Paragraph({
              text: "8. Condiciones y Estados de Pago",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: tableBorderDefault,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "EP", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "HITO ASOCIADO", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } }),
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "% PAGO", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F2744" } })
                  ]
                }),
                ...p.hitos.map(h => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: h.ep, bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: h.hito })] }),
                    new TableCell({ children: [new Paragraph({ text: `${h.porcentaje}%`, bold: true })] })
                  ]
                }))
              ]
            }),

            // 9. BASES LEGALES Y GARANTÍA
            new Paragraph({
              text: "9. Bases Legales, Contractuales y Garantía KEV Process",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 120 }
            }),
            ...KEV_MAESTROS.basesLegalesGarantia.flatMap(b => [
              new Paragraph({ children: [new TextRun({ text: b.titulo, bold: true })] }),
              new Paragraph({ children: [new TextRun({ text: b.texto })], spacing: { after: 120 } })
            ]),

            // 10. DATOS EMPRESA Y FIRMA
            new Paragraph({
              text: "10. Datos de la Empresa y Firma",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 120 }
            }),
            new Paragraph({ children: [new TextRun({ text: `Razón Social: ${KEV_MAESTROS.empresa.razonSocial}` })] }),
            new Paragraph({ children: [new TextRun({ text: `RUT: ${KEV_MAESTROS.empresa.rut}` })] }),
            new Paragraph({ children: [new TextRun({ text: `Dirección: ${KEV_MAESTROS.empresa.direccion}` })] }),
            new Paragraph({ children: [new TextRun({ text: `Giro: ${KEV_MAESTROS.empresa.giro}` })] }),
            new Paragraph({ children: [new TextRun({ text: `Contacto: ${KEV_MAESTROS.empresa.contacto} | Móvil: ${KEV_MAESTROS.empresa.movil}` })] }),
            new Paragraph({ children: [new TextRun({ text: `Email: ${KEV_MAESTROS.empresa.email}` })], spacing: { after: 300 } }),

            new Paragraph({
              children: [
                new TextRun({ text: "_____________________________________\n", bold: true }),
                new TextRun({ text: "CHRISTIAN BARAHONA\n", bold: true }),
                new TextRun({ text: "KEV PROCESS SPA\n", bold: true })
              ],
              spacing: { before: 200 }
            })
          ]
        }]
      });

      const buffer = await Packer.toBlob(doc);
      const filename = `${p.correlativo} - ${p.titulo.replace(/[\/\\?%*:|"<>]/g, '_')}.docx`;
      saveAs(buffer, filename);

    } catch (err) {
      console.error("Error al exportar DOCX:", err);
      alert("Error al exportar documento Word: " + err.message);
    }
  }

  // Previsualización de Propuesta en Modal
  abrirModalPrevisualizacion() {
    const modal = document.getElementById('modalPrevisualizacion');
    const cuerpo = document.getElementById('cuerpoPrevisualizacion');
    const p = this.proyecto;
    const calc = this.calcularTotales();

    cuerpo.innerHTML = `
      <div class="border-b pb-4 mb-4">
        <div class="text-right text-slate-500">${KEV_MAESTROS.empresa.ciudad}, ${new Date().toLocaleDateString('es-CL')}</div>
        <div class="text-lg font-bold text-slate-900 mt-2">CORRELATIVO: ${p.correlativo}</div>
        <div class="font-bold text-slate-800 mt-2">Señores ${p.cliente} - ${p.planta}</div>
        <div class="text-slate-600">Presente</div>
        <div class="mt-3 font-bold">${p.contactoCliente}:</div>
        <p class="mt-1">Por medio de la presente comunicación, enviamos nuestra propuesta técnica y económica por el requerimiento de <strong>"${p.titulo}"</strong>.</p>
      </div>

      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-800 text-sm">1. Propuesta Técnica</h4>
          <p>Considera <strong>${p.semanasOficina} semanas en oficina</strong> para ingeniería y <strong>${p.diasTerreno} días en terreno</strong> para comisionamiento y pruebas PEM.</p>
        </div>

        <div>
          <h4 class="font-bold text-slate-800 text-sm">2. Resumen Económico</h4>
          <table class="excel-table text-xs">
            <tr><td>Suministro de Hardware:</td><td class="num-cell">${this.fmtCLP(calc.precioEquipos)}</td></tr>
            <tr><td>Servicios de Ingeniería & Logística:</td><td class="num-cell">${this.fmtCLP(calc.precioTotalProyecto - calc.precioEquipos)}</td></tr>
            <tr class="total-row"><td>TOTAL OFERTA (VALORES NETOS):</td><td class="num-cell font-bold text-emerald-700">${this.fmtCLP(calc.precioTotalProyecto)} (Ref: $ ${calc.precioTotalUSD.toLocaleString('es-CL')} USD)</td></tr>
          </table>
        </div>

        <div>
          <h4 class="font-bold text-slate-800 text-sm">3. Estados de Pago</h4>
          <ul class="list-disc pl-5 space-y-1">
            ${p.hitos.map(h => `<li><strong>${h.ep} (${h.porcentaje}%):</strong> ${h.hito}</li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-slate-800 text-sm">4. Bases Legales y Términos de Garantía</h4>
          <div class="text-xs text-slate-600 space-y-2 mt-1">
            ${KEV_MAESTROS.basesLegalesGarantia.map(b => `<p><strong>${b.titulo}:</strong> ${b.texto}</p>`).join('')}
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  cerrarModalPrevisualizacion() {
    document.getElementById('modalPrevisualizacion').classList.add('hidden');
  }

  // --- HELPERS AUXILIARES ---
  fmtCLP(num) {
    const n = Math.round(Number(num) || 0);
    return `$ ${n.toLocaleString('es-CL')}`;
  }

  setElemText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  setElemVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }
}

// Instanciar aplicación al cargar DOM
let app = null;
window.addEventListener('DOMContentLoaded', () => {
  app = new KEVPresupuestoApp();
  app.init();
});
