// =============================================
//  MONTEVERDI MAQUINARIAS — Logic Controller
// =============================================

const ADMIN_PASS_KEY = 'm3maq_admin_pass';
function getAdminPass() {
  try {
    const v = localStorage.getItem(ADMIN_PASS_KEY);
    if (v && v.trim()) return v.trim();
  } catch (e) {}
  return 'monteverdi';
}
const OBRAS_DEFAULT = [
  'DUHAU',
  'CHACRAS PARK',
  'BRODA',
  'IRIS DALVIAN',
  'IGLESIA ACUTIS',
  'ZOCO',
  'HOTEL DAKAR',
  'SAN JUAN',
  'TALLER MECANICO',
  'OTRAS'
];

function cargarObras() {
  try {
    const guardadas = localStorage.getItem('m3maq_obras');
    if (guardadas) {
      OBRAS.length = 0;
      guardadas.split('\n').forEach(line => {
        const v = line.trim();
        if (v) OBRAS.push(v);
      });
    }
  } catch (e) {}
}

let OBRAS = [];

// Variables globales de la app
let maquinas = [];
let maquinistas = [];
let reportes = [];
let ots = [];
let reparaciones = [];
let serviciosProximos = [];
let documentos = [];
let historial = [];

let tipoReporteSeleccionado = '';
let adminValidado = false;
let editingMaquinaId = null;
let editingMaquinistaId = null;
let editingType = null; // 'maquina' | 'maquinista'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Devuelve el código corto de la máquina (ej: "CASE580-RE01" -> "RE 01")
function codigoCorto(id) {
  if (!id) return '-';
  const partes = String(id).split(/[\s-]+/).filter(Boolean);
  const last = partes[partes.length - 1] || String(id);
  return last.replace(/([A-Za-z]+)(\d+)/, '$1 $2').toUpperCase();
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  cargarObras();
  if (OBRAS.length === 0) OBRAS.push(...OBRAS_DEFAULT);

  // Establecer fecha por defecto en forms
  const hoy = new Date().toISOString().split('T')[0];
  if (document.getElementById('r-fec')) document.getElementById('r-fec').value = hoy;
  if (document.getElementById('rep-fecha')) document.getElementById('rep-fecha').value = hoy;
  if (document.getElementById('srv-proxima-fecha')) document.getElementById('srv-proxima-fecha').value = hoy;

  // Cargar datos iniciales
  await cargarTodo();

  // Escuchar estado online/offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
});

// Manejo de conexión online/offline
function updateOnlineStatus() {
  const badge = document.getElementById('online-badge');
  if (navigator.onLine) {
    badge.className = 'online-badge on';
    badge.innerHTML = '<i class="ti ti-wifi"></i> En línea';
  } else {
    badge.className = 'online-badge off';
    badge.innerHTML = '<i class="ti ti-wifi-off"></i> Sin conexión';
  }
}

// Cargar todos los datos desde Supabase
async function cargarTodo() {
  try {
    const pMaquinas = sb.from('maquinas').select('*').order('id', { ascending: true });
    const pMaquinistas = sb.from('maquinistas').select('*').order('nombre', { ascending: true });
    const pReportes = sb.from('reportes').select('*').order('fecha', { ascending: false });
    const pOts = sb.from('ots').select('*').order('created_at', { ascending: false });
    const pReparaciones = sb.from('reparaciones').select('*').order('created_at', { ascending: false });
    const pServicios = sb.from('servicios_proximos').select('*');
    const pDocs = sb.from('documentos').select('*').order('nombre', { ascending: true });
    const pHist = sb.from('historial_maquinas').select('*').order('fecha', { ascending: false });

    const [rMaq, rOp, rRep, rOt, rRepa, rSrv, rDocs, rHist] = await Promise.all([
      pMaquinas, pMaquinistas, pReportes, pOts, pReparaciones, pServicios, pDocs, pHist
    ]);

    maquinas = rMaq.data || [];
    maquinistas = rOp.data || [];
    reportes = rRep.data || [];
    ots = rOt.data || [];
    reparaciones = rRepa.data || [];
    serviciosProximos = rSrv.data || [];
    documentos = rDocs.data || [];
    historial = rHist.data || [];

    console.log('Datos cargados:', { maquinas, maquinistas, reportes, ots, reparaciones, serviciosProximos, documentos });

    // Actualizar todas las interfaces
    actualizarVistas();

  } catch (err) {
    console.error('Error al cargar datos de Supabase:', err);
    showMsg('error', 'Error de red al sincronizar datos');
  }
}

function actualizarVistas() {
  populateSelects();
  renderDashboard();
  renderListaOTs();
  renderMaquinistas();
  renderUbicacion();
  renderHistorial();
  loadOTsParaReparar();
  renderConfigListas();
}

// Mostrar mensajes (éxito o error)
function showMsg(tipo, txt) {
  const okBox = document.getElementById('ok-msg');
  const errBox = document.getElementById('err-msg');
  
  if (tipo === 'success') {
    okBox.querySelector('span').innerText = txt;
    okBox.style.display = 'flex';
    setTimeout(() => okBox.style.display = 'none', 4000);
  } else {
    errBox.querySelector('span').innerText = txt;
    errBox.style.display = 'flex';
    setTimeout(() => errBox.style.display = 'none', 4000);
  }
}

// Navegación de pestañas
function showTab(tabId, btn) {
  // Ocultar panes
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('on'));
  // Mostrar el correspondiente
  document.getElementById('pane-' + tabId).classList.add('on');
  
  // Clases active
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  if (btn) btn.classList.add('on');

  if (tabId === 'ubicacion') {
    renderUbicacion();
  }

  if (tabId === 'historial') {
    renderHistorial();
  }
}

function askKeyMaquinistas(btn) {
  if (adminValidado) {
    showTab('maquinistas', btn);
    return;
  }
  const clave = prompt('Introduce la contraseña de configuración:');
  if (clave === getAdminPass()) {
    adminValidado = true;
    showTab('maquinistas', btn);
    showMsg('success', 'Acceso de administrador concedido');
  } else if (clave !== null) {
    alert('Contraseña incorrecta');
  }
}

function askKeyOT(btn) {
  if (adminValidado) {
    showTab('ot', btn);
    return;
  }
  const clave = prompt('Introduce la contraseña de configuración:');
  if (clave === getAdminPass()) {
    adminValidado = true;
    showTab('ot', btn);
    showMsg('success', 'Acceso de administrador concedido');
  } else if (clave !== null) {
    alert('Contraseña incorrecta');
  }
}

function askKeyUbicacion(btn) {
  if (adminValidado) {
    showTab('ubicacion', btn);
    renderUbicacion();
    return;
  }
  const clave = prompt('Introduce la contraseña de configuración:');
  if (clave === getAdminPass()) {
    adminValidado = true;
    showTab('ubicacion', btn);
    showMsg('success', 'Acceso de administrador concedido');
    renderUbicacion();
  } else if (clave !== null) {
    alert('Contraseña incorrecta');
  }
}

// Solicitar contraseña para Configuración
function askKey(btn) {
  if (adminValidado) {
    showTab('config', btn);
    cargarConfigObras();
    return;
  }
  
  const clave = prompt('Introduce la contraseña de configuración:');
  if (clave === getAdminPass()) {
    adminValidado = true;
    showTab('config', btn);
    showMsg('success', 'Acceso de administrador concedido');
    cargarConfigObras();
  } else if (clave !== null) {
    alert('Contraseña incorrecta');
  }
}

// Verificar contraseña de administrador (reutilizable para acciones protegidas)
function verificarAdmin() {
  if (adminValidado) return true;
  const clave = prompt('Introduce la contraseña de administrador para continuar:');
  if (clave === null) return false;
  if (clave === getAdminPass()) {
    adminValidado = true;
    return true;
  }
  alert('Contraseña incorrecta');
  return false;
}

// Eliminar una OT y su reporte asociado (protegido por contraseña)
async function eliminarOT(otId) {
  if (!verificarAdmin()) return;
  if (!confirm('¿Eliminar esta OT y su reporte asociado? Esta acción no se puede deshacer.')) return;
  try {
    const ot = ots.find(o => o.id === otId);
    const reporteId = ot ? ot.reporte_id : null;
    if (reporteId) {
      const { error: spErr } = await sb.from('servicios_proximos').delete().eq('reporte_id', reporteId);
      if (spErr) throw spErr;
      const { error: repErr } = await sb.from('reportes').delete().eq('id', reporteId);
      if (repErr) throw repErr;
    } else {
      const { error: otErr } = await sb.from('ots').delete().eq('id', otId);
      if (otErr) throw otErr;
    }
    showMsg('success', 'OT eliminada correctamente');
    await cargarTodo();
  } catch (err) {
    console.error('Error al eliminar OT:', err);
    showMsg('error', 'Error al eliminar la OT');
  }
}

