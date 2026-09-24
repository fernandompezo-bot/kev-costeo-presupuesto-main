/**
 * app.js - Motor Reactivo de Presupuesto, Costeo y Generador de Documentos XLSX/DOCX
 * KEV Process SpA - 2026
 * Versión 2.0 - Con Auto-guardado, Importador XLSX, Gantt, Gestor de Tarifas y Exclusiones
 */

class KEVPresupuestoApp {
  constructor() {
    this.modo = 'cuestionario'; // 'cuestionario' | 'desarrollo'
    this.pasoCuestionario = 1;
    this.tabExcelActual = 'RESUMEN GENERAL';
    this.tabConfigActual = 'hh';
    this.sidebarPinned = false;
    this.sidebarCloseTimer = null;
    this.sidebarPinned = false;
    this.sidebarCloseTimer = null;

    // Cargar tarifas y catálogos personalizados desde localStorage
    this.cargarConfiguracionUsuario();

    // Estado reactivo del proyecto
    this.proyecto = null;
    
    // Si existe sesión guardada en localStorage, cargarla; si no, cargar preset base 101-2026
    const guardado = localStorage.getItem('kev_proyecto_guardado');
    if (guardado) {
      try {
        this.proyecto = JSON.parse(guardado);
      } catch (e) {
        console.warn("Error al restaurar sesión guardada:", e);
      }
    }
    
    if (!this.proyecto) {
      this.cargarPreset('101-2026');
    }
  }

  init() {
    this.inicializarSidebar();
    this.inicializarSelectores();
    this.inicializarDropzone();
    this.render();
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  inicializarSidebar() {
    this.sidebarPinned = localStorage.getItem('kev_sidebar_pinned') === 'true';
    const pinBtn = document.getElementById('btnPinSidebar');
    const sidebar = document.getElementById('appSidebar');
    if (this.sidebarPinned) {
      document.body.classList.add('sidebar-pinned');
      if (sidebar) sidebar.classList.add('open');
      if (pinBtn) pinBtn.classList.add('text-blue-400');
    }
  }

  onSidebarMouseEnter() {
    if (this.sidebarCloseTimer) {
      clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = null;
    }
  }

  onSidebarMouseLeave() {
    if (!this.sidebarPinned) {
      if (this.sidebarCloseTimer) clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = setTimeout(() => {
        this.toggleSidebar(false);
      }, 350);
    }
  }

  toggleSidebar(forzar) {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('appSidebarOverlay');
    if (!sidebar) return;

    if (this.sidebarCloseTimer) {
      clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = null;
    }

    const abrir = forzar !== undefined ? forzar : !sidebar.classList.contains('open');
    if (abrir) {
      sidebar.classList.add('open');
      if (!this.sidebarPinned && overlay) overlay.classList.add('active');
    } else {
      if (!this.sidebarPinned) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  togglePinSidebar() {
    this.sidebarPinned = !this.sidebarPinned;
    localStorage.setItem('kev_sidebar_pinned', String(this.sidebarPinned));
    const pinBtn = document.getElementById('btnPinSidebar');
    const overlay = document.getElementById('appSidebarOverlay');
    const sidebar = document.getElementById('appSidebar');

    if (this.sidebarPinned) {
      document.body.classList.add('sidebar-pinned');
      if (sidebar) sidebar.classList.add('open');
      if (pinBtn) pinBtn.classList.add('text-blue-400');
      if (overlay) overlay.classList.remove('active');
      this.showToast("Barra lateral fijada en el borde izquierdo", "info");
    } else {
      document.body.classList.remove('sidebar-pinned');
      if (pinBtn) pinBtn.classList.remove('text-blue-400');
      this.showToast("Barra lateral en modo autohide", "info");
    }
    if (window.lucide) lucide.createIcons();
  }

  // Carga configuración persistente de tarifas desde localStorage
  cargarConfiguracionUsuario() {
    try {
      const cfgHH = localStorage.getItem('kev_cfg_tarifas_hh');
      if (cfgHH) {
        const parsed = JSON.parse(cfgHH);
        Object.keys(parsed).forEach(k => {
          if (KEV_MAESTROS.tarifasHH[k]) {
            KEV_MAESTROS.tarifasHH[k].costoUnitario = parsed[k];
          }
        });
      }

      const cfgLog = localStorage.getItem('kev_cfg_tarifas_logistica');
      if (cfgLog) {
        const parsed = JSON.parse(cfgLog);
        Object.keys(parsed).forEach(k => {
          if (KEV_MAESTROS.tarifasLogisticas[k]) {
            KEV_MAESTROS.tarifasLogisticas[k].costoUnitario = parsed[k];
          }
        });
      }

      const cfgEq = localStorage.getItem('kev_cfg_catalogo_equipos');
      if (cfgEq) {
        KEV_MAESTROS.catalogoEquiposFrecuentes = JSON.parse(cfgEq);
      }
    } catch (e) {
      console.warn("No se pudo cargar configuración de usuario:", e);
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
        mesesGarantia: "12",
        validezOferta: "30 días a contar de la fecha de emisión",
        notasEspeciales: "",
        ingenieria: [
          { id: "1.4", perfil: "HH Ingeniero PLC", hh: 40, costoUnitario: KEV_MAESTROS.tarifasHH.plc.costoUnitario, comentario: "Programación inicial" }
        ],
        adicionales: [],
        integracionElectrica: [],
        equipos: [],
        flete: [
          { item: "5.01", descripcion: "Flete a terreno", unidad: "C/U", cantidad: 1, costoUnitario: 150000 }
        ],
        montaje: [],
        otros: [
          { item: "7.01", descripcion: "Estadía", unidad: "C/U", cantidad: 2, costoUnitario: KEV_MAESTROS.tarifasLogisticas.estadia.costoUnitario },
          { item: "7.02", descripcion: "Alimentación", unidad: "C/U", cantidad: 2, costoUnitario: KEV_MAESTROS.tarifasLogisticas.alimentacion.costoUnitario }
        ],
        margenes: { ...KEV_MAESTROS.margenesPorDefecto },
        hitos: JSON.parse(JSON.stringify(KEV_MAESTROS.hitosPagoEstandar)),
        exclusiones: JSON.parse(JSON.stringify(KEV_MAESTROS.exclusionesEstandar))
      };
    } else if (PRESETS_PROYECTOS[id]) {
      this.proyecto = JSON.parse(JSON.stringify(PRESETS_PROYECTOS[id]));
      if (!this.proyecto.hitos) {
        this.proyecto.hitos = JSON.parse(JSON.stringify(KEV_MAESTROS.hitosPagoEstandar));
      }
      if (!this.proyecto.adicionales) {
        this.proyecto.adicionales = [];
      }
      if (!this.proyecto.exclusiones) {
        this.proyecto.exclusiones = JSON.parse(JSON.stringify(KEV_MAESTROS.exclusionesEstandar));
      }
      if (!this.proyecto.mesesGarantia) {
        this.proyecto.mesesGarantia = "12";
      }
      if (!this.proyecto.validezOferta) {
        this.proyecto.validezOferta = "30 días a contar de la fecha de emisión";
      }
      if (!this.proyecto.notasEspeciales) {
        this.proyecto.notasEspeciales = "";
      }
    }
    this.render();
    this.showToast("Preset cargado correctamente: " + (id === 'blanco' ? 'Proyecto en Blanco' : id), "info");
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

  // Inicializa listeners para drag & drop en el modal de importación
  inicializarDropzone() {
    const dropzone = document.getElementById('dropzoneXLSX');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.procesarArchivoXLSX({ target: { files: files } });
      }
    }, false);
  }

