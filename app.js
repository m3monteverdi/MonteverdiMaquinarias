// =============================================
//  MONTEVERDI MAQUINARIAS — Logic Controller
// =============================================

const ADMIN_PASS = 'monteverdi';

// Variables globales de la app
let maquinas = [];
let maquinistas = [];
let reportes = [];
let ots = [];
let reparaciones = [];
let serviciosProximos = [];
let documentos = [];

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

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
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

    const [rMaq, rOp, rRep, rOt, rRepa, rSrv, rDocs] = await Promise.all([
      pMaquinas, pMaquinistas, pReportes, pOts, pReparaciones, pServicios, pDocs
    ]);

    maquinas = rMaq.data || [];
    maquinistas = rOp.data || [];
    reportes = rRep.data || [];
    ots = rOt.data || [];
    reparaciones = rRepa.data || [];
    serviciosProximos = rSrv.data || [];
    documentos = rDocs.data || [];

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
  renderDocumentos();
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
}

function askKeyMaquinistas(btn) {
  if (adminValidado) {
    showTab('maquinistas', btn);
    return;
  }
  const clave = prompt('Introduce la contraseña de configuración:');
  if (clave === ADMIN_PASS) {
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
  if (clave === ADMIN_PASS) {
    adminValidado = true;
    showTab('ot', btn);
    showMsg('success', 'Acceso de administrador concedido');
  } else if (clave !== null) {
    alert('Contraseña incorrecta');
  }
}

// Solicitar contraseña para Configuración
function askKey(btn) {
  if (adminValidado) {
    showTab('config', btn);
    return;
  }
  
  const clave = prompt('Introduce la contraseña de configuración:');
  if (clave === ADMIN_PASS) {
    adminValidado = true;
    showTab('config', btn);
    showMsg('success', 'Acceso de administrador concedido');
  } else if (clave !== null) {
    alert('Contraseña incorrecta');
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
  const urg = document.getElementById('r-urg').value;
  const fotoInput = document.getElementById('r-foto');

  if (!maqId || !operId || isNaN(hsVal) || !des) {
    alert('Por favor complete todos los campos obligatorios (*).');
    return;
  }

  try {
    // 1. Subir foto opcional
    let fotoUrl = null;
    if (fotoInput.files.length > 0) {
      const file = fotoInput.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: fileData, error: uploadErr } = await sb.storage
        .from('fotos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      
      if (uploadErr) throw uploadErr;
      
      const { data: publicUrlData } = sb.storage.from('fotos').getPublicUrl(fileName);
      fotoUrl = publicUrlData.publicUrl;
    }

    // 2. Insertar reporte
    const { data: repData, error: repErr } = await sb.from('reportes').insert([{
      maquina_id: maqId,
      maquinista_id: operId,
      tipo: tipoReporteSeleccionado,
      descripcion: des,
      horometro: hsVal,
      prioridad: urg,
      foto_url: fotoUrl,
      fecha: fec
    }]).select();

    if (repErr) throw repErr;
    const nuevoReporte = repData[0];

    // 3. Crear OT asociada automáticamente
    const numOT = `OT-${Date.now().toString().slice(-6)}`;
    const { data: otData, error: otErr } = await sb.from('ots').insert([{
      reporte_id: nuevoReporte.id,
      numero: numOT,
      estado: 'abierta',
      fecha_apertura: fec
    }]).select();

    if (otErr) throw otErr;

    // 4. Si es service o engrase, guardar parámetros de servicio próximo
    if (tipoReporteSeleccionado === 'service' || tipoReporteSeleccionado === 'engrase') {
      const modo = document.querySelector('input[name="srv-modo"]:checked').value;
      const servicioObj = {
        maquina_id: maqId,
        tipo: tipoReporteSeleccionado,
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

    // 5. Actualizar el horómetro de la máquina
    const { error: maqUpdateErr } = await sb.from('maquinas')
      .update({ horometro_actual: hsVal, estado: 'reparacion' }) // Se asume en reparación al tener OT abierta
      .eq('id', maqId);

    if (maqUpdateErr) throw maqUpdateErr;

    showMsg('success', `Reporte enviado con éxito. OT Generada: ${numOT}`);
    
    // Resetear formulario
    document.getElementById('r-des').value = '';
    document.getElementById('r-foto').value = '';
    qpBack();
    
    // Recargar datos
    await cargarTodo();

  } catch (err) {
    console.error('Error al guardar reporte:', err);
    showMsg('error', 'Error al guardar reporte en base de datos');
  }
}

// --- PESTAÑA REPARAR ---
let otParaRepararId = null;

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

function cancelarReparacion() {
  otParaRepararId = null;
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
    // 1. Crear registro en la tabla 'reparaciones'
    const { error: repaErr } = await sb.from('reparaciones').insert([{
      ot_id: otParaRepararId,
      taller: taller,
      trabajos: trabajos,
      repuestos: repuestos,
      fecha_entrega: fecha
    }]);

    if (repaErr) throw repaErr;

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
      ? m.maquinas_habilitadas.map(id => `<span class="maq-tag">${id}</span>`).join(' ') 
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
        <div class="maq-data-row">
          <span>Obra Asignada:</span>
          <strong>${m.obra_asignada || 'Sin asignar'}</strong>
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

// --- PESTAÑA DOCUMENTOS ---
function renderDocumentos() {
  const seguroContainer = document.getElementById('seguro-descarga-container');
  const manualesContainer = document.getElementById('manuales-container');

  // Filtrar Pólizas
  const polizas = documentos.filter(d => d.tipo === 'poliza');
  if (polizas.length === 0) {
    seguroContainer.innerHTML = '<span style="font-size:13px; color:#888">No hay póliza de seguro cargada.</span>';
  } else {
    seguroContainer.innerHTML = polizas.map(p => {
      const href = p.archivo_url || (p.archivo_base64 ? `data:application/pdf;base64,${p.archivo_base64}` : '#');
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--azl); padding:12px; border-radius:var(--radius-sm)">
          <div>
            <strong>${p.nombre}</strong><br>
            <span style="font-size:11px; color:#777">Subido: ${new Date(p.created_at).toLocaleDateString()}</span>
          </div>
          <a href="${href}" target="_blank" class="bo" style="background:#fff"><i class="ti ti-download"></i> Descargar PDF</a>
        </div>
      `;
    }).join('');
  }

  // Filtrar manuales
  const manuales = documentos.filter(d => d.tipo === 'manual');
  if (manuales.length === 0) {
    manualesContainer.innerHTML = '<span style="font-size:13px; color:#888">No hay manuales de uso cargados.</span>';
  } else {
    manualesContainer.innerHTML = manuales.map(m => {
      const href = m.archivo_url || (m.archivo_base64 ? `data:application/pdf;base64,${m.archivo_base64}` : '#');
      return `
        <div class="doc-card">
          <i class="ti ti-book" style="font-size:24px; color:var(--az)"></i>
          <strong>${m.nombre}</strong>
          <a href="${href}" target="_blank" class="bp" style="padding:6px; font-size:11px; margin-top:auto"><i class="ti ti-download"></i> Abrir Manual</a>
        </div>
      `;
    }).join('');
  }
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${maquinas.map(m => `
                <tr>
                  <td><strong>${m.id}</strong></td>
                  <td>${m.nombre}</td>
                  <td>${m.modelo}</td>
                  <td>${m.horometro_actual} hs</td>
                  <td>${m.estado.toUpperCase()}</td>
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
      estado: 'operativa'
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

  try {
    const { error } = await sb.from('maquinas')
      .update({ nombre: nom, modelo: mod, horometro_actual: hs, estado: est })
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