// Rellenar selects dinámicos
function populateSelects() {
  const rMaq = document.getElementById('r-maq');
  const rMaqList = document.getElementById('r-maq-list');
  const filOtMaq = document.getElementById('fil-ot-maq');
  const filOtSelect = document.getElementById('fil-ot-select');
  
  // Select maquinas en Reportar
  if (rMaq) {
    rMaq.innerHTML = '<option value="">-- Seleccionar Máquina --</option>' + 
      maquinas.map(m => `<option value="${m.id}">${m.id} - ${m.nombre} (${m.modelo})</option>`).join('');
  }
  
  // Select maquinistas en Reportar
  if (rMaqList) {
    rMaqList.innerHTML = '<option value="">-- Seleccionar Maquinista --</option>' +
      maquinistas.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');
  }

  // Select filtrar OT en Reparar
  if (filOtMaq) {
    filOtMaq.innerHTML = '<option value="todas">Todas las máquinas</option>' +
      maquinas.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
  }

  // Select filtrar OT en pestaña OT
  if (filOtSelect) {
    filOtSelect.innerHTML = '<option value="todas">Todas las máquinas</option>' +
      maquinas.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
  }

  // Select filtrar historial
  const filHistMaq = document.getElementById('fil-hist-maq');
  if (filHistMaq) {
    filHistMaq.innerHTML = '<option value="todas">Todas las máquinas</option>' +
      maquinas.map(m => `<option value="${m.id}">${m.id} - ${m.nombre}</option>`).join('');
  }

  // Select multiselect de máquinas en Config para maquinistas
  const confOpHabil = document.getElementById('nc-oper-habilitadas');
  if (confOpHabil) {
    confOpHabil.innerHTML = maquinas.map(m => `<option value="${m.id}">${m.id} - ${m.nombre}</option>`).join('');
  }
}

// Actualizar información del horómetro actual como sugerencia
function updateMaqHorometroLabel() {
  const maqId = document.getElementById('r-maq').value;
  const hint = document.getElementById('r-hs-hint');
  const maq = maquinas.find(m => m.id === maqId);
  
  if (maq && hint) {
    hint.innerText = `Horas actuales de la máquina: ${maq.horometro_actual} hs`;
    document.getElementById('r-hs').value = maq.horometro_actual;
    
    // Si estamos en service o engrase, actualizar el cálculo dinámico
    if (tipoReporteSeleccionado === 'service' || tipoReporteSeleccionado === 'engrase') {
      document.getElementById('srv-calc-actual').innerText = maq.horometro_actual;
      calcularProximoSrv();
    }
  } else if (hint) {
    hint.innerText = '';
  }
}

// --- PESTAÑA REPORTAR ---
function pickTipo(tipo) {
  tipoReporteSeleccionado = tipo;
  
  // Actualizar interfaz del título
  const titulos = {
    falla: '🔧 Reportar Falla Técnica',
    service: '⏰ Aviso de Service Programado',
    engrase: '🛢 Registro de Engrase',
    neumatico: '🛞 Neumáticos / Orugas',
    accesorio: '🪟 Novedad en Accesorios / Cabina'
  };
  
  document.getElementById('qp-tipo-tit').innerText = titulos[tipo] || 'Nuevo Reporte';
  
  // Ocultar paso 1, mostrar paso 2
  document.getElementById('qp-step1').classList.add('hid');
  document.getElementById('qp-step2').classList.remove('hid');
  
  // Mostrar campo extra de service/engrase si corresponde
  const srvExtra = document.getElementById('srv-extra');
  if (tipo === 'service' || tipo === 'engrase') {
    srvExtra.classList.remove('hid');
    const maqId = document.getElementById('r-maq').value;
    const maq = maquinas.find(m => m.id === maqId);
    document.getElementById('srv-calc-actual').innerText = maq ? maq.horometro_actual : 0;
    
    // Valor por defecto sugerido según tipo
    document.getElementById('srv-cada-hs').value = tipo === 'engrase' ? '250' : '500';
    calcularProximoSrv();
  } else {
    srvExtra.classList.add('hid');
  }
}

function qpBack() {
  document.getElementById('qp-step2').classList.add('hid');
  document.getElementById('qp-step1').classList.remove('hid');
}

function toggleSrvModo(modo) {
  if (modo === 'horas') {
    document.getElementById('srv-modo-horas-div').classList.remove('hid');
    document.getElementById('srv-modo-fecha-div').classList.add('hid');
  } else {
    document.getElementById('srv-modo-horas-div').classList.add('hid');
    document.getElementById('srv-modo-fecha-div').classList.remove('hid');
  }
}

function calcularProximoSrv() {
  const actualVal = parseFloat(document.getElementById('srv-calc-actual').innerText) || 0;
  const cadaVal = parseFloat(document.getElementById('srv-cada-hs').value) || 0;
  document.getElementById('srv-calc-proximo').innerText = (actualVal + cadaVal).toFixed(1);
}

// Guardar reporte
async function guardarReporte() {
  const maqId = document.getElementById('r-maq').value;
  const operId = document.getElementById('r-maq-list').value;
  const hsVal = parseFloat(document.getElementById('r-hs').value);
  const fec = document.getElementById('r-fec').value;
  const des = document.getElementById('r-des').value.trim();

  if (!maqId || !operId || isNaN(hsVal) || !des) {
    alert('Por favor complete todos los campos obligatorios (*).');
    return;
  }

  try {
    // Insertar reporte
    const { data: repData, error: repErr } = await sb.from('reportes').insert([{
      maquina_id: maqId,
      maquinista_id: operId,
      tipo: tipoReporteSeleccionado,
      descripcion: des,
      horometro: hsVal,
      fecha: fec
    }]).select();

    if (repErr) throw repErr;
    const nuevoReporte = repData[0];

    // ENGRASE: se registra en el historial de la máquina, sin crear OT
    if (tipoReporteSeleccionado === 'engrase') {
      const srvModoEl = document.querySelector('input[name="srv-modo"]:checked');
      if (srvModoEl) {
        const modo = srvModoEl.value;
        const servicioObj = {
          maquina_id: maqId,
          tipo: 'engrase',
          por_hs: (modo === 'horas'),
          reporte_id: nuevoReporte.id
        };
        if (modo === 'horas') {
          servicioObj.cada_hs = parseFloat(document.getElementById('srv-cada-hs').value);
          servicioObj.proximo_hs = hsVal + servicioObj.cada_hs;
        } else {
          servicioObj.proxima_fecha = document.getElementById('srv-proxima-fecha').value;
        }
        const { error: srvErr } = await sb.from('servicios_proximos').insert([servicioObj]);
        if (srvErr) throw srvErr;
      }

      // Registrar en el historial de la máquina
      const { error: histErr } = await sb.from('historial_maquinas').insert([{
        maquina_id: maqId,
        fecha: fec || new Date().toISOString().split('T')[0],
        tipo: 'engrase',
        descripcion: des,
        taller: '',
        repuestos: '',
        horometro: hsVal
      }]);
      if (histErr) throw histErr;

      // Actualizar solo el horómetro (sin pasar la máquina a "reparación")
      const { error: maqUpdateErr } = await sb.from('maquinas')
        .update({ horometro_actual: hsVal })
        .eq('id', maqId);
      if (maqUpdateErr) throw maqUpdateErr;

      showMsg('success', 'Engrase registrado en el historial de la máquina.');
      document.getElementById('r-des').value = '';
      qpBack();
      await cargarTodo();
      return;
    }

    // RESTO DE TIPOS: crear OT asociada automáticamente
    const numOT = `OT-${Date.now().toString().slice(-6)}`;
    const { data: otData, error: otErr } = await sb.from('ots').insert([{
      reporte_id: nuevoReporte.id,
      numero: numOT,
      estado: 'abierta',
      fecha_apertura: fec
    }]).select();

    if (otErr) throw otErr;

    // Si es service, guardar parámetros de servicio próximo
    if (tipoReporteSeleccionado === 'service') {
      const modo = document.querySelector('input[name="srv-modo"]:checked').value;
      const servicioObj = {
        maquina_id: maqId,
        tipo: 'service',
        por_hs: (modo === 'horas'),
        reporte_id: nuevoReporte.id
      };

      if (modo === 'horas') {
        servicioObj.cada_hs = parseFloat(document.getElementById('srv-cada-hs').value);
        servicioObj.proximo_hs = hsVal + servicioObj.cada_hs;
      } else {
        servicioObj.proxima_fecha = document.getElementById('srv-proxima-fecha').value;
      }

      const { error: srvErr } = await sb.from('servicios_proximos').insert([servicioObj]);
      if (srvErr) throw srvErr;
    }

    // Actualizar el horómetro y el estado de la máquina
    const { error: maqUpdateErr } = await sb.from('maquinas')
      .update({ horometro_actual: hsVal, estado: 'reparacion' }) // Se asume en reparación al tener OT abierta
      .eq('id', maqId);

    if (maqUpdateErr) throw maqUpdateErr;

    showMsg('success', `Reporte enviado con éxito. OT Generada: ${numOT}`);

    // Resetear formulario
    document.getElementById('r-des').value = '';
    qpBack();

    // Recargar datos
    await cargarTodo();

  } catch (err) {
    console.error('Error al guardar reporte:', err);
    showMsg('error', 'Error al guardar reporte en base de datos');
  }
}