  // Auto-guardado en LocalStorage
  autoSave() {
    try {
      if (this.proyecto) {
        localStorage.setItem('kev_proyecto_guardado', JSON.stringify(this.proyecto));
        const badge = document.getElementById('autoSaveText');
        if (badge) {
          const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          badge.textContent = `Auto-guardado (${hora})`;
        }
      }
    } catch (e) {
      console.warn("No se pudo auto-guardar en localStorage:", e);
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
    if (!p) return;
    const calc = this.calcularTotales();

    // Actualizar KPI Bar
    this.setElemText('kpiClienteCorrelativo', `${p.cliente} | ${p.correlativo}`);
    this.setElemText('kpiCostoTotal', this.fmtCLP(calc.costoTotalProyecto));
    this.setElemText('kpiMargenConsolidado', `${(calc.margenConsolidado * 100).toFixed(1)}%`);
    this.setElemText('kpiPrecioCLP', this.fmtCLP(calc.precioTotalProyecto));
    this.setElemText('kpiPrecioUSD', `$ ${calc.precioTotalUSD.toLocaleString('es-CL')} USD`);

    // Actualizar Top Header Minimalista con KPIs
    this.setElemText('topHeaderCorrelativo', p.correlativo);
    this.setElemText('topHeaderTitulo', `${p.cliente} - ${p.titulo}`);
    this.setElemText('topHeaderVentaCLP', this.fmtCLP(calc.precioTotalProyecto));
    this.setElemText('topHeaderVentaUSD', `$ ${calc.precioTotalUSD.toLocaleString('es-CL')}`);
    this.setElemText('topHeaderMargen', `${(calc.margenConsolidado * 100).toFixed(1)}%`);


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
    this.setElemVal('sidebarInputDolar', p.dolar);
    this.setElemVal('sidebarInputUF', p.uf);

    // Actualizar Paso 2 (HH y Mini Carta Gantt)
    this.setElemText('q_totalHH', `${calc.totalHH} HH`);
    this.setElemText('q_costoIngenieria', this.fmtCLP(calc.costoIngenieria));
    this.renderTablaIngenieriaCuestionario();
    this.renderMiniGantt();

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

    // Actualizar Paso 7 (Hitos, Exclusiones y Garantías)
    this.renderTablaHitosPago(calc.precioTotalProyecto);
    this.renderExclusiones();
    this.renderBasesLegales();
    this.setElemVal('q_mesesGarantia', p.mesesGarantia || '12');
    this.setElemVal('q_validezOferta', p.validezOferta || '30 días a contar de la fecha de emisión');
    this.setElemVal('q_notasEspeciales', p.notasEspeciales || '');

    // Si está en Modo Desarrollo, refrescar la grilla matricial
    if (this.modo === 'desarrollo') {
      this.renderModoDesarrollo();
    }

    // Auto-guardado
    this.autoSave();

    if (window.lucide) lucide.createIcons();
  }

  // --- RENDER MINI CARTA GANTT VISUAL ---
  renderMiniGantt() {
    const cont = document.getElementById('contenedorMiniGantt');
    const lbl = document.getElementById('ganttResumenSemanas');
    if (!cont) return;

    const semanasOf = Math.max(1, Number(this.proyecto.semanasOficina) || 1);
    const diasTerr = Math.max(1, Number(this.proyecto.diasTerreno) || 1);
    const diasTotales = (semanasOf * 7) + diasTerr + 3; // +3 para cierre

    if (lbl) {
      lbl.textContent = `Total estimado: ${semanasOf} sem. oficina + ${diasTerr} días terreno`;
    }

    // Fases del proyecto calculadas
    const fases = [
      {
        nombre: "1. Levantamiento & Planimetría",
        clase: "gantt-bar-oficina",
        inicioDia: 0,
        duracionDia: Math.max(2, Math.round(semanasOf * 2.5)),
        detalle: "Oficina"
      },
      {
        nombre: "2. Desarrollo Lógicas PLC / SCADA",
        clase: "gantt-bar-oficina",
        inicioDia: Math.round(semanasOf * 2),
        duracionDia: Math.round(semanasOf * 4.5),
        detalle: "Oficina"
      },
      {
        nombre: "3. Integración Tableros & Pruebas FAT",
        clase: "gantt-bar-fat",
        inicioDia: Math.round(semanasOf * 5),
        duracionDia: Math.max(2, Math.round(semanasOf * 2)),
        detalle: "Taller KEV"
      },
      {
        nombre: "4. Desconexión & Montaje en Faena",
        clase: "gantt-bar-terreno",
        inicioDia: (semanasOf * 7),
        duracionDia: Math.max(1, Math.round(diasTerr * 0.4)),
        detalle: "Terreno"
      },
      {
        nombre: "5. Comisionamiento & Puesta en Marcha (PEM)",
        clase: "gantt-bar-terreno",
        inicioDia: (semanasOf * 7) + Math.round(diasTerr * 0.35),
        duracionDia: Math.max(2, Math.round(diasTerr * 0.65)),
        detalle: "Terreno"
      },
      {
        nombre: "6. Entrega As-Built & Protocolos",
        clase: "gantt-bar-cierre",
        inicioDia: (semanasOf * 7) + diasTerr,
        duracionDia: 3,
        detalle: "Cierre"
      }
    ];

    cont.innerHTML = fases.map(f => {
      const leftPct = Math.min(95, Math.max(0, (f.inicioDia / diasTotales) * 100));
      const widthPct = Math.min(100 - leftPct, Math.max(5, (f.duracionDia / diasTotales) * 100));

      return `
        <div class="gantt-row">
          <div class="font-bold text-slate-700 flex justify-between pr-2">
            <span>${f.nombre}</span>
            <span class="text-xs text-slate-400 font-normal">(${f.detalle})</span>
          </div>
          <div class="gantt-bar-track">
            <div class="gantt-bar ${f.clase}" style="left: ${leftPct.toFixed(1)}%; width: ${widthPct.toFixed(1)}%;">
              ${f.duracionDia}d
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- RENDER EXCLUSIONES INTERACTIVAS ---
  renderExclusiones() {
    const cont = document.getElementById('contenedorExclusiones');
    if (!cont) return;

    if (!this.proyecto.exclusiones || !Array.isArray(this.proyecto.exclusiones)) {
      this.proyecto.exclusiones = JSON.parse(JSON.stringify(KEV_MAESTROS.exclusionesEstandar));
    }

    cont.innerHTML = this.proyecto.exclusiones.map((ex, idx) => `
      <div class="flex items-center gap-2 p-1.5 bg-white border rounded text-xs hover:bg-slate-50">
        <input type="checkbox" id="chkEx_${idx}" ${ex.activo ? 'checked' : ''} onchange="app.toggleExclusion(${idx})" class="w-4 h-4 text-blue-600 rounded">
        <input type="text" value="${ex.texto}" onchange="app.actualizarTextoExclusion(${idx}, this.value)" class="flex-1 p-1 border-0 focus:ring-1 focus:ring-blue-500 rounded text-xs ${ex.activo ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}">
        <button onclick="app.eliminarExclusion(${idx})" class="text-red-400 hover:text-red-600 p-1" title="Eliminar exclusión">&times;</button>
      </div>
    `).join('');
  }

  toggleExclusion(idx) {
    if (this.proyecto.exclusiones[idx]) {
      this.proyecto.exclusiones[idx].activo = !this.proyecto.exclusiones[idx].activo;
      this.render();
    }
  }

  actualizarTextoExclusion(idx, val) {
    if (this.proyecto.exclusiones[idx]) {
      this.proyecto.exclusiones[idx].texto = val;
      this.autoSave();
    }
  }

  agregarExclusionPersonalizada() {
    if (!this.proyecto.exclusiones) this.proyecto.exclusiones = [];
    this.proyecto.exclusiones.push({
      id: `custom_${Date.now()}`,
      texto: "Nueva exclusión o delimitación de alcance...",
      activo: true
    });
    this.render();
  }

  eliminarExclusion(idx) {
    this.proyecto.exclusiones.splice(idx, 1);
    this.render();
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
      costoUnitario: KEV_MAESTROS.tarifasHH.plc.costoUnitario,
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
    this.showToast(`Equipo agregado: ${catItem.codigo}`, "success");
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
  // GESTIÓN DE BORRADORES JSON (GUARDAR / ABRIR)
  // =========================================================================
  exportarJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.proyecto, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const filename = `Proyecto_${this.proyecto.correlativo || 'BORRADOR'}.json`;
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("Borrador JSON descargado", "success");
  }

  importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && parsed.correlativo && parsed.ingenieria) {
          this.proyecto = parsed;
          this.render();
          this.showToast(`Proyecto importado: ${parsed.correlativo}`, "success");
        } else {
          alert("El archivo no tiene el formato de proyecto KEV válido.");
        }
      } catch (err) {
        alert("Error al leer archivo JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // =========================================================================
  // COPIAR RESUMEN PARA EMAIL AL PORTAPAPELES
  // =========================================================================
  copiarResumenEmail() {
    const p = this.proyecto;
    const calc = this.calcularTotales();

    const hitosTexto = p.hitos.map(h => `  - ${h.ep} (${h.porcentaje}%): ${h.hito} -> ${this.fmtCLP(Math.round(calc.precioTotalProyecto * (h.porcentaje / 100)))}`).join('\n');

    const texto = 
`PROPUESTA TÉCNICO-COMERCIAL - KEV PROCESS SpA
============================================================
CLIENTE:      ${p.cliente} (${p.planta})
CORRELATIVO:  ${p.correlativo}
REQUERIMIENTO:${p.titulo}
FECHA:        ${new Date().toLocaleDateString('es-CL')}

1. PLAZOS Y CRONOGRAMA:
   - Semanas en oficina (Ingeniería & Programación): ${p.semanasOficina} semanas
   - Días en terreno (Montaje, Comisionamiento PEM):   ${p.diasTerreno} días

2. CUADRO DE PRECIOS (VALORES NETOS + IVA):
   - Suministro de Hardware e Insumos:  ${this.fmtCLP(calc.precioEquipos)}
   - Servicios de Ingeniería & P&PEM:   ${this.fmtCLP(calc.precioTotalProyecto - calc.precioEquipos)}
   ---------------------------------------------------------
   PRECIO TOTAL NETO:                  ${this.fmtCLP(calc.precioTotalProyecto)} CLP
   REFERENCIA EN USD (T/C $${p.dolar}):       $${calc.precioTotalUSD.toLocaleString('es-CL')} USD

3. HITOS DE PAGO:
${hitosTexto}

4. CONDICIONES:
   - Validez de la oferta: ${p.validezOferta || '30 días'}
   - Garantía técnica:     ${p.mesesGarantia || '12'} meses desde la puesta en marcha
   - Contacto:             ${KEV_MAESTROS.empresa.contacto} (${KEV_MAESTROS.empresa.movil})
============================================================`;

    navigator.clipboard.writeText(texto).then(() => {
      this.showToast("¡Resumen ejecutivo copiado al portapapeles!", "success");
    }).catch(err => {
      alert("Error al copiar al portapapeles: " + err.message);
    });
  }

  // =========================================================================
  // IMPORTADOR INTELIGENTE DE PLANILLAS EXCEL (.XLSX) CON EXCELJS
  // =========================================================================
  abrirModalImportarXLSX() {
    document.getElementById('modalImportarXLSX').classList.remove('hidden');
    document.getElementById('infoImportando').classList.add('hidden');
  }

  cerrarModalImportarXLSX() {
    document.getElementById('modalImportarXLSX').classList.add('hidden');
  }

  async procesarArchivoXLSX(event) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    const info = document.getElementById('infoImportando');
    if (info) info.classList.remove('hidden');

    try {
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      // 1. Leer RESUMEN GENERAL
      const wsResumen = wb.getWorksheet('RESUMEN GENERAL');
      if (!wsResumen) {
        throw new Error("La planilla no contiene la hoja 'RESUMEN GENERAL'. Verifique que corresponda al formato KEV Process.");
      }

      const cliente = wsResumen.getCell('D5').text || wsResumen.getCell('D5').value || 'CLIENTE IMPORTADO';
      const correlativo = wsResumen.getCell('D6').text || wsResumen.getCell('D6').value || '000-2026';
      const titulo = wsResumen.getCell('D7').text || wsResumen.getCell('D7').value || file.name.replace('.xlsx', '');
      const dolarVal = Number(wsResumen.getCell('H24').value) || 950;
      const ufVal = Number(wsResumen.getCell('H25').value) || 40800;

      // Leer márgenes
      const mIng = Number(wsResumen.getCell('E13').value) || 0.55;
      const mAdic = Number(wsResumen.getCell('E14').value) || 0.30;
      const mInt = Number(wsResumen.getCell('E15').value) || 0.55;
      const mEq = Number(wsResumen.getCell('E16').value) || 0.30;
      const mFl = Number(wsResumen.getCell('E17').value) || 0.10;
      const mMo = Number(wsResumen.getCell('E18').value) || 0.30;
      const mOt = Number(wsResumen.getCell('E19').value) || 0.10;

      // 2. Leer Ingeniería y Planificación
      const wsIng = wb.getWorksheet('Ingeniería y Planificación');
      const ingList = [];
      if (wsIng) {
        for (let r = 8; r <= 30; r++) {
          const item = wsIng.getCell(`B${r}`).text || wsIng.getCell(`B${r}`).value;
          const desc = wsIng.getCell(`C${r}`).text || wsIng.getCell(`C${r}`).value;
          const hh = Number(wsIng.getCell(`E${r}`).value) || 0;
          const cu = Number(wsIng.getCell(`F${r}`).value) || 0;
          const obs = wsIng.getCell(`H${r}`).text || wsIng.getCell(`H${r}`).value || '';

          if (desc && (hh > 0 || cu > 0)) {
            ingList.push({
              id: String(item || `1.${ingList.length + 1}`),
              perfil: String(desc),
              hh: hh,
              costoUnitario: cu,
              comentario: String(obs)
            });
          }
        }
      }

      // 3. Leer Equipos
      const wsEq = wb.getWorksheet('Equipos');
      const eqList = [];
      if (wsEq) {
        for (let r = 8; r <= 40; r++) {
          const item = wsEq.getCell(`B${r}`).text || wsEq.getCell(`B${r}`).value;
          const cod = wsEq.getCell(`C${r}`).text || wsEq.getCell(`C${r}`).value || '';
          const desc = wsEq.getCell(`D${r}`).text || wsEq.getCell(`D${r}`).value;
          const grupo = wsEq.getCell(`E${r}`).text || wsEq.getCell(`E${r}`).value || 'XG';
          const lista = Number(wsEq.getCell(`F${r}`).value) || 0;
          const cant = Number(wsEq.getCell(`H${r}`).value) || 0;
          const cuCLP = Number(wsEq.getCell(`J${r}`).value) || 0;

          if (desc && (cant > 0 || lista > 0 || cuCLP > 0)) {
            eqList.push({
              item: String(item || `4.${String(eqList.length + 1).padStart(2, '0')}`),
              codigo: String(cod),
              descripcion: String(desc),
              grupo: String(grupo).trim() || 'XG',
              listaUSD: lista,
              unidad: 'CU',
              cantidad: cant,
              costoCLP: lista === 0 ? cuCLP : 0
            });
          }
        }
      }

      // 4. Leer Integración Eléctrica
      const wsInt = wb.getWorksheet('Integración Eléctrica');
      const intList = [];
      if (wsInt) {
        for (let r = 8; r <= 25; r++) {
          const item = wsInt.getCell(`B${r}`).text || wsInt.getCell(`B${r}`).value;
          const desc = wsInt.getCell(`C${r}`).text || wsInt.getCell(`C${r}`).value;
          const unid = wsInt.getCell(`D${r}`).text || wsInt.getCell(`D${r}`).value || 'HH';
          const cant = Number(wsInt.getCell(`E${r}`).value) || 0;
          const cu = Number(wsInt.getCell(`F${r}`).value) || 0;

          if (desc && (cant > 0 || cu > 0)) {
            intList.push({
              id: String(item || `3.${String(intList.length + 1).padStart(2, '0')}`),
              descripcion: String(desc),
              unidad: String(unid),
              cantidad: cant,
              costoUnitario: cu
            });
          }
        }
      }

      // 5. Leer Otros (Viáticos)
      const wsOt = wb.getWorksheet('Otros');
      const otList = [];
      if (wsOt) {
        for (let r = 8; r <= 25; r++) {
          const item = wsOt.getCell(`B${r}`).text || wsOt.getCell(`B${r}`).value;
          const desc = wsOt.getCell(`C${r}`).text || wsOt.getCell(`C${r}`).value;
          const unid = wsOt.getCell(`D${r}`).text || wsOt.getCell(`D${r}`).value || 'C/U';
          const cant = Number(wsOt.getCell(`E${r}`).value) || 0;
          const cu = Number(wsOt.getCell(`F${r}`).value) || 0;

          if (desc && (cant > 0 || cu > 0)) {
            otList.push({
              item: String(item || `7.${String(otList.length + 1).padStart(2, '0')}`),
              descripcion: String(desc),
              unidad: String(unid),
              cantidad: cant,
              costoUnitario: cu
            });
          }
        }
      }

      // 6. Leer Flete
      const wsFl = wb.getWorksheet('Flete');
      const flList = [];
      if (wsFl) {
        for (let r = 8; r <= 15; r++) {
          const item = wsFl.getCell(`B${r}`).text || wsFl.getCell(`B${r}`).value;
          const desc = wsFl.getCell(`C${r}`).text || wsFl.getCell(`C${r}`).value;
          const cant = Number(wsFl.getCell(`E${r}`).value) || 0;
          const cu = Number(wsFl.getCell(`F${r}`).value) || 0;
          if (desc && (cant > 0 || cu > 0)) {
            flList.push({ item: String(item || '5.01'), descripcion: String(desc), unidad: 'C/U', cantidad: cant, costoUnitario: cu });
          }
        }
      }

      // Actualizar estado del proyecto
      this.proyecto = {
        cliente: String(cliente),
        planta: "Planta Principal",
        correlativo: String(correlativo),
        titulo: String(titulo),
        contactoCliente: "Estimados Señores",
        dolar: dolarVal,
        uf: ufVal,
        semanasOficina: 2,
        diasTerreno: 4,
        mesesGarantia: "12",
        validezOferta: "30 días a contar de fecha de hoy",
        notasEspeciales: "",
        ingenieria: ingList.length > 0 ? ingList : JSON.parse(JSON.stringify(PRESETS_PROYECTOS['101-2026'].ingenieria)),
        adicionales: [],
        integracionElectrica: intList.length > 0 ? intList : JSON.parse(JSON.stringify(PRESETS_PROYECTOS['101-2026'].integracionElectrica)),
        equipos: eqList.length > 0 ? eqList : JSON.parse(JSON.stringify(PRESETS_PROYECTOS['101-2026'].equipos)),
        flete: flList.length > 0 ? flList : JSON.parse(JSON.stringify(PRESETS_PROYECTOS['101-2026'].flete)),
        montaje: [],
        otros: otList.length > 0 ? otList : JSON.parse(JSON.stringify(PRESETS_PROYECTOS['101-2026'].otros)),
        margenes: {
          ingenieria: mIng,
          adicionales: mAdic,
          integracion: mInt,
          equipos: mEq,
          flete: mFl,
          montaje: mMo,
          otros: mOt
        },
        hitos: JSON.parse(JSON.stringify(KEV_MAESTROS.hitosPagoEstandar)),
        exclusiones: JSON.parse(JSON.stringify(KEV_MAESTROS.exclusionesEstandar))
      };

      this.render();
      this.cerrarModalImportarXLSX();
      this.showToast(`¡Planilla importada exitosamente! (${correlativo})`, "success");

    } catch (err) {
      console.error("Error al importar XLSX:", err);
      alert("Error al importar la planilla: " + err.message);
    } finally {
      if (info) info.classList.add('hidden');
    }
  }

  // =========================================================================
  // GESTOR DE CONFIGURACIÓN Y TARIFAS PERSONALIZADAS
  // =========================================================================
  abrirModalConfiguracion(tab = 'hh') {
    this.renderConfiguracion();
    document.getElementById('modalConfiguracion').classList.remove('hidden');
    this.setTabConfig(tab);
    if (tab === 'siemens') {
      this.renderTabConfiguracion('siemens');
    }
    if (window.lucide) lucide.createIcons();
  }

  cerrarModalConfiguracion() {
    document.getElementById('modalConfiguracion').classList.add('hidden');
  }

  setTabConfig(tab) {
    this.tabConfigActual = tab;
    ['hh', 'logistica', 'equipos', 'siemens'].forEach(t => {
      const btn = document.getElementById(`btnTabCfg${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const pane = document.getElementById(`cfgPane_${t}`);
      if (btn && pane) {
        if (t === tab) {
          btn.className = "px-3 py-1 font-bold rounded bg-blue-100 text-blue-900";
          pane.classList.remove('hidden');
        } else {
          btn.className = "px-3 py-1 font-semibold rounded bg-slate-100 text-slate-700";
          pane.classList.add('hidden');
        }
      }
    });
  }

  renderConfiguracion() {
    // 1. Lista HH
    const contHH = document.getElementById('cfgListaHH');
    if (contHH) {
      contHH.innerHTML = Object.keys(KEV_MAESTROS.tarifasHH).map(k => {
        const item = KEV_MAESTROS.tarifasHH[k];
        return `
          <div class="flex items-center justify-between p-2 bg-slate-50 border rounded">
            <span class="font-bold text-slate-800">${item.nombre}</span>
            <div class="flex items-center gap-2">
              <span class="text-slate-500 font-semibold">$</span>
              <input type="number" id="cfg_hh_${k}" value="${item.costoUnitario}" step="500" class="w-32 p-1 border rounded font-mono font-bold text-right">
              <span class="text-slate-500 font-semibold">/ HH</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Lista Logística
    const contLog = document.getElementById('cfgListaLogistica');
    if (contLog) {
      contLog.innerHTML = Object.keys(KEV_MAESTROS.tarifasLogisticas).map(k => {
        const item = KEV_MAESTROS.tarifasLogisticas[k];
        return `
          <div class="flex items-center justify-between p-2 bg-slate-50 border rounded">
            <span class="font-bold text-slate-800">${item.nombre}</span>
            <div class="flex items-center gap-2">
              <span class="text-slate-500 font-semibold">$</span>
              <input type="number" id="cfg_log_${k}" value="${item.costoUnitario}" step="5000" class="w-32 p-1 border rounded font-mono font-bold text-right">
              <span class="text-slate-500 font-semibold">${item.unidad}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Catálogo Equipos
    const tbodyEq = document.getElementById('cfgTbodyEquipos');
    if (tbodyEq) {
      tbodyEq.innerHTML = KEV_MAESTROS.catalogoEquiposFrecuentes.map((eq, idx) => `
        <tr>
          <td><input type="text" value="${eq.codigo}" id="cfg_eq_cod_${idx}" class="font-mono text-xs"></td>
          <td><input type="text" value="${eq.descripcion}" id="cfg_eq_desc_${idx}" class="text-xs"></td>
          <td><input type="text" value="${eq.grupo}" id="cfg_eq_grp_${idx}" class="text-center font-mono text-xs"></td>
          <td><input type="number" value="${eq.listaUSD || 0}" step="0.01" id="cfg_eq_usd_${idx}" class="text-right font-mono text-xs"></td>
          <td class="text-center">
            <button onclick="app.eliminarEquipoDeCatalogo(${idx})" class="text-red-500 hover:text-red-700 font-bold">&times;</button>
          </td>
        </tr>
      `).join('');
    }
  }


  editarFamiliaSiemensNombre(codigo, nombre) {
    if (KEV_MAESTROS.descuentosSiemens[codigo]) {
      KEV_MAESTROS.descuentosSiemens[codigo].nombre = nombre;
    }
  }

  editarFamiliaSiemensDescuento(codigo, valorPct) {
    const pct = Math.max(0, Math.min(100, Number(valorPct) || 0));
    if (KEV_MAESTROS.descuentosSiemens[codigo]) {
      KEV_MAESTROS.descuentosSiemens[codigo].descuento = pct / 100;
      this.render();
    }
  }

  agregarFamiliaSiemens() {
    const cod = prompt("Ingrese el Código de la nueva Familia Siemens (ej: SF, SC, M1):");
    if (!cod) return;
    const cleanCod = cod.trim().toUpperCase();
    if (KEV_MAESTROS.descuentosSiemens[cleanCod]) {
      alert("La familia " + cleanCod + " ya existe.");
      return;
    }
    const nombre = prompt("Descripción de la Familia / Categoría:", "Familia " + cleanCod);
    const pctStr = prompt("% de Descuento Oficial (ej: 45):", "40");
    const pct = Math.max(0, Math.min(100, Number(pctStr) || 40));

    KEV_MAESTROS.descuentosSiemens[cleanCod] = {
      nombre: nombre || ("Familia " + cleanCod),
      descuento: pct / 100
    };

    localStorage.setItem('kev_cfg_descuentos_siemens', JSON.stringify(KEV_MAESTROS.descuentosSiemens));
    this.renderTabConfiguracion('siemens');
    this.render();
    this.showToast(`Familia Siemens ${cleanCod} agregada (${pct}%)`, "success");
  }

  eliminarFamiliaSiemens(codigo) {
    if (codigo === 'NETO') return;
    if (confirm(`¿Eliminar la familia Siemens ${codigo}?`)) {
      delete KEV_MAESTROS.descuentosSiemens[codigo];
      localStorage.setItem('kev_cfg_descuentos_siemens', JSON.stringify(KEV_MAESTROS.descuentosSiemens));
      this.renderTabConfiguracion('siemens');
      this.render();
      this.showToast(`Familia ${codigo} eliminada`, "info");
    }
  }

  agregarEquipoACatalogo() {
    KEV_MAESTROS.catalogoEquiposFrecuentes.unshift({
      codigo: "NUEVO-CODIGO",
      descripcion: "Descripción de equipo frecuente",
      grupo: "XG",
      listaUSD: 500,
      unidad: "CU"
    });
    this.renderConfiguracion();
  }

  eliminarEquipoDeCatalogo(idx) {
    KEV_MAESTROS.catalogoEquiposFrecuentes.splice(idx, 1);
    this.renderConfiguracion();
  }

  guardarConfiguracionPersonalizada() {
    // Guardar HH
    const cfgHH = {};
    Object.keys(KEV_MAESTROS.tarifasHH).forEach(k => {
      const el = document.getElementById(`cfg_hh_${k}`);
      if (el) {
        const val = Number(el.value) || KEV_MAESTROS.tarifasHH[k].costoUnitario;
        KEV_MAESTROS.tarifasHH[k].costoUnitario = val;
        cfgHH[k] = val;
      }
    });
    localStorage.setItem('kev_cfg_tarifas_hh', JSON.stringify(cfgHH));

    // Guardar Logística
    const cfgLog = {};
    Object.keys(KEV_MAESTROS.tarifasLogisticas).forEach(k => {
      const el = document.getElementById(`cfg_log_${k}`);
      if (el) {
        const val = Number(el.value) || KEV_MAESTROS.tarifasLogisticas[k].costoUnitario;
        KEV_MAESTROS.tarifasLogisticas[k].costoUnitario = val;
        cfgLog[k] = val;
      }
    });
    localStorage.setItem('kev_cfg_tarifas_logistica', JSON.stringify(cfgLog));

    // Guardar Catálogo Equipos
    KEV_MAESTROS.catalogoEquiposFrecuentes.forEach((eq, idx) => {
      const elCod = document.getElementById(`cfg_eq_cod_${idx}`);
      const elDesc = document.getElementById(`cfg_eq_desc_${idx}`);
      const elGrp = document.getElementById(`cfg_eq_grp_${idx}`);
      const elUSD = document.getElementById(`cfg_eq_usd_${idx}`);
      if (elCod) eq.codigo = elCod.value;
      if (elDesc) eq.descripcion = elDesc.value;
      if (elGrp) eq.grupo = elGrp.value;
      if (elUSD) eq.listaUSD = Number(elUSD.value) || 0;
    });
    localStorage.setItem('kev_cfg_catalogo_equipos', JSON.stringify(KEV_MAESTROS.catalogoEquiposFrecuentes));
    localStorage.setItem('kev_cfg_descuentos_siemens', JSON.stringify(KEV_MAESTROS.descuentosSiemens));

    this.inicializarSelectores();
    this.cerrarModalConfiguracion();
    this.showToast("Configuración personalizada guardada con éxito", "success");
  }

  restablecerTarifasFabrica() {
    if (confirm("¿Desea restablecer todas las tarifas y catálogo a los valores predeterminados de fábrica?")) {
      localStorage.removeItem('kev_cfg_tarifas_hh');
      localStorage.removeItem('kev_cfg_tarifas_logistica');
      localStorage.removeItem('kev_cfg_catalogo_equipos');
      localStorage.removeItem('kev_cfg_descuentos_siemens');
      location.reload();
    }
  }

  // =========================================================================
  // TOAST NOTIFICATIONS HELPER
  // =========================================================================
  showToast(mensaje, tipo = 'success') {
    const cont = document.getElementById('toastContainer');
    if (!cont) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    let iconName = 'check-circle';
    if (tipo === 'warning') iconName = 'alert-triangle';
    if (tipo === 'info') iconName = 'info';

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4"></i>
      <span>${mensaje}</span>
    `;

    cont.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.remove();
      }
    }, 4000);
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

      const rHeaders = ['ITEM', 'DESCRIPCIÓN', 'COSTO TOTAL', 'MARGEN', 'PRECIO', 'PRECIO USD'];
      rHeaders.forEach((h, i) => {
        const c = wsResumen.getCell(12, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
        c.alignment = { horizontal: i >= 2 ? 'right' : 'left' };
      });

      const itemsResumen = [
        { item: '1,0', desc: 'Ingeniería y planificación', cost: calc.costoIngenieria, m: p.margenes.ingenieria },
        { item: '2,0', desc: 'Adicionales', cost: calc.costoAdicionales, m: p.margenes.adicionales },
        { item: '3,0', desc: 'Integración Eléctrica', cost: calc.costoIntegracion, m: p.margenes.integracion },
        { item: '4,0', desc: 'Equipos', cost: calc.costoEquipos, m: p.margenes.equipos },
        { item: '5,0', desc: 'Flete', cost: calc.costoFlete, m: p.margenes.flete },
        { item: '6,0', desc: 'Montaje y Puesta en Marcha', cost: calc.costoMontaje, m: p.margenes.montaje },
        { item: '7,0', desc: 'Otros: Viajes, visitas a terreno, levantamientos', cost: calc.costoOtros, m: p.margenes.otros }
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
      wsAdic.columns = [{ width: 5 }, { width: 10 }, { width: 40 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 18 }];
      wsAdic.getCell('B2').value = 'PLAN DE COMPRAS PRELIMINAR - ADICIONALES';
      wsAdic.getCell('B5').value = '2,0';
      wsAdic.getCell('C5').value = 'Adicionales e Imprevistos';
      ['ITEM', 'DESCRIPCIÓN', 'UNIDAD', 'CANTIDAD', 'COSTO UNIT', 'COSTO'].forEach((h, i) => {
        const c = wsAdic.getCell(7, i + 2);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: azulMedio };
        c.font = fontHeader;
      });
      const adicRows = p.adicionales || [];
      adicRows.forEach((row, i) => {
        const r = 8 + i;
        const cant = Number(row.cantidad) || 1;
        const cu = Number(row.costoUnitario) !== undefined ? Number(row.costoUnitario) : (Number(row.costo) || 0);
        wsAdic.getCell(`B${r}`).value = row.item || `2.0${i + 1}`;
        wsAdic.getCell(`C${r}`).value = row.descripcion;
        wsAdic.getCell(`D${r}`).value = row.unidad || 'GL';
        wsAdic.getCell(`E${r}`).value = cant;
        wsAdic.getCell(`F${r}`).value = cu;
        wsAdic.getCell(`F${r}`).numFmt = '$ #,##0';
        wsAdic.getCell(`G${r}`).value = { formula: `E${r}*F${r}`, result: cant * cu };
        wsAdic.getCell(`G${r}`).numFmt = '$ #,##0';
      });
      wsAdic.getCell('F20').value = 'COSTO TOTAL';
      wsAdic.getCell('F20').font = { bold: true };
      wsAdic.getCell('G20').value = adicRows.length > 0 ? { formula: `SUM(G8:G${7 + adicRows.length})`, result: calc.costoAdicionales } : calc.costoAdicionales;
      wsAdic.getCell('G20').numFmt = '$ #,##0';
      wsAdic.getCell('G20').font = { bold: true };

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
      this.showToast("Planilla XLSX generada con éxito", "success");

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

      const tableBorderDefault = {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
      };

      // Filtrar solo exclusiones activas
      const exclusionesActivas = (p.exclusiones && Array.isArray(p.exclusiones))
        ? p.exclusiones.filter(e => e.activo)
        : KEV_MAESTROS.exclusionesEstandar.filter(e => e.activo);

      // Texto de garantía adaptado con meses dinámicos
      
      // =======================================================================
      // CONSTRUCCIÓN DE CARTA GANTT NATIVA PARA WORD
      // =======================================================================
      const semOfi = Math.max(1, Number(p.semanasOficina) || 1);
      const semTerr = Math.max(1, Math.ceil((Number(p.diasTerreno) || 4) / 5));
      const totalSemanasGantt = semOfi + semTerr;

      const ganttHeaderCells = [
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "ÍTEM", bold: true, color: "FFFFFF", size: 18 })] })], shading: { fill: "0F2744" } }),
        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "FASE / ACTIVIDAD DEL PROYECTO", bold: true, color: "FFFFFF", size: 18 })] })], shading: { fill: "0F2744" } }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "MODALIDAD", bold: true, color: "FFFFFF", size: 18 })] })], shading: { fill: "0F2744" } }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "DURACIÓN", bold: true, color: "FFFFFF", size: 18 })] })], shading: { fill: "0F2744" } })
      ];

      const semanaColPct = Math.max(3, Math.floor(20 / totalSemanasGantt));
      for (let s = 1; s <= totalSemanasGantt; s++) {
        ganttHeaderCells.push(
          new TableCell({
            width: { size: semanaColPct, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `S${s}`, bold: true, color: "FFFFFF", size: 18 })] })],
            shading: { fill: "1B365D" }
          })
        );
      }

      const ganttFases = [
        { item: "1.0", desc: "Ingeniería de Detalle y Planimetría", lugar: "Oficina KEV", dur: `${semOfi} Semanas`, start: 1, end: semOfi },
        { item: "2.0", desc: "Programación PLC/SCADA y Pruebas FAT", lugar: "Oficina / Taller", dur: `${Math.min(2, semOfi)} Semanas`, start: Math.max(1, semOfi - 1), end: semOfi },
        { item: "3.0", desc: "Montaje Eléctrico y Canalizaciones", lugar: "Terreno Faena", dur: `${p.diasTerreno || 4} Días`, start: semOfi + 1, end: totalSemanasGantt },
        { item: "4.0", desc: "Puesta en Marcha (PEM) y Pruebas SAT", lugar: "Terreno Faena", dur: `${p.diasTerreno || 4} Días`, start: semOfi + 1, end: totalSemanasGantt },
        { item: "5.0", desc: "Capacitación y Entrega Conforme", lugar: "Terreno Faena", dur: "1 Semana", start: totalSemanasGantt, end: totalSemanasGantt }
      ];

      const ganttTableRows = [
        new TableRow({ children: ganttHeaderCells }),
        ...ganttFases.map(fase => {
          const cells = [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fase.item, bold: true, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fase.desc, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fase.lugar, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fase.dur, size: 18 })] })] })
          ];
          for (let s = 1; s <= totalSemanasGantt; s++) {
            const activo = (s >= fase.start && s <= fase.end);
            cells.push(
              new TableCell({
                alignment: AlignmentType.CENTER,
                shading: activo ? { fill: "2563EB" } : undefined,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: activo ? "■" : "", bold: true, color: "FFFFFF", size: 16 })] })]
              })
            );
          }
          return new TableRow({ children: cells });
        })
      ];

      const tablaGanttWord = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDefault,
        rows: ganttTableRows
      });

      const basesLegalesAdaptadas = KEV_MAESTROS.basesLegalesGarantia.map(b => {
        if (b.titulo.includes("Vigencia")) {
          return {
            titulo: b.titulo,
            texto: `La garantía técnica tiene una vigencia de ${p.mesesGarantia || 12} meses a contar de la firma del acta de comisionamiento formal y entrega de documentación conforme.`
          };
        }
        return b;
      });

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
            ...exclusionesActivas.map(ex => new Paragraph({ text: `• ${ex.texto}` })),

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

            // NOTAS ESPECIALES SI EXISTEN
            ...(p.notasEspeciales ? [
              new Paragraph({
                text: "Notas Especiales:",
                bold: true,
                spacing: { before: 150, after: 60 }
              }),
              new Paragraph({
                text: p.notasEspeciales,
                spacing: { after: 150 }
              })
            ] : []),

            // 9. BASES LEGALES Y GARANTÍA
            new Paragraph({
              text: "9. Bases Legales, Contractuales y Garantía KEV Process",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 120 }
            }),
            ...basesLegalesAdaptadas.flatMap(b => [
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
      this.showToast("Propuesta Word generada con éxito", "success");

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

    const exclusionesActivas = (p.exclusiones && Array.isArray(p.exclusiones))
      ? p.exclusiones.filter(e => e.activo)
      : KEV_MAESTROS.exclusionesEstandar.filter(e => e.activo);

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
          <h4 class="font-bold text-slate-800 text-sm">1. Propuesta Técnica & Cronograma</h4>
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
          <h4 class="font-bold text-slate-800 text-sm">4. Exclusiones de la Oferta</h4>
          <ul class="list-disc pl-5 space-y-1">
            ${exclusionesActivas.map(ex => `<li>${ex.texto}</li>`).join('')}
          </ul>
        </div>

        ${p.notasEspeciales ? `
          <div>
            <h4 class="font-bold text-slate-800 text-sm">5. Notas Especiales</h4>
            <p class="text-xs text-slate-700">${p.notasEspeciales}</p>
          </div>
        ` : ''}

        <div>
          <h4 class="font-bold text-slate-800 text-sm">6. Bases Legales y Términos de Garantía (${p.mesesGarantia || '12'} Meses)</h4>
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