// --- PESTAÕA REPARAR ---
let otParaRepararId = null;
let maqParaRepararId = null;

function loadOTsParaReparar() {
  const maqId = document.getElementById('fil-ot-maq').value;
  const listContainer = document.getElementById('lista-ots-para-reparar');

  // Filtrar OTs abiertas
  let filtradas = ots.filter(o => o.estado === 'abierta');
  if (maqId !== 'todas') {
    // Buscar reportes asociados a esta máquina
    const repIds = reportes.filter(r => r.maquina_id === maqId).map(r => r.id);
    filtradas = filtradas.filter(o => repIds.includes(o.reporte_id));
  }

  if (filtradas.length === 0) {
    listContainer.innerHTML = '<div class="loader">No hay Órdenes de Trabajo abiertas para esta máquina.</div>';
    return;
  }

  listContainer.innerHTML = filtradas.map(o => {
    const rep = reportes.find(r => r.id === o.reporte_id);
    const maq = rep ? maquinas.find(m => m.id === rep.maquina_id) : null;
    return `
      <div class="card" style="border-left:4px solid var(--az); margin-top:8px">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <strong>${o.numero} - ${maq ? maq.nombre : 'S/D'} (${rep ? rep.maquina_id : ''})</strong>
          <span class="maq-tag" style="background:var(--redl); color:var(--red)">Abierta</span>
        </div>
        <p style="font-size:12px; margin-top:6px; color:#555">${rep ? rep.descripcion : 'Sin descripción'}</p>
        <button class="bo" style="margin-top:10px; width:100%" onclick="iniciarReparacion('${o.id}')">
          <i class="ti ti-hammer"></i> Registrar Trabajo Realizado
        </button>
        <button class="bo" style="margin-top:8px; width:100%" onclick="eliminarOT('${o.id}')">
          <i class="ti ti-trash"></i> Eliminar OT
        </button>
      </div>
    `;
  }).join('');
}

function iniciarReparacion(otId) {
  const ot = ots.find(o => o.id === otId);
  if (!ot) return;

  const rep = reportes.find(r => r.id === ot.reporte_id);
  const maq = rep ? maquinas.find(m => m.id === rep.maquina_id) : null;

  otParaRepararId = otId;

  // Renderizar la info de la falla a solucionar
  document.getElementById('falla-sel-info').innerHTML = `
    <h4 style="color:var(--azd); font-weight:800; margin-bottom:8px">Falla seleccionada para reparar:</h4>
    <div style="font-size:13px">
      <strong>OT:</strong> ${ot.numero} | <strong>Máquina:</strong> ${rep ? rep.maquina_id : ''} - ${maq ? maq.nombre : ''}<br>
      <strong>Novedad:</strong> ${rep ? rep.descripcion : ''}<br>
      <strong>Prioridad:</strong> ${rep ? rep.prioridad.toUpperCase() : ''}
    </div>
  `;

  document.getElementById('buscador-ot').classList.add('hid');
  document.getElementById('form-rep').classList.remove('hid');
}

function iniciarReparacionSinOT() {
  const maqId = document.getElementById('fil-ot-maq').value;
  if (!maqId || maqId === 'todas') {
    alert('Seleccioná una máquina para registrar la reparación sin OT.');
    return;
  }
  const maq = maquinas.find(m => m.id === maqId);
  otParaRepararId = null;
  maqParaRepararId = maqId;

  document.getElementById('falla-sel-info').innerHTML = `
    <h4 style="color:var(--azd); font-weight:800; margin-bottom:8px">Reparación sin Orden de Trabajo</h4>
    <div style="font-size:13px">
      <strong>Máquina:</strong> ${maqId} - ${maq ? maq.nombre : ''}<br>
      <span style="color:#888">No se vinculará a una OT existente.</span>
    </div>
  `;

  document.getElementById('buscador-ot').classList.add('hid');
  document.getElementById('form-rep').classList.remove('hid');
}

function cancelarReparacion() {
  otParaRepararId = null;
  maqParaRepararId = null;
  document.getElementById('form-rep').classList.add('hid');
  document.getElementById('buscador-ot').classList.remove('hid');
}

async function guardarReparacion() {
  const taller = document.getElementById('rep-taller').value.trim();
  const trabajos = document.getElementById('rep-trabajos').value.trim();
  const repuestos = document.getElementById('rep-repuestos').value.trim();
  const fecha = document.getElementById('rep-fecha').value;

  if (!trabajos) {
    alert('El campo Trabajos realizados es obligatorio (*).');
    return;
  }

  try {
    // 1. Crear registro en la tabla 'reparaciones' (ot_id puede ser null si es sin OT)
    const { error: repaErr } = await sb.from('reparaciones').insert([{
      ot_id: otParaRepararId,
      taller: taller,
      trabajos: trabajos,
      repuestos: repuestos,
      fecha_entrega: fecha
    }]);

    if (repaErr) throw repaErr;

    // Determinar la máquina a la que pertenece la reparación
    let maqIdRep = maqParaRepararId;
    if (otParaRepararId) {
      const ot = ots.find(o => o.id === otParaRepararId);
      const rep = ot ? reportes.find(r => r.id === ot.reporte_id) : null;
      if (rep) maqIdRep = rep.maquina_id;
    }

    // Registrar en el historial de la máquina
    if (maqIdRep) {
      const fechaHist = fecha || new Date().toISOString().split('T')[0];
      const { error: histErr } = await sb.from('historial_maquinas').insert([{
        maquina_id: maqIdRep,
        fecha: fechaHist,
        tipo: 'trabajo',
        descripcion: trabajos,
        taller: taller,
        repuestos: repuestos,
        horometro: null
      }]);
      if (histErr) throw histErr;
    }

    if (otParaRepararId) {
      // 2. Cambiar estado de la OT a cerrada
      const { error: otErr } = await sb.from('ots')
        .update({ estado: 'cerrada', fecha_cierre: fecha })
        .eq('id', otParaRepararId);

      if (otErr) throw otErr;

      // 3. Devolver máquina al estado "operativa"
      const ot = ots.find(o => o.id === otParaRepararId);
      const rep = reportes.find(r => r.id === ot.reporte_id);
      if (rep) {
        await sb.from('maquinas').update({ estado: 'operativa' }).eq('id', rep.maquina_id);
      }
      showMsg('success', 'Reparación guardada y OT archivada correctamente');
    } else {
      showMsg('success', 'Reparación guardada correctamente (sin OT)');
    }
    
    // Resetear formulario
    document.getElementById('rep-taller').value = '';
    document.getElementById('rep-trabajos').value = '';
    document.getElementById('rep-repuestos').value = '';
    cancelarReparacion();

    // Recargar datos
    await cargarTodo();

  } catch (err) {
    console.error('Error al guardar reparación:', err);
    showMsg('error', 'Error al guardar la reparación.');
  }
}

// --- PESTAÑA OT ---
function renderListaOTs() {
  const maqId = document.getElementById('fil-ot-select').value;
  const estado = document.getElementById('fil-ot-estado').value;
  const container = document.getElementById('lista-ots-general');

  let filtradas = [...ots];

  // Filtro estado
  if (estado !== 'todos') {
    filtradas = filtradas.filter(o => o.estado === estado);
  }

  // Filtro maquina
  if (maqId !== 'todas') {
    const repIds = reportes.filter(r => r.maquina_id === maqId).map(r => r.id);
    filtradas = filtradas.filter(o => repIds.includes(o.reporte_id));
  }

  if (filtradas.length === 0) {
    container.innerHTML = '<div class="loader">No se encontraron Órdenes de Trabajo con los filtros seleccionados.</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Nº OT</th>
            <th>Máquina</th>
            <th>Tipo</th>
            <th>Fecha Apertura</th>
            <th>Detalle Reporte</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${filtradas.map(o => {
            const rep = reportes.find(r => r.id === o.reporte_id);
            const tipoIcon = rep ? {
              falla: '🔧 Falla',
              service: '⏰ Service',
              engrase: '🛢 Engrase',
              neumatico: '🛞 Neumáticos',
              accesorio: '🪟 Accesorios'
            }[rep.tipo] : 'S/D';
            
            const badgeClass = o.estado === 'abierta' ? 'background:var(--redl);color:var(--red)' : 'background:var(--grnl);color:var(--grn)';
            return `
              <tr>
                <td><strong>${o.numero}</strong></td>
                <td>${rep ? rep.maquina_id : 'S/D'}</td>
                <td>${tipoIcon}</td>
                <td>${o.fecha_apertura}</td>
                <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis">${rep ? rep.descripcion : 'S/D'}</td>
                <td><span class="maq-tag" style="${badgeClass}">${o.estado.toUpperCase()}</span></td>
                <td><button class="bo" style="padding:5px 10px;font-size:12px" onclick="eliminarOT('${o.id}')"><i class="ti ti-trash"></i> Eliminar</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// --- PESTAÑA MAQUINISTAS ---
function renderMaquinistas() {
  const grid = document.getElementById('maquinistas-grid');
  if (maquinistas.length === 0) {
    grid.innerHTML = '<div class="loader">No hay maquinistas registrados.</div>';
    return;
  }

  grid.innerHTML = maquinistas.map(m => {
    const maqHabList = m.maquinas_habilitadas && m.maquinas_habilitadas.length > 0 
      ? m.maquinas_habilitadas.map(id => {
          const maq = maquinas.find(x => x.id === id);
          return `<span class="maq-tag">${maq ? maq.nombre : id}</span>`;
        }).join(' ')
      : '<span style="font-size:11px; color:#888">Ninguna habilitada</span>';

    return `
      <div class="maquinista-card">
        <h4><i class="ti ti-user"></i> ${m.nombre}</h4>
        <div class="maq-data-row">
          <span>Teléfono:</span>
          <strong>${m.telefono || 'Sin especificar'}</strong>
        </div>
        <div class="maq-data-row">
          <span>Carnet de Conducir:</span>
          <strong>Cat. ${m.categoria_carnet || 'S/D'}</strong>
        </div>
        <div class="maq-data-row">
          <span>Vencimiento Carnet:</span>
          <strong style="${isVencido(m.vencimiento_carnet) ? 'color:var(--red)' : ''}">${m.vencimiento_carnet || 'S/D'}</strong>
        </div>
        <div style="margin-top:6px">
          <span style="font-size:12px; font-weight:700; color:var(--dark)">Máquinas Habilitadas:</span>
          <div class="maq-badge-grid" style="margin-top:4px">
            ${maqHabList}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function isVencido(fechaStr) {
  if (!fechaStr) return false;
  const hoy = new Date();
  const f = new Date(fechaStr);
  return f < hoy;
}

// --- PESTAÑA UBICACIÓN MÁQUINAS ---
function renderUbicacion() {
  const grid = document.getElementById('ubicacion-grid');
  if (!grid) return;

  if (maquinas.length === 0) {
    grid.innerHTML = '<div class="loader">No hay máquinas registradas.</div>';
    return;
  }

  if (!OBRAS || OBRAS.length === 0) {
    grid.innerHTML = '<div class="loader">No hay obras configuradas. Andá a Configuración y guardá el listado de obras.</div>';
    return;
  }

  const grupos = {};
  OBRAS.forEach(o => { grupos[o] = []; });
  maquinas.forEach(m => {
    const u = (m.ubicacion || 'OTROS');
    if (!grupos[u]) grupos[u] = [];
    grupos[u].push(m);
  });

  grid.innerHTML = OBRAS.map(obra => {
    const lista = grupos[obra] || [];
    if (lista.length === 0) return '';
    return `
      <div class="obra-card">
        <div class="obra-card-header">
          <i class="ti ti-map-pin"></i>
          <strong>${obra}</strong>
          <span class="count">${lista.length} máquina${lista.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="obra-maq-grid">
          ${lista.map(m => `
            <div class="obra-maq-chip">
              <div class="maq-top">
                <div>
                  <div class="maq-id">${codigoCorto(m.id)}</div>
                  <div class="maq-nombre">${m.nombre || '-'}</div>
                </div>
              </div>
              <div class="maq-meta">${m.modelo || '-'} · ${m.horometro_actual != null ? m.horometro_actual + ' hs' : '-'} · ${(m.estado || '').toUpperCase()}</div>
              <select onchange="cambiarUbicacionMaquina('${(m.id || '').replace(/'/g, "\\'")}', this.value)">
                ${OBRAS.map(o => `<option value="${o}" ${o === (m.ubicacion || 'OTROS') ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function cambiarUbicacionMaquina(id, obra) {
  try {
    const { error } = await sb.from('maquinas')
      .update({ ubicacion: obra })
      .eq('id', id);

    if (error) throw error;
    showMsg('success', `Ubicación de ${id} actualizada a ${obra}`);
    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al cambiar la ubicación.');
  }
}

// --- PESTAÑA HISTORIAL ---
function renderHistorial() {
  const tabla = document.getElementById('historial-tabla');
  const filMaq = document.getElementById('fil-hist-maq');
  const filTxt = document.getElementById('fil-hist-text');
  if (!tabla) return;

  if (filMaq && filMaq.options.length === 0) {
    filMaq.innerHTML = '<option value="">Todas las máquinas</option>' +
      maquinas.map(m => `<option value="${m.id}">${m.id} — ${m.nombre}</option>`).join('');
  }

  const maqFil = filMaq ? filMaq.value : '';
  const txtFil = filTxt ? filTxt.value.toLowerCase().trim() : '';

  let data = [...historial].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  if (maqFil) data = data.filter(r => r.maquina_id === maqFil);
  if (txtFil) data = data.filter(r =>
    (r.descripcion || '').toLowerCase().includes(txtFil) ||
    (r.taller || '').toLowerCase().includes(txtFil) ||
    (r.repuestos || '').toLowerCase().includes(txtFil)
  );

  if (data.length === 0) {
    tabla.innerHTML = '<p style="text-align:center;color:#888;padding:30px;font-size:14px"><i class="ti ti-mood-empty" style="font-size:28px;display:block;margin-bottom:8px"></i>No hay registros de mantenimiento</p>';
    return;
  }

  const tipoIcon = { falla: '🔴', service: '🔧', engrase: '🟡', neumatico: '⚫', accesorio: '🔵', trabajo: '🟠' };
  const tipoLabel = { falla: 'Falla', service: 'Service', engrase: 'Engrase', neumatico: 'Neumáticos', accesorio: 'Accesorio', trabajo: 'Trabajo' };

  tabla.innerHTML = `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Máquina</th>
            <th>Tipo</th>
            <th>Descripción / Tarea</th>
            <th>Taller</th>
            <th>Repuestos</th>
            <th>Horómetro</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(r => {
            const maq = maquinas.find(m => m.id === r.maquina_id);
            const maqNom = maq ? `<strong>${codigoCorto(maq.id)}</strong><br><span style="font-size:11px;color:#666">${maq.nombre}</span>` : (codigoCorto(r.maquina_id) || '-');
            const ico = tipoIcon[r.tipo] || '📋';
            const lbl = tipoLabel[r.tipo] || r.tipo;
            const desc = (r.descripcion || '-').length > 120 ? (r.descripcion || '-').substring(0, 120) + '…' : (r.descripcion || '-');
            const taller = (r.taller || '-').length > 80 ? (r.taller || '-').substring(0, 80) + '…' : (r.taller || '-');
            const repuestos = (r.repuestos || '-').length > 80 ? (r.repuestos || '-').substring(0, 80) + '…' : (r.repuestos || '-');
            return `<tr>
              <td style="white-space:nowrap;font-weight:600">${r.fecha || '-'}</td>
              <td>${maqNom}</td>
              <td><span style="white-space:nowrap">${ico} ${lbl}</span></td>
              <td style="font-size:13px">${desc}</td>
              <td style="font-size:13px">${taller}</td>
              <td style="font-size:13px">${repuestos}</td>
              <td style="text-align:right;white-space:nowrap">${r.horometro != null ? r.horometro + ' hs' : '-'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p style="font-size:12px;color:#999;margin-top:8px;text-align:right">${data.length} registro${data.length !== 1 ? 's' : ''}</p>`;
}

async function importarHistorialExcel() {
  const fileInput = document.getElementById('historial-excel-file');
  const status = document.getElementById('historial-import-status');

  if (!fileInput || fileInput.files.length === 0) {
    alert('Seleccioná un archivo Excel (.xlsx/.xls) con el historial.');
    return;
  }

  status.innerText = 'Procesando archivo...';
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      let insertados = 0;

      for (const row of json) {
        const maquinaRaw = row['Máquina'] || row['Maquina'] || row['Máquina ID'] || row['ID'] || row['Codigo'] || '';
        const maq = maquinas.find(m => (m.id || '').toUpperCase() === String(maquinaRaw).trim().toUpperCase() || (m.nombre || '').toUpperCase() === String(maquinaRaw).trim().toUpperCase());
        const maquina_id = maq ? maq.id : String(maquinaRaw).trim().toUpperCase();
        const maquina_nombre = String(maquinaRaw).trim();

        const fechaRaw = row['Fecha'];
        let fecha = '';
        if (fechaRaw) {
          if (fechaRaw instanceof Date) {
            fecha = fechaRaw.toISOString().split('T')[0];
          } else {
            const d = new Date(fechaRaw);
            if (!isNaN(d.getTime())) fecha = d.toISOString().split('T')[0];
          }
        }

        const descripcion = String(row['Descripción'] || row['Descripcion'] || row['Trabajo'] || row['Novedad'] || '').trim();
        const taller = String(row['Taller'] || '').trim();
        const repuestos = String(row['Repuestos'] || '').trim();
        const tipo = String(row['Tipo'] || '').trim();
        const horometroRaw = row['Horómetro'] || row['Horas'] || row['Horometro'] || null;
        const horometro = horometroRaw != null ? parseFloat(horometroRaw) : null;

        if (!maquina_id) continue;

        if (!maq && maquina_id) {
          const { error: maqErr } = await sb.from('maquinas').upsert([{
            id: maquina_id,
            nombre: maquina_nombre || maquina_id,
            modelo: '',
            horometro_actual: horometro || 0,
            estado: 'operativa',
            ubicacion: 'OTROS'
          }]);
          if (maqErr) console.error('Error creando máquina desde historial:', maqErr);
        }

        const { error } = await sb.from('historial_maquinas').insert([{
          maquina_id,
          fecha: fecha || null,
          tipo: tipo || 'trabajo',
          descripcion,
          taller,
          repuestos,
          horometro
        }]);

        if (!error) insertados++;
      }

      status.innerText = `Importados ${insertados} registros de historial.`;
      fileInput.value = '';
      await cargarTodo();
    } catch (err) {
      console.error(err);
      status.innerText = 'Error al procesar el Excel. Verifica el formato.';
    }
  };

  reader.readAsArrayBuffer(file);
}

// --- PESTAÑA DASHBOARD ---
function renderDashboard() {
  // 1. KPIs
  const operativas = maquinas.filter(m => m.estado === 'operativa').length;
  const enReparacion = maquinas.filter(m => m.estado === 'reparacion').length;
  
  // Calcular servicios próximos activos
  let proximosServicesCont = 0;

  // Listar alertas
  const alertas = [];

  // Analizar máquinas por servicios próximos y vencimientos de carnet
  serviciosProximos.forEach(s => {
    const maq = maquinas.find(m => m.id === s.maquina_id);
    if (!maq) return;

    if (s.por_hs) {
      const restanHs = s.proximo_hs - maq.horometro_actual;
      if (restanHs <= 0) {
        alertas.push({
          nivel: 'danger',
          msj: `🔴 <strong>${s.tipo.toUpperCase()} VENCIDO:</strong> La máquina ${maq.id} (${maq.nombre}) superó las horas límite (${s.proximo_hs} hs actuales vs ${maq.horometro_actual} hs).`
        });
        proximosServicesCont++;
      } else if (restanHs <= (s.tipo === 'engrase' ? 20 : 50)) {
        alertas.push({
          nivel: 'warning',
          msj: `🟡 <strong>${s.tipo.toUpperCase()} PRÓXIMO:</strong> La máquina ${maq.id} (${maq.nombre}) requiere service en ${restanHs.toFixed(1)} hs.`
        });
        proximosServicesCont++;
      }
    } else {
      // Por fecha
      const hoy = new Date();
      const f = new Date(s.proxima_fecha);
      const restanDias = Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
      
      if (restanDias <= 0) {
        alertas.push({
          nivel: 'danger',
          msj: `🔴 <strong>${s.tipo.toUpperCase()} VENCIDO:</strong> El mantenimiento por fecha de ${maq.id} venció el ${s.proxima_fecha}.`
        });
        proximosServicesCont++;
      } else if (restanDias <= (s.tipo === 'engrase' ? 7 : 15)) {
        alertas.push({
          nivel: 'warning',
          msj: `🟡 <strong>${s.tipo.toUpperCase()} PRÓXIMO:</strong> Vence el mantenimiento programado de ${maq.id} en ${restanDias} días.`
        });
        proximosServicesCont++;
      }
    }
  });

  // Alertas de vencimiento de carnet de maquinista
  maquinistas.forEach(m => {
    if (m.vencimiento_carnet) {
      const hoy = new Date();
      const f = new Date(m.vencimiento_carnet);
      const restanDias = Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));

      if (restanDias <= 0) {
        alertas.push({
          nivel: 'danger',
          msj: `🔴 <strong>OPERADOR SIN LICENCIA:</strong> El carnet de conducir de ${m.nombre} está vencido.`
        });
      } else if (restanDias <= 30) {
        alertas.push({
          nivel: 'warning',
          msj: `🟡 <strong>LICENCIA PRÓXIMA A VENCER:</strong> El carnet de conducir de ${m.nombre} vence en ${restanDias} días.`
        });
      }
    }
  });

  // Renderizar KPIs
  document.getElementById('kpi-operativas').innerText = operativas;
  document.getElementById('kpi-reparacion').innerText = enReparacion;
  document.getElementById('kpi-servicios').innerText = proximosServicesCont;

  // Renderizar Alertas
  const alertsContainer = document.getElementById('dashboard-alerts');
  if (alertas.length === 0) {
    alertsContainer.innerHTML = '<div style="font-size:13px; color:#555">✅ No hay alertas críticas de mantenimiento ni personal en este momento.</div>';
  } else {
    alertsContainer.innerHTML = alertas.map(a => `
      <div class="alert-item ${a.nivel}">
        <span>${a.msj}</span>
      </div>
    `).join('');
  }

  // 2. Ranking de fallas por máquina
  // Agrupar fallas por maquina_id
  const fallaConteo = {};
  reportes.filter(r => r.tipo === 'falla').forEach(r => {
    fallaConteo[r.maquina_id] = (fallaConteo[r.maquina_id] || 0) + 1;
  });

  const maquinasRankeadas = Object.entries(fallaConteo).sort((a, b) => b[1] - a[1]);

  const rankingContainer = document.getElementById('dashboard-ranking');
  if (maquinasRankeadas.length === 0) {
    rankingContainer.innerHTML = '<span style="font-size:13px; color:#888">No se han registrado fallas técnicas todavía.</span>';
  } else {
    rankingContainer.innerHTML = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Máquina ID</th>
              <th>Cantidad de Fallas</th>
              <th>Porcentaje del Total</th>
            </tr>
          </thead>
          <tbody>
            ${maquinasRankeadas.map(([maqId, cant]) => {
              const pct = ((cant / reportes.filter(r => r.tipo === 'falla').length) * 100).toFixed(1);
              return `
                <tr>
                  <td><strong>${maqId}</strong></td>
                  <td>${cant}</td>
                  <td>${pct}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. Obras (máquinas por obra)
  renderObrasDashboard();
}

// --- DASHBOARD: OBRAS (máquinas por obra) ---
function renderObrasDashboard() {
  const cont = document.getElementById('dashboard-obras');
  if (!cont) return;
  if (!OBRAS || OBRAS.length === 0) { cont.innerHTML = ''; return; }

  // Normaliza el legado 'OTROS' al bucket 'OTRAS'
  const normUbi = u => ((u || 'OTROS').toUpperCase() === 'OTROS') ? 'OTRAS' : (u || 'OTRAS');

  const grupos = {};
  OBRAS.forEach(o => grupos[o] = []);
  maquinas.forEach(m => {
    const u = normUbi(m.ubicacion);
    if (!grupos[u]) grupos[u] = [];
    grupos[u].push(m);
  });

  cont.innerHTML = `<div class="obras-grid">
    ${OBRAS.map(obra => {
      const lista = grupos[obra] || [];
      const disponibles = maquinas.filter(m => normUbi(m.ubicacion) !== obra);
      const sid = 'add_' + obra.replace(/[^a-zA-Z0-9]/g, '_');
      return `
        <div class="obra-dash-card">
          <div class="obra-dash-head" onclick="toggleObraCard(this)">
            <div class="obra-dash-name"><i class="ti ti-building"></i> ${obra}</div>
            <span class="obra-dash-count">${lista.length}</span>
          </div>
          <div class="obra-dash-body">
            ${lista.length === 0
              ? '<div class="obra-dash-empty">Sin máquinas asignadas</div>'
              : lista.map(m => `
                <div class="obra-dash-item">
                  <div>
                    <div class="obra-dash-id">${codigoCorto(m.id)}</div>
                    <div class="obra-dash-nom">${m.nombre || '-'}</div>
                  </div>
                  <button class="obra-dash-remove" title="Sacar de ${obra}" onclick="cambiarUbicacionMaquina('${(m.id || '').replace(/'/g, "\\'")}', 'OTRAS')"><i class="ti ti-x"></i></button>
                </div>`).join('')}
            <div class="obra-dash-add">
              <select id="${sid}">
                <option value="">Agregar máquina…</option>
                ${disponibles.map(m => `<option value="${m.id}">${codigoCorto(m.id)} — ${m.nombre || ''}</option>`).join('')}
              </select>
              <button class="bp" onclick="agregarAMaquinaObra('${sid}', '${(obra || '').replace(/'/g, "\\'")}')"><i class="ti ti-plus"></i></button>
            </div>
          </div>
        </div>`;
    }).join('')}
  </div>`;
}

function agregarAMaquinaObra(selId, obra) {
  const sel = document.getElementById(selId);
  if (!sel || !sel.value) { showMsg('error', 'Seleccioná una máquina para agregar a ' + obra); return; }
  cambiarUbicacionMaquina(sel.value, obra);
}

function toggleObraCard(head) {
  const card = head.closest('.obra-dash-card');
  if (card) card.classList.toggle('collapsed');
}

// --- CONFIGURACIÓN Y ADMINISTRACIÓN ---
function renderConfigListas() {
  const maqList = document.getElementById('config-lista-maquinas');
  const operList = document.getElementById('config-lista-maquinistas');

  // Render lista maquinas
  if (maqList) {
    if (maquinas.length === 0) {
      maqList.innerHTML = '<span style="font-size:12px; color:#888">No hay máquinas registradas.</span>';
    } else {
      maqList.innerHTML = `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Modelo</th>
                <th>Horómetro</th>
                <th>Estado</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${maquinas.map(m => `
                <tr>
                  <td><strong>${codigoCorto(m.id)}</strong></td>
                  <td>${m.nombre}</td>
                  <td>${m.modelo}</td>
                  <td>${m.horometro_actual} hs</td>
                  <td>${m.estado.toUpperCase()}</td>
                  <td>${m.ubicacion || 'OTROS'}</td>
                  <td>
                    <button class="bo" style="padding:4px 8px; display:inline-flex" onclick="openEditMaquina('${m.id}')"><i class="ti ti-edit"></i></button>
                    <button class="bo" style="padding:4px 8px; display:inline-flex; color:var(--red); border-color:var(--redl)" onclick="deleteMaquina('${m.id}')"><i class="ti ti-trash"></i></button>
                    <button class="bo" style="padding:4px 8px; display:inline-flex" onclick="generateQR('${m.id}')"><i class="ti ti-qrcode"></i> QR</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Render lista maquinistas
  if (operList) {
    if (maquinistas.length === 0) {
      operList.innerHTML = '<span style="font-size:12px; color:#888">No hay maquinistas registrados.</span>';
    } else {
      operList.innerHTML = `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Carnet</th>
                <th>Vencimiento</th>
                <th>Obra</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${maquinistas.map(m => `
                <tr>
                  <td><strong>${m.nombre}</strong></td>
                  <td>${m.telefono || '-'}</td>
                  <td>Cat. ${m.categoria_carnet || '-'}</td>
                  <td>${m.vencimiento_carnet || '-'}</td>
                  <td>${m.obra_asignada || '-'}</td>
                  <td>
                    <button class="bo" style="padding:4px 8px; display:inline-flex" onclick="openEditMaquinista('${m.id}')"><i class="ti ti-edit"></i></button>
                    <button class="bo" style="padding:4px 8px; display:inline-flex; color:var(--red); border-color:var(--redl)" onclick="deleteMaquinista('${m.id}')"><i class="ti ti-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}

// CRUD Máquinas
async function addMaquina() {
  const id = document.getElementById('nc-maq-id').value.trim().toUpperCase();
  const nom = document.getElementById('nc-maq-nom').value.trim();
  const mod = document.getElementById('nc-maq-mod').value.trim();
  const hs = parseFloat(document.getElementById('nc-maq-hs').value) || 0;

  if (!id || !nom) {
    alert('Código y Nombre de la máquina son obligatorios.');
    return;
  }

  try {
    const { error } = await sb.from('maquinas').upsert([{
      id: id,
      nombre: nom,
      modelo: mod,
      horometro_actual: hs,
      estado: 'operativa',
      ubicacion: 'OTROS'
    }]);

    if (error) throw error;

    showMsg('success', 'Máquina guardada correctamente');
    document.getElementById('nc-maq-id').value = '';
    document.getElementById('nc-maq-nom').value = '';
    document.getElementById('nc-maq-mod').value = '';
    document.getElementById('nc-maq-hs').value = '';
    
    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al guardar la máquina.');
  }
}

async function deleteMaquina(id) {
  if (!confirm(`¿Está seguro de eliminar la máquina ${id}? Se perderán sus reportes asociados.`)) return;

  try {
    const { error } = await sb.from('maquinas').delete().eq('id', id);
    if (error) throw error;
    showMsg('success', 'Máquina eliminada');
    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al eliminar máquina.');
  }
}

// CRUD Maquinistas
async function addMaquinista() {
  const nom = document.getElementById('nc-oper-nom').value.trim();
  const tel = document.getElementById('nc-oper-tel').value.trim();
  const cat = document.getElementById('nc-oper-cat').value.trim();
  const venc = document.getElementById('nc-oper-venc').value;
  const obra = document.getElementById('nc-oper-obra').value.trim();
  const selectHabil = document.getElementById('nc-oper-habilitadas');
  
  const maqHabil = Array.from(selectHabil.selectedOptions).map(opt => opt.value);

  if (!nom) {
    alert('El nombre es obligatorio.');
    return;
  }

  try {
    const { error } = await sb.from('maquinistas').insert([{
      nombre: nom,
      telefono: tel,
      categoria_carnet: cat,
      vencimiento_carnet: venc ? venc : null,
      obra_asignada: obra,
      maquinas_habilitadas: maqHabil
    }]);

    if (error) throw error;

    showMsg('success', 'Maquinista registrado con éxito');
    document.getElementById('nc-oper-nom').value = '';
    document.getElementById('nc-oper-tel').value = '';
    document.getElementById('nc-oper-cat').value = '';
    document.getElementById('nc-oper-venc').value = '';
    document.getElementById('nc-oper-obra').value = '';
    selectHabil.selectedIndex = -1;

    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al registrar maquinista.');
  }
}

async function deleteMaquinista(id) {
  if (!confirm('¿Seguro que desea eliminar a este maquinista?')) return;
  try {
    const { error } = await sb.from('maquinistas').delete().eq('id', id);
    if (error) throw error;
    showMsg('success', 'Maquinista eliminado');
    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al eliminar maquinista.');
  }
}

// MODAL EDICIÓN RÁPIDA DE MÁQUINA
function openEditMaquina(id) {
  const maq = maquinas.find(m => m.id === id);
  if (!maq) return;
  
  editingMaquinaId = id;
  editingType = 'maquina';
  document.getElementById('edit-modal-title').innerText = 'Editar datos de la máquina';
  document.getElementById('edit-form-container').innerHTML = `
    <div class="field">
      <label>Nombre</label>
      <input type="text" id="edit-nom" value="${maq.nombre}">
    </div>
    <div class="field">
      <label>Modelo</label>
      <input type="text" id="edit-mod" value="${maq.modelo || ''}">
    </div>
    <div class="field">
      <label>Horómetro (hs)</label>
      <input type="number" id="edit-hs" value="${maq.horometro_actual}">
    </div>
    <div class="field">
      <label>Estado</label>
      <select id="edit-est">
        <option value="operativa" ${maq.estado === 'operativa' ? 'selected' : ''}>Operativa</option>
        <option value="reparacion" ${maq.estado === 'reparacion' ? 'selected' : ''}>En Reparación</option>
        <option value="baja" ${maq.estado === 'baja' ? 'selected' : ''}>Baja</option>
      </select>
    </div>
    <div class="field">
      <label>Ubicación</label>
      <select id="edit-ubicacion">
        ${OBRAS.map(o => `<option value="${o}" ${o === (maq.ubicacion || 'OTROS') ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>
  `;
  document.getElementById('edit-modal').style.display = 'flex';
}

function openEditMaquinista(id) {
  const op = maquinistas.find(m => m.id === id);
  if (!op) return;
  
  editingMaquinistaId = id;
  editingType = 'maquinista';
  document.getElementById('edit-modal-title').innerText = 'Editar datos del maquinista';
  document.getElementById('edit-form-container').innerHTML = `
    <div class="field">
      <label>Nombre</label>
      <input type="text" id="edit-nom" value="${op.nombre || ''}">
    </div>
    <div class="field">
      <label>Teléfono</label>
      <input type="text" id="edit-tel" value="${op.telefono || ''}">
    </div>
    <div class="field">
      <label>Categoría de Carnet</label>
      <input type="text" id="edit-cat" value="${op.categoria_carnet || ''}">
    </div>
    <div class="field">
      <label>Vencimiento de Carnet</label>
      <input type="date" id="edit-venc" value="${op.vencimiento_carnet || ''}">
    </div>
    <div class="field">
      <label>Obra asignada</label>
      <input type="text" id="edit-obra" value="${op.obra_asignada || ''}">
    </div>
  `;
  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEdit() {
  document.getElementById('edit-modal').style.display = 'none';
  editingMaquinaId = null;
  editingMaquinistaId = null;
  editingType = null;
}

async function saveEditMaquina() {
  const nom = document.getElementById('edit-nom').value.trim();
  const mod = document.getElementById('edit-mod').value.trim();
  const hs = parseFloat(document.getElementById('edit-hs').value) || 0;
  const est = document.getElementById('edit-est').value;
  const ubic = document.getElementById('edit-ubicacion').value;

  try {
    const { error } = await sb.from('maquinas')
      .update({ nombre: nom, modelo: mod, horometro_actual: hs, estado: est, ubicacion: ubic })
      .eq('id', editingMaquinaId);

    if (error) throw error;
    showMsg('success', 'Máquina editada correctamente');
    closeEdit();
    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al editar máquina.');
  }
}

async function saveEditMaquinista() {
  const nom = document.getElementById('edit-nom').value.trim();
  const tel = document.getElementById('edit-tel').value.trim();
  const cat = document.getElementById('edit-cat').value.trim();
  const venc = document.getElementById('edit-venc').value.trim();
  const obra = document.getElementById('edit-obra').value.trim();

  try {
    const { error } = await sb.from('maquinistas')
      .update({
        nombre: nom,
        telefono: tel,
        categoria_carnet: cat,
        vencimiento_carnet: venc,
        obra_asignada: obra
      })
      .eq('id', editingMaquinistaId);

    if (error) throw error;
    showMsg('success', 'Maquinista editado correctamente');
    closeEdit();
    await cargarTodo();
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al editar maquinista.');
  }
}

function saveEditCurrent() {
  if (editingType === 'maquina') {
    saveEditMaquina();
  } else if (editingType === 'maquinista') {
    saveEditMaquinista();
  } else {
    closeEdit();
  }
}

// SUBIR PÓLIZA DE SEGURO (.PDF)
async function subirSeguroAdmin(input) {
  const status = document.getElementById('seguro-admin-status');
  if (input.files.length === 0) return;

  status.innerText = 'Subiendo póliza...';
  const file = input.files[0];
  const fileName = `poliza_seguro_${Date.now()}.pdf`;

  try {
    const base64 = await fileToBase64(file);

    const viejasPolizas = documentos.filter(d => d.tipo === 'poliza');
    for (let p of viejasPolizas) {
      await sb.from('documentos').delete().eq('id', p.id);
    }

    const { error: dbErr } = await sb.from('documentos').insert([{
      nombre: 'Póliza General de Flota',
      tipo: 'poliza',
      archivo_url: null,
      archivo_base64: base64
    }]);

    if (dbErr) throw dbErr;

    status.innerText = 'Póliza subida correctamente.';
    await cargarTodo();
  } catch (err) {
    console.error(err);
    status.innerText = 'Error al subir la póliza: ' + (err.message || err);
  }
}

// SUBIR MANUALES DE USO (.PDF)
async function subirManualAdmin(input) {
  const status = document.getElementById('manual-admin-status');
  const nom = document.getElementById('nc-manual-nom').value.trim();
  
  if (!nom) {
    alert('Ingrese un nombre descriptivo para el manual antes de subir el archivo.');
    input.value = '';
    return;
  }
  if (input.files.length === 0) return;

  status.innerText = 'Subiendo manual...';
  const file = input.files[0];

  try {
    const base64 = await fileToBase64(file);

    const { error: dbErr } = await sb.from('documentos').insert([{
      nombre: nom,
      tipo: 'manual',
      archivo_url: null,
      archivo_base64: base64
    }]);

    if (dbErr) throw dbErr;

    status.innerText = 'Manual subido correctamente.';
    document.getElementById('nc-manual-nom').value = '';
    input.value = '';
    await cargarTodo();

  } catch (err) {
    console.error(err);
    status.innerText = 'Error al subir el manual: ' + (err.message || err);
  }
}

// --- GENERACIÓN DE QR POR MÁQUINA ---
function generateQR(maqId) {
  const url = `${window.location.origin}${window.location.pathname}?maq=${maqId}`;
  document.getElementById('qr-cam-id').innerText = `Código Máquina: ${maqId}`;
  
  const canvasDiv = document.getElementById('qr-canvas');
  canvasDiv.innerHTML = '';
  
  QRCode.toCanvas(url, { width: 200, margin: 2 }, function (err, canvas) {
    if (err) console.error(err);
    canvasDiv.appendChild(canvas);
    document.getElementById('qr-modal').style.display = 'flex';
  });
}

function closeQR() {
  document.getElementById('qr-modal').style.display = 'none';
}

function printQR() {
  const canvas = document.querySelector('#qr-canvas canvas');
  if (!canvas) return;

  const urlData = canvas.toDataURL();
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Imprimir Código QR</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; }
          .qr-img { width: 250px; height: 250px; }
          h2 { color: #333; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Monteverdi Maquinarias</h1>
        <img src="${urlData}" class="qr-img">
        <h2>${document.getElementById('qr-cam-id').innerText}</h2>
        <p>Escanear este código para reportar una falla o service</p>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// --- EXPORTAR INFORME EXCEL COMPLETO ---
function exportarExcel() {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Resumen de Flota (Máquinas)
    const dataMaq = maquinas.map(m => ({
      'Código Máquina': m.id,
      'Nombre': m.nombre,
      'Modelo': m.modelo,
      'Horas Actuales': m.horometro_actual,
      'Estado': m.estado.toUpperCase()
    }));
    const wsMaq = XLSX.utils.json_to_sheet(dataMaq);
    XLSX.utils.book_append_sheet(wb, wsMaq, 'Resumen Máquinas');

    // 2. Historial de Reportes / Novedades
    const dataRep = reportes.map(r => {
      const maq = maquinas.find(m => m.id === r.maquina_id);
      const oper = maquinistas.find(o => o.id === r.maquinista_id);
      return {
        'Fecha': r.fecha,
        'Máquina ID': r.maquina_id,
        'Máquina': maq ? maq.nombre : 'S/D',
        'Operador': oper ? oper.nombre : 'S/D',
        'Tipo': r.tipo.toUpperCase(),
        'Horas': r.horometro,
        'Prioridad': r.prioridad.toUpperCase(),
        'Descripción': r.descripcion
      };
    });
    const wsRep = XLSX.utils.json_to_sheet(dataRep);
    XLSX.utils.book_append_sheet(wb, wsRep, 'Historial Reportes');

    // 3. Órdenes de Trabajo (OT)
    const dataOt = ots.map(o => {
      const rep = reportes.find(r => r.id === o.reporte_id);
      return {
        'Nº OT': o.numero,
        'Máquina ID': rep ? rep.maquina_id : 'S/D',
        'Fecha Apertura': o.fecha_apertura,
        'Fecha Cierre': o.fecha_cierre || 'Pendiente',
        'Estado': o.estado.toUpperCase(),
        'Descripción Falla': rep ? rep.descripcion : 'S/D'
      };
    });
    const wsOt = XLSX.utils.json_to_sheet(dataOt);
    XLSX.utils.book_append_sheet(wb, wsOt, 'Órdenes de Trabajo');

    // 4. Maquinistas (Operadores)
    const dataOper = maquinistas.map(m => ({
      'Nombre': m.nombre,
      'Teléfono': m.telefono,
      'Categoría Carnet': m.categoria_carnet,
      'Vencimiento Carnet': m.vencimiento_carnet,
      'Obra Asignada': m.obra_asignada,
      'Máquinas Habilitadas': m.maquinas_habilitadas ? m.maquinas_habilitadas.join(', ') : ''
    }));
    const wsOper = XLSX.utils.json_to_sheet(dataOper);
    XLSX.utils.book_append_sheet(wb, wsOper, 'Maquinistas');

    // Escribir archivo Excel
    XLSX.writeFile(wb, `Reporte_MonteverdiMaquinarias_${new Date().toISOString().split('T')[0]}.xlsx`);
    showMsg('success', 'Excel exportado correctamente');
  } catch (err) {
    console.error(err);
    showMsg('error', 'Error al exportar a Excel');
  }
}

// IMPORTAR EXCEL (MÁQUINAS Y MAQUINISTAS)
async function importarExcel() {
  const fileInput = document.getElementById('import-excel-file');
  const statusDiv = document.getElementById('import-status');

  if (fileInput.files.length === 0) {
    alert('Por favor selecciona un archivo de Excel (.xlsx o .xls).');
    return;
  }

  statusDiv.innerText = 'Procesando archivo...';
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      let maquinasImportadas = 0;
      let maquinistasImportados = 0;
      let reportesImportados = 0;

      // 0. Procesar Control de Mantenimientos (nuevo formato)
      if (workbook.SheetNames.includes('INFO-SEG-SERVICE')) {
        for (const sheetName of workbook.SheetNames) {
          if (sheetName === 'INFO-SEG-SERVICE') continue;
          
          const parts = sheetName.split('-');
          let rawId = parts.length > 1 ? parts[parts.length - 1].trim() : sheetName.trim();
          
          let maquinaId = null;
          const searchId = rawId.replace(/\s+/g, '').toUpperCase();
          const maquinaMatch = maquinas.find(m => m.id.replace(/\s+/g, '').toUpperCase() === searchId);
          
          if (maquinaMatch) {
            maquinaId = maquinaMatch.id;
          } else {
            console.warn(`Máquina no encontrada para pestaña: ${sheetName}`);
            continue;
          }

          const sheet = workbook.Sheets[sheetName];
          const jsonArr = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
          
          let headerRowIdx = -1;
          for (let i = 0; i < jsonArr.length; i++) {
            if (jsonArr[i] && jsonArr[i].some(cell => typeof cell === 'string' && cell.trim().toUpperCase() === 'FECHA')) {
              headerRowIdx = i;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            for (let i = headerRowIdx + 1; i < jsonArr.length; i++) {
              const row = jsonArr[i];
              if (!row || row.length === 0 || (!row[0] && !row[3])) continue;

              let fecha = row[0] || '';
              const horasStr = row[1] || '';
              const tarea = row[3] || row[4] || row[2] || '';

              if (!tarea) continue;

              let horas = 0;
              if (horasStr) {
                horas = parseFloat(horasStr.toString().replace(',', '.')) || 0;
              }

              let fechaIso = new Date().toISOString().split('T')[0];
              if (typeof fecha === 'string' && fecha.trim() !== '') {
                const fParts = fecha.split(/[\/\-]/);
                if (fParts.length === 3) {
                  let yyyy = fParts[2];
                  let mm = fParts[1];
                  let dd = fParts[0];
                  if (yyyy.length === 2) yyyy = '20' + yyyy;
                  if (yyyy.length === 4) {
                    fechaIso = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
                  }
                }
              }

              const { data: repData, error: repErr } = await sb.from('reportes').insert([{
                fecha: fechaIso,
                maquina_id: maquinaId,
                tipo: 'service',
                horometro: horas,
                prioridad: 'baja',
                descripcion: tarea.toString(),
                estado: 'resuelto'
              }]).select();

              if (!repErr && repData && repData.length > 0) {
                await sb.from('ordenes_trabajo').insert([{
                  numero: `OT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                  reporte_id: repData[0].id,
                  fecha_apertura: fechaIso,
                  fecha_cierre: fechaIso,
                  estado: 'cerrada',
                  descripcion_falla: tarea.toString()
                }]);
                reportesImportados++;
              }
            }
          }
        }
        statusDiv.innerText = `Éxito: Se importaron ${reportesImportados} registros de mantenimiento.`;
        fileInput.value = '';
        await cargarTodo();
        return; // Salir de la función
      }

      // 1. Procesar pestaña 'Maquinas'
      if (workbook.SheetNames.includes('Maquinas')) {
        const sheet = workbook.Sheets['Maquinas'];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        for (const row of json) {
          const id = (row['Código Máquina'] || row['ID'] || row['Codigo'] || '').toString().trim().toUpperCase();
          const nombre = (row['Nombre'] || row['Nombre Máquina'] || '').toString().trim();
          const modelo = (row['Modelo'] || '').toString().trim();
          const horometro = parseFloat(row['Horómetro Actual'] || row['Horas Actuales'] || row['Horas'] || 0);

          if (id && nombre) {
            const { error } = await sb.from('maquinas').upsert([{
              id: id,
              nombre: nombre,
              modelo: modelo,
              horometro_actual: horometro,
              estado: 'operativa'
            }]);
            if (!error) maquinasImportadas++;
          }
        }
      }

      // 2. Procesar pestaña 'Maquinistas'
      if (workbook.SheetNames.includes('Maquinistas')) {
        const sheet = workbook.Sheets['Maquinistas'];
        const json = XLSX.utils.sheet_to_json(sheet);

        for (const row of json) {
          const nombre = (row['Nombre'] || row['Nombre Completo'] || '').toString().trim();
          const telefono = (row['Teléfono'] || row['Telefono'] || '').toString().trim();
          const cat = (row['Categoría Carnet'] || row['Categoria'] || '').toString().trim();
          const vencStr = row['Vencimiento Carnet'] || row['Vencimiento'] || null;
          const obra = (row['Obra Asignada'] || row['Obra'] || '').toString().trim();
          const maquinasHabilStr = (row['Máquinas Habilitadas'] || row['Maquinas'] || '').toString().trim();

          let vencimiento = null;
          if (vencStr) {
            // Intentar formatear la fecha correctamente
            const d = new Date(vencStr);
            if (!isNaN(d.getTime())) {
              vencimiento = d.toISOString().split('T')[0];
            }
          }

          let maquinasHabilitadas = [];
          if (maquinasHabilStr) {
            maquinasHabilitadas = maquinasHabilStr.split(',').map(m => m.trim().toUpperCase());
          }

          if (nombre) {
            // Verificar si el maquinista ya existe para evitar duplicar
            const { data: existData } = await sb.from('maquinistas').select('id').eq('nombre', nombre).limit(1);
            
            if (existData && existData.length > 0) {
              // Actualizar existente
              const { error } = await sb.from('maquinistas').update({
                telefono: telefono,
                categoria_carnet: cat,
                vencimiento_carnet: vencimiento,
                obra_asignada: obra,
                maquinas_habilitadas: maquinasHabilitadas
              }).eq('id', existData[0].id);
              if (!error) maquinistasImportados++;
            } else {
              // Insertar nuevo
              const { error } = await sb.from('maquinistas').insert([{
                nombre: nombre,
                telefono: telefono,
                categoria_carnet: cat,
                vencimiento_carnet: vencimiento,
                obra_asignada: obra,
                maquinas_habilitadas: maquinasHabilitadas
              }]);
              if (!error) maquinistasImportados++;
            }
          }
        }
      }

      statusDiv.innerText = `Éxito: Se importaron/actualizaron ${maquinasImportadas} máquinas y ${maquinistasImportados} maquinistas.`;
      fileInput.value = '';
      
      // Recargar datos e interfaces
      await cargarTodo();

    } catch (err) {
      console.error(err);
      statusDiv.innerText = 'Error al procesar el Excel. Verifica el formato.';
    }
  };

  reader.readAsArrayBuffer(file);
}

// Analizar si el usuario escaneó un código QR de máquina específico
// Ejemplo de URL: http://.../index.html?maq=EX-01
const urlParams = new URLSearchParams(window.location.search);
const qrMaqParam = urlParams.get('maq');
if (qrMaqParam) {
  setTimeout(() => {
    const selector = document.getElementById('r-maq');
    if (selector) {
      selector.value = qrMaqParam.toUpperCase();
      updateMaqHorometroLabel();
      showTab('reportar', document.querySelector('.tabs button:nth-child(2)'));
      showMsg('success', `Cargado reporte rápido para la máquina ${qrMaqParam}`);
    }
  }, 1500); // Dar un segundo a que carguen los datos de Supabase primero
}

function guardarObrasConfig() {
  const ta = document.getElementById('config-obras');
  const status = document.getElementById('obras-config-status');
  if (!ta) return;
  const texto = ta.value;
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l);
  if (lineas.length === 0) {
    status.innerText = 'Debe haber al menos una obra.';
    return;
  }
  try {
    localStorage.setItem('m3maq_obras', lineas.join('\n'));
    cargarObras();
    status.innerText = 'Obras guardadas correctamente.';
    renderUbicacion();
  } catch (e) {
    status.innerText = 'Error al guardar obras.';
  }
}

function resetObrasConfig() {
  const ta = document.getElementById('config-obras');
  const status = document.getElementById('obras-config-status');
  if (!ta) return;
  localStorage.removeItem('m3maq_obras');
  OBRAS.length = 0;
  OBRAS.push(...OBRAS_DEFAULT);
  ta.value = OBRAS.join('\n');
  status.innerText = 'Obras restablecidas.';
  renderUbicacion();
}

function cargarConfigObras() {
  const ta = document.getElementById('config-obras');
  if (!ta) return;
  cargarObras();
  if (OBRAS.length === 0) {
    OBRAS.push(...OBRAS_DEFAULT);
  }
  ta.value = OBRAS.join('\n');
}

