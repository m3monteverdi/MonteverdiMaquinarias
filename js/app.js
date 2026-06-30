var SB_URL = 'https://gjxbyxpbuomyuqyrieuc.supabase.co';
var SB_KEY = 'sb_publishable_5wUycHhaBXqdTk2ktSKywg_3HuPBpV4';
var ADMIN_KEY = 'maquinarias';
var EMAIL_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';
var EMAIL_SERVICE_ID = 'service_mbi0sr9';
var EMAIL_TEMPLATE_ID = 'template_jqljo28';
var EMAIL_PUBLIC_KEY = 'RZLZQ0ckeCPRV-dVw';
var sb = supabase.createClient(SB_URL, SB_KEY);
var maquinarias = [], choferes = [], otCounter = 1, otsCache = [], adminOk = false;
var allReportes = [];
var tipoActual = '';
var detalleCamionId = null;
var isOnline = navigator.onLine;
var maquinariasOcultos = ['CARR', 'SEMI', '106', 'CARRETON', 'SEMIREMOLQUE'];
var flotaExpandida = false;
function maquinariaVisible(c) {
  return maquinariasOcultos.indexOf(c.id) < 0;
}

function getOfflineQueue() {
  try { var r = localStorage.getItem('m3v7_offline_queue'); if (r) return JSON.parse(r); } catch(e) {}
  return [];
}
function saveOfflineQueue(q) { try { localStorage.setItem('m3v7_offline_queue', JSON.stringify(q)); } catch(e) {} }
function addOfflineOp(op) {
  var q = getOfflineQueue();
  q.push(op);
  saveOfflineQueue(q);
  updateOnlineStatus();
}
async function processOfflineQueue() {
  if (!isOnline) return;
  var q = getOfflineQueue();
  if (!q.length) return;
  var remaining = [];
  for (var i=0;i<q.length;i++) {
    var op = q[i];
    try {
      if (op.type === 'insert_reporte') {
        await sb.from('reportes').insert([op.data]);
      } else if (op.type === 'insert_camion') {
        await sb.from('maquinarias').insert([op.data]);
      } else if (op.type === 'insert_chofer') {
        await sb.from('choferes').insert([op.data]);
      } else if (op.type === 'delete_camion') {
        await sb.from('maquinarias').delete().eq('id', op.data);
      } else if (op.type === 'delete_chofer') {
        await sb.from('choferes').delete().eq('id', op.data);
      } else if (op.type === 'delete_reporte') {
        await sb.from('reportes').delete().eq('id', op.data);
      }
    } catch(e) {
      remaining.push(op);
    }
  }
  saveOfflineQueue(remaining);
  if (remaining.length === 0 && q.length > 0) {
    await loadAllReportes();
    await loadmaquinarias();
    await loadChoferes();
  }
  updateOnlineStatus();
}
function updateOnlineStatus() {
  var el = document.getElementById('online-badge');
  if (!el) return;
  if (isOnline) {
    el.className = 'online-badge on';
    el.innerHTML = '<i class="ti ti-wifi"></i> En lÃ­nea';
  } else {
    el.className = 'online-badge off';
    el.innerHTML = '<i class="ti ti-wifi-off"></i> Sin conexiÃ³n';
  }
}
window.addEventListener('online', function() {
  isOnline = true;
  updateOnlineStatus();
  processOfflineQueue();
});
window.addEventListener('offline', function() {
  isOnline = false;
  updateOnlineStatus();
});

var RD = [
  {id:'CF 02',nom:'KOMATSU',pat:'CF 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'ME 01',nom:'MINI EXCAVADORA',pat:'ME 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'MA 01',nom:'HAULOTTE 01',pat:'MA 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'MA 02',nom:'HAULOTTE 02',pat:'MA 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'MA 03',nom:'HAULOTTE 03',pat:'MA 03',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'MA 04',nom:'SKAY TRACK',pat:'MA 04',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'MA 05',nom:'SKAY TRACK',pat:'MA 05',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'RE 01',nom:'RETROEXCAVADORA CASE C/MARTILLO',pat:'RE 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'RE 02',nom:'RETROEXCAVADORA CASE S/MARTILLO',pat:'RE 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'RE 03',nom:'CAT 416E (MAQUINA GERMAN)',pat:'RE 03',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'RE 04',nom:'RETROEXCAVADORA CASE NUEVA',pat:'RE 04',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'RO 01',nom:'RETROEXCAVADORA HYUNDAI',pat:'RO 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'CO 01',nom:'COMPACTADOR DYNAPAC',pat:'CO 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'CO 02',nom:'COMPACTADOR BOMAG',pat:'CO 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'CO 03',nom:'COMPACTADOR AMMAN',pat:'CO 03',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'CP 01',nom:'COMPRESOR CON MANGUERA',pat:'CP 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'CP 02',nom:'COMPRESOR 100 LTS',pat:'CP 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GE 01',nom:'GENERADOR GRANDE CUMMINGS',pat:'GE 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GE 02',nom:'GENERADOR CHICO PALMERO',pat:'GE 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GT 01',nom:'GRUA TORRE SAEZ',pat:'GT 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GT 02',nom:'GRUA TORRE SAEZ',pat:'GT 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GT 03',nom:'GRUA TORRE SAE46',pat:'GT 03',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GT 04',nom:'GRUA TORRE TROJSI',pat:'GT 04',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GM 01',nom:'GRUA TORTONE',pat:'GM 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GM 02',nom:'GRUA MOVIL BPR',pat:'GM 02',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'GM 03',nom:'GRUA CRANE',pat:'GM 03',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'},
  {id:'TI 01',nom:'TIJERA AZUL',pat:'TI 01',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'}
];
function loadRes() {
  try { var r = localStorage.getItem('m3v8'); if (r) return JSON.parse(r); } catch(e) {}
  return JSON.parse(JSON.stringify(RD));
}
function saveRes(d) {   try { localStorage.setItem('m3v8', JSON.stringify(d)); } catch(e) {} }
var resData = loadRes();

function getCam(id) { for (var i=0;i<resData.length;i++) if (resData[i].id===id) return resData[i]; return null; }
function getCamModelo(id) { for (var i=0;i<maquinarias.length;i++) if (maquinarias[i].id===id) return maquinarias[i].modelo; return ''; }

async function init() {
   try {
     updateOnlineStatus();
     processOfflineQueue();
     document.getElementById('r-fec').value = new Date().toISOString().split('T')[0];
     document.getElementById('rep-fec').value = new Date().toISOString().split('T')[0];
     loadReportesLocal();
     await loadmaquinariasOffline();
     await loadChoferes();
     await loadOTCounter();
     await loadAllReportes();
    var urlParams = new URLSearchParams(window.location.search);
    var camionParam = urlParams.get('camion');
    var tabParam = urlParams.get('tab');
    if (camionParam) {
      var exists = maquinarias.some(function(c) { return c.id === camionParam; });
      if (exists) {
        document.getElementById('r-cam').value = camionParam;
        var tabBtn = document.querySelectorAll('.tab')[1];
        showTab('nuevo', tabBtn);
      }
    }
    if (tabParam === 'nuevo') {
      var tabBtn2 = document.querySelectorAll('.tab')[1];
      showTab('nuevo', tabBtn2);
    } else {
      showTab('nuevo', document.querySelectorAll('.tab')[1]);
    }
   } catch(e) {
     console.error('Error en init:', e);
   }
 }

 function loadmaquinariasOffline() {
   loadReportesLocal();
   return loadmaquinarias();
 }

async function loadmaquinarias() {
  var r = await sb.from('maquinarias').select('*').order('id');
  maquinarias = r.data || [];
  fillmaquinarias();
}
async function loadChoferes() {}
async function loadOTCounter() {
  var r = await sb.from('reportes').select('id').like('id','OT-%').order('created_at',{ascending:false}).limit(1);
  if (r.data && r.data.length > 0) { var n = parseInt(r.data[0].id.replace('OT-','')) || 0; otCounter = n+1; }
}
async function loadAllReportes() {
   try {
     var r = await sb.from('reportes').select('*').order('fecha',{ascending:false}).limit(500);
     allReportes = r.data || [];
     saveReportesLocal();
   } catch(e) {
     console.error('Error cargando reportes, usando cache local:', e);
     loadReportesLocal();
   }
 }

function saveReportesLocal() {
   try { localStorage.setItem('m3v7_reportes', JSON.stringify(allReportes)); } catch(e) {}
 }

function loadReportesLocal() {
   try { var r = localStorage.getItem('m3v7_reportes'); if (r) allReportes = JSON.parse(r); } catch(e) {}
 }

function fillmaquinarias() {
  var q = '<option value="">Selecciona...</option>';
  var visibles = maquinarias.filter(maquinariaVisible);
  for (var i = 0; i < visibles.length; i++) q += '<option value="'+visibles[i].id+'">'+visibles[i].id+' - '+visibles[i].modelo+'</option>';
  if (q.indexOf('HILUX') < 0) q += '<option value="HILUX">HILUX - TOYOTA HILUX</option>';
  document.getElementById('r-cam').innerHTML = q;
  var q2 = '<option value="">Todos los maquinarias</option>';
  for (var i = 0; i < visibles.length; i++) q2 += '<option value="'+visibles[i].id+'">'+visibles[i].id+' - '+visibles[i].modelo+'</option>';
  if (q2.indexOf('HILUX') < 0) q2 += '<option value="HILUX">HILUX - TOYOTA HILUX</option>';
  document.getElementById('fil-cam').innerHTML = q2;
  document.getElementById('fil-ot-cam').innerHTML = q2;
}
function fillChoferes() {}

function showTab(id, btn) {
  document.querySelectorAll('.pane').forEach(function(p) { p.classList.remove('on'); });
  document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('on'); });
  document.getElementById('pane-'+id).classList.add('on');
  if (btn) btn.classList.add('on');
  if (id === 'historial') loadHist();
  if (id === 'config') { loadConfig(); setTimeout(function(){ initQRFlota(); }, 200); }
  if (id === 'dash') return;
  if (id === 'flota') renderFlota();
  if (id === 'reparaciones') { loadOTs(); loadReps(); }
  if (id === 'nuevo') { qpReset(); }
}

function askKey(btn) {
   if (adminOk) { showTab('config', btn); return; }
   var c = prompt('Ingresa la clave de administrador:');
   if (c === ADMIN_KEY) { adminOk = true; showTab('config', btn); }
   else if (c !== null) alert('Clave incorrecta.');
   else return;
}

function showMsg(id, type, txt) {
  var el = document.getElementById(id);
  el.querySelector('span').textContent = txt;
  el.className = 'msg ' + (type === 'ok' ? 'mok' : 'merr');
  el.style.display = 'flex';
  setTimeout(function() { el.style.display = 'none'; }, 5000);
}

function tbadge(t) {
  var m = {falla:'bred',service:'bamb',reparacion:'bpur',preventivo:'bgrn',engrase:'bblu',neumatico:'borg',accesorios:'borange',combustible:'bblue',aceites:'byellow'};
  var l = {falla:'Falla',service:'Service',reparacion:'Reparacion',preventivo:'Preventivo',engrase:'Engrase',neumatico:'Neumatico',accesorios:'Accesorio',combustible:'Combustible',aceites:'Aceite'};
  var icons = {falla:'ti-alert-triangle',service:'ti-tool',reparacion:'ti-hammer',preventivo:'ti-shield-check',engrase:'ti-droplet',neumatico:'ti-circle-dot',accesorios:'ti-wrench',combustible:'ti-droplet',aceites:'ti-flask'};
  return '<span class="badge '+(m[t]||'bgry')+'"><i class="ti '+(icons[t]||'ti-tag')+'"></i>'+(l[t]||t)+'</span>';
}
function fmtP(n) { if (!n || n === 0) return '-'; return '$'+Math.round(n).toLocaleString('es-AR'); }

function parseDateDMY(v) {
  if (!v || v === '---') return null;
  var p = v.split('/');
  if (p.length !== 3) return null;
  return new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
}

function diasHasta(fechaStr) {
  var d = parseDateDMY(fechaStr);
  if (!d) return null;
  return Math.ceil((d - new Date()) / 86400000);
}

function tiempoRelativo(fechaISO) {
  var d = new Date(fechaISO);
  var ahora = new Date();
  var diffMs = ahora - d;
  var mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return 'Hace ' + mins + ' min';
  var hs = Math.floor(mins / 60);
  if (hs < 24) return 'Hace ' + hs + (hs===1?' hora':' horas');
  var dias = Math.floor(hs / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 7) return 'Hace ' + dias + ' dias';
  return fechaISO;
}

function generarRecomendaciones(camId) {
  var recs = [];
  var c = getCam(camId);
  if (!c) return recs;
  var reps = allReportes.filter(function(r){ return r.camion === camId; });
  var dRto = diasHasta(c.rto);
  var dSeg = diasHasta(c.seg);
  if (c.est === 'REPARACION') recs.push({tipo:'urgent', texto:'Unidad en reparaciÃ³n. Verificar cierre de OT al finalizar.'});
  if (dRto !== null && dRto < 0) recs.push({tipo:'alert', texto:'RTO VENCIDO. Gestionar renovaciÃ³n urgente.'});
  else if (dRto !== null && dRto < 10) recs.push({tipo:'warn', texto:'RTO vence en '+dRto+' dÃ­as ('+c.rto+').'});
  if (dSeg !== null && dSeg < 0) recs.push({tipo:'alert', texto:'Seguro VENCIDO. Contactar aseguradora.'});
  else if (dSeg !== null && dSeg < 10) recs.push({tipo:'warn', texto:'Seguro vence en '+dSeg+' dÃ­as ('+c.seg+').'});
  var fallas = reps.filter(function(r){ return r.tipo === 'falla'; });
  if (fallas.length >= 3) recs.push({tipo:'warn', texto:''+fallas.length+' fallas registradas. Revisar sistema elÃ©ctrico y motor.'});
  var ultServ = reps.filter(function(r){ return r.tipo === 'service'; })[0];
  if (!ultServ && c.us === '---' && c.ps !== '---') recs.push({tipo:'info', texto:'Sin registros de service. Programar prÃ³ximo service ('+c.ps+').'});
  if (c.cho === '---') recs.push({tipo:'warn', texto:'Sin chofer asignado. Asignar conductor.'});
  return recs;
}

/* ============ DASHBOARD ============ */
async function renderDash() {
  await loadAllReportes();
  var totalCam = resData.length;
  var op = resData.filter(function(c){return c.est==='DISPONIBLE';}).length;
  var rep = totalCam - op;

  var vencs = [];
  for (var i=0;i<resData.length;i++) {
    var c = resData[i];
    ['rto','seg'].forEach(function(k){
      var d = diasHasta(c[k]);
      if (d !== null && d < 10) vencs.push({cam:c.id, tipo:k==='rto'?'RTO':'Seguro', dias:d, fecha:c[k], cho:c.cho, nom:c.nom});
    });
  }
  vencs.sort(function(a,b){return a.dias-b.dias;});

  var elOp = document.getElementById('d-op');
  if (elOp) elOp.textContent = op;
  var elRep = document.getElementById('d-rep');
  if (elRep) elRep.textContent = rep;
  var elAlert = document.getElementById('d-alert');
  if (elAlert) elAlert.textContent = vencs.length;
  var elMant = document.getElementById('d-mant');
  if (elMant) elMant.textContent = allReportes.filter(function(r){
    var f = new Date(r.fecha);
    var hace30 = new Date(); hace30.setDate(hace30.getDate()-30);
    return f >= hace30 && (r.tipo==='service'||r.tipo==='engrase'||r.tipo==='preventivo'||r.tipo==='neumatico');
  }).length;

  var vencEl = document.getElementById('d-vencs');
  if (!vencEl) return;
  if (!vencs.length) {
    vencEl.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:1rem">Sin vencimientos prÃ³ximos.</p>';
  } else {
    var html2 = '';
    for (var i=0;i<Math.min(vencs.length,8);i++) {
      var v = vencs[i];
      var badgeClass = v.dias < 0 ? 'bred' : (v.dias < 10 ? 'bred' : 'bamb');
      var txt = v.dias < 0 ? 'VENCIDO' : v.dias + ' dÃ­as';
      html2 += '<div class="venc-item"><span style="font-size:13px;font-weight:600">'+v.tipo+' - CamiÃ³n '+v.cam+' ('+v.cho+')</span><span class="badge '+badgeClass+'">'+txt+'</span></div>';
    }
    vencEl.innerHTML = html2;
  }

  var activEl = document.getElementById('d-activ');
  var ultimos = allReportes.slice(0,6);
  if (!ultimos.length) {
    activEl.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:1rem">Sin actividad.</p>';
  } else {
    var colores = {falla:'#DC2626',service:'#D97706',reparacion:'#7C3AED',preventivo:'#16A34A',engrase:'#1A56DB',neumatico:'#9333EA'};
    var labels = {falla:'Falla',service:'Service',reparacion:'ReparaciÃ³n',preventivo:'Preventivo',engrase:'Engrase'};
    var html = '';
    for (var i=0;i<ultimos.length;i++) {
      var x = ultimos[i];
      var col = colores[x.tipo] || '#888';
      html += '<div class="activ-item"><div class="activ-dot" style="background:'+col+'"></div><div style="flex:1">';
      html += '<div class="activ-tit">'+labels[x.tipo]+' - '+x.camion+'</div>';
      html += '<div class="activ-sub">'+x.descripcion.substring(0,45)+(x.descripcion.length>45?'...':'')+'</div>';
      html += '<div class="activ-time">'+fmtFecha(x.fecha)+'</div></div></div>';
    }
    activEl.innerHTML = html;
  }
  renderGPSDash();
}

/* ============ FLOTA (tarjetas) ============ */
function getAlertPriority(c) {
  var hasUrgent = false;
  var hasVencimiento = false;
  var dRto = diasHasta(c.rto);
  var dSeg = diasHasta(c.seg);
  if (c.est === 'REPARACION') hasUrgent = true;
  if (dRto !== null && dRto < 30) { hasUrgent = true; hasVencimiento = true; }
  else if (dSeg !== null && dSeg < 30) { hasUrgent = true; hasVencimiento = true; }
  if (!hasUrgent && !hasVencimiento && c.ps && c.ps !== '---') hasVencimiento = true;
  return { hasUrgent: hasUrgent, hasVencimiento: hasVencimiento };
}

function getGrupoMaquina(id) {
  var pref = id.split(' ')[0];
  if (pref === 'RE') return 'Retroexcavadoras';
  if (pref === 'CO') return 'Compactadores';
  if (pref === 'MA') return 'Manipuladores';
  if (pref === 'CF') return 'Cargadoras';
  if (pref === 'GT' || pref === 'GM') return 'GrÃºas';
  if (pref === 'TI') return 'Tijera';
  if (pref === 'CP') return 'Compresores';
  if (pref === 'GE') return 'Generadores';
  if (pref === 'RO') return 'Excavadoras';
  if (pref === 'ME') return 'Mini Excavadoras';
  return 'Otros';
}

function getGrupoMaquina(id) {
  var pref = id.split(' ')[0];
  if (pref === 'RE') return 'Retroexcavadoras';
  if (pref === 'CO') return 'Compactadores';
  if (pref === 'MA') return 'Manipuladores';
  if (pref === 'CF') return 'Cargadoras';
  if (pref === 'GT' || pref === 'GM') return 'Gruas';
  if (pref === 'TI') return 'Tijera';
  if (pref === 'CP') return 'Compresores';
  if (pref === 'GE') return 'Generadores';
  if (pref === 'RO') return 'Excavadoras';
  if (pref === 'ME') return 'Mini Excavadoras';
  return 'Otros';
}

function renderFlota() {
  try {
  var q = (document.getElementById('search-flota').value || '').toLowerCase().trim();
  var el = document.getElementById('flota-grid');
  var filtrados = resData.filter(function(c) {
    if (!maquinariaVisible(c)) return false;
    if (!q) return true;
    return c.id.toLowerCase().indexOf(q) >= 0 || c.nom.toLowerCase().indexOf(q) >= 0 || c.cho.toLowerCase().indexOf(q) >= 0;
  });
  filtrados.sort(function(a,b) {
    var aRep = a.est === 'REPARACION' ? 1 : 0;
    var bRep = b.est === 'REPARACION' ? 1 : 0;
    if (aRep !== bRep) return bRep - aRep;
    var pa = getAlertPriority(a);
    var pb = getAlertPriority(b);
    if (pa.hasUrgent && !pb.hasUrgent) return -1;
    if (!pa.hasUrgent && pb.hasUrgent) return 1;
    if (pa.hasVencimiento && !pb.hasVencimiento) return -1;
    if (!pa.hasVencimiento && pb.hasVencimiento) return 1;
    if (a.id.toLowerCase() < b.id.toLowerCase()) return -1;
    if (a.id.toLowerCase() > b.id.toLowerCase()) return 1;
    return 0;
  });
  var gruposOrden = ['Cargadoras','Excavadoras','Haulottes','Retroexcavadoras','Compactadores','GrÃºas','Tijera','Skay Track','Compresores','Generadores','Otros'];
  var grupos = {};
  var grupoKeys = [];
  for (var gi=0; gi<gruposOrden.length; gi++) grupos[gruposOrden[gi]] = [];
  for (var fi=0; fi<filtrados.length; fi++) {
    var g = getGrupoMaquina(filtrados[fi].id);
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(filtrados[fi]);
    if (grupoKeys.indexOf(g) < 0) grupoKeys.push(g);
  }
  grupoKeys.sort(function(a,b){ return gruposOrden.indexOf(a) - gruposOrden.indexOf(b); });
  var maxVisible = 18;
  var contador = 0;
  var html = '';
  for (var gk=0; gk<grupoKeys.length; gk++) {
    var grupo = grupos[grupoKeys[gk]];
    if (!grupo.length) continue;
    html += '<div style="grid-column:1/-1;background:#FDE68A;color:#78350F;font-weight:800;font-size:13px;padding:8px 14px;border-radius:999px;margin-top:10px;text-transform:uppercase;letter-spacing:.05em"><i class=\"ti ti-category\"></i> '+grupoKeys[gk]+' ('+grupo.length+')</div>';
    for (var mi=0; mi<grupo.length; mi++) {
      if (contador >= maxVisible && !flotaExpandida) break;
      var c = grupo[mi];
      var claseFondo = c.est === 'REPARACION' ? 'ftc-rep' : 'ftc-op';
      var badgeTxt = c.est === 'REPARACION' ? 'EN REPARACION' : 'OPERATIVO';
      var badgeClass = c.est === 'REPARACION' ? 'bred' : 'bgrn';
      var alertaTxt = '';
      var dRto = diasHasta(c.rto);
      var dSeg = diasHasta(c.seg);
      if (dRto !== null && dRto < 30) alertaTxt = 'RTO vence pronto';
      else if (dSeg !== null && dSeg < 30) alertaTxt = 'Seguro vence pronto';
      var ultRep = allReportes.filter(function(r){return r.camion===c.id && r.tipo==='falla';})[0];
      html += '<div class="ftc '+claseFondo+'" onclick="abrirDetalle(\''+c.id+'\')">';
      if (adminOk) {
        html += '<button class="bo" onclick="event.stopPropagation();openEdit(\''+c.id+'\')" style="position:absolute;bottom:10px;right:10px;font-size:9px;padding:4px 8px;background:var(--az);color:#fff;border:none;border-radius:6px;cursor:pointer"><i class="ti ti-pencil"></i></button>';
      }
      html += '<span class="badge '+badgeClass+'" style="position:absolute;top:10px;right:10px;font-size:9px">'+badgeTxt+'</span>';
      html += '<div class="ftc-id">'+c.id+'</div>';
      html += '<div class="ftc-mod">'+(c.nom||c.id)+'</div>';
      if (c.cho !== '---') html += '<div class=\"ftc-info\"><i class=\"ti ti-user\"></i> '+c.cho+'</div>';
      if (c.ps && c.ps !== '---') html += '<div class=\"ftc-info\"><i class=\"ti ti-tool\"></i> Prox. service: '+c.ps+'</div>';
      if (ultRep) html += '<div class=\"ftc-alert\" style=\"color:#DC2626\"><i class=\"ti ti-alert-triangle\"></i> '+ultRep.descripcion.substring(0,30)+'...</div>';
      if (alertaTxt) html += '<div class=\"ftc-alert\" style=\"color:#D97706\"><i class=\"ti ti-calendar-exclamation\"></i> '+alertaTxt+'</div>';
      var batHtml = getBatteryBar(c);
      if (batHtml) html += batHtml;
      html += '</div>';
      contador++;
    }
    if (contador >= maxVisible && !flotaExpandida) break;
  }
  if (!flotaExpandida && filtrados.length > maxVisible) {
    html += '<button class="bo" onclick="toggleFlota()" style="grid-column:1/-1;padding:12px;font-size:14px"><i class=\"ti ti-chevron-down\"></i> Ver mas ('+(filtrados.length - maxVisible)+' ocultos)</button>';
  } else if (flotaExpandida && filtrados.length > maxVisible) {
    html += '<button class="bo" onclick="toggleFlota()" style="grid-column:1/-1;padding:12px;font-size:14px"><i class=\"ti ti-chevron-up\"></i> Ver menos</button>';
  }
  el.innerHTML = html;
  } catch(e) {
    console.error('Error en renderFlota:', e);
    var flotaGrid = document.getElementById('flota-grid');
    if (flotaGrid) flotaGrid.innerHTML = '<p style="color:var(--red);padding:2rem;text-align:center">Error al cargar flota. Recarga la pÃ¡gina.</p>';
  }
}

function getBatteryBar(c) {
  var ub = c.ub;
  var pb = c.pb;
  if (!ub || ub === '---') return '';
  var hoy = new Date();
  var hoyTS = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  var dUb = parseDateDMY(ub);
  if (!dUb) return '';
  var dPb = null;
  if (pb && pb !== '---') {
    dPb = parseDateDMY(pb);
  }
  if (!dPb) {
    dPb = new Date(dUb.getFullYear() + 3, dUb.getMonth(), dUb.getDate());
  }
  var totalMs = dPb.getTime() - dUb.getTime();
  var pasadoMs = hoyTS - dUb.getTime();
  var pct = totalMs > 0 ? Math.round(Math.max(0, 1 - pasadoMs / totalMs) * 100) : 0;
  var color = '#16A34A';
  if (pct <= 0) color = '#DC2626';
  else if (pct < 30) color = '#D97706';
  var texto = 'Bateria ' + pct + '%';
  return '<div class=\"ftc-info\" style=\"margin-top:4px\"><i class=\"ti ti-battery\"></i> '+texto+'<div style=\"background:#ddd;border-radius:999px;height:8px;width:100%;margin-top:4px;overflow:hidden\"><div style=\"background:'+color+';height:100%;width:'+pct+'%;border-radius:999px\"></div></div></div>';
}

/* ============ DETALLE CAMION (timeline) ============ */
async function abrirDetalle(camId) {
  detalleCamionId = camId;
  document.querySelectorAll('.pane').forEach(function(p) { p.classList.remove('on'); });
  document.getElementById('pane-detalle').classList.add('on');
  var c = getCam(camId);
  var mod = getCamModelo(camId);
  var cont = document.getElementById('detalle-cont');
  cont.innerHTML = '<div class="loader">Cargando...</div>';

  var r = await sb.from('reportes').select('*').eq('camion',camId).order('fecha',{ascending:false});
  var reps = r.data || [];

  var estB = c.est === 'DISPONIBLE' ? '<span class="badge bgrn"><i class="ti ti-circle-check"></i> Operativo</span>' : '<span class="badge bred"><i class="ti ti-tool"></i> En reparacion</span>';

  var html = '<div class="card card-blue">';
  html += '<div class="rt"><div><div style="font-size:20px;font-weight:800">'+c.id+'</div><div style="font-size:13px;opacity:.85">'+(mod||c.nom)+'</div></div>'+estB+'</div>';
  html += '<div style="font-size:12px;opacity:.8;margin-top:10px"><i class="ti ti-user"></i> '+c.cho+' &nbsp; <i class="ti ti-license-plate"></i> '+c.pat+'</div>';
  html += '</div>';

  html += '<div class="card">';
  html += '<div class="g2" style="margin-bottom:0">';
  html += '<div class="rc-item"><div class="rc-itit"><i class="ti ti-tool"></i> Ultimo service</div><div class="rc-ival">'+c.us+'</div></div>';
  html += '<div class="rc-item"><div class="rc-itit"><i class="ti ti-droplet"></i> Ultimo engrase</div><div class="rc-ival">'+c.ue+'</div></div>';
  html += '<div class="rc-item"><div class="rc-itit"><i class="ti ti-calendar"></i> RTO</div><div class="rc-ival">'+c.rto+'</div></div>';
  html += '<div class="rc-item"><div class="rc-itit"><i class="ti ti-shield"></i> Seguro</div><div class="rc-ival">'+c.seg+'</div></div>';
  html += '</div>';
  if (adminOk) {
    html += '<button class="ebtn" onclick="togEditDetalle()" style="margin-top:10px"><i class="ti ti-pencil"></i> Editar datos</button>';
    html += '<div class="eform hid" id="ef-detalle"></div>';
  }
  html += '</div>';

  html += '<div class="card"><p class="dash-sec-tit"><i class="ti ti-clock-history"></i> Linea de tiempo</p>';
  if (!reps.length) {
    html += '<p style="color:#888;font-size:13px;padding:1rem;text-align:center">Sin reportes registrados para este camion.</p>';
  } else {
    var colores = {falla:'#DC2626',service:'#D97706',reparacion:'#7C3AED',preventivo:'#16A34A',engrase:'#1A56DB',neumatico:'#9333EA'};
    html += '<div class="tl-wrap"><div class="tl-line"></div>';
    for (var i=0;i<reps.length;i++) {
      var x = reps[i];
      var col = colores[x.tipo] || '#888';
      html += '<div class="tl-item"><div class="tl-dot" style="color:'+col+'"></div>';
      html += '<div class="tl-date">'+fmtFecha(x.fecha)+'</div>';
      html += '<div class="tl-card">';
      html += '<div class="rt">'+tbadge(x.tipo)+(x.es_ot?'<span class="chip">'+x.id+'</span>':'')+'</div>';
      html += '<div style="font-size:13px;margin-top:6px">'+x.descripcion+'</div>';
      if (x.km) html += '<div style="font-size:11px;color:#888;margin-top:4px">'+x.km.toLocaleString('es-AR')+' km</div>';
      if (x.es_ot) html += '<button class="bo" style="font-size:11px;padding:4px 10px;margin-top:6px" onclick="openOT(\''+x.id+'\')"><i class="ti ti-printer"></i> Imprimir OT</button>';
      html += '</div></div>';
    }
    html += '</div>';
  }
   html += '</div>';
   var recomendaciones = generarRecomendaciones(camId);
   if (recomendaciones.length) {
     var clasesTipo = {alert:'ds-red', urgent:'ds-red', warn:'ds-amb', info:'ds-azu'};
     var iconosTipo = {alert:'ti-alert-triangle', urgent:'ti-alert-octagon', warn:'ti-alert-triangle', info:'ti-info-circle'};
     html += '<div class="card card-blue" style="background:linear-gradient(135deg, hsl(220,80%,44%) 0%, hsl(220,80%,32%) 100%)">';
     html += '<p class="dash-sec-tit" style="color:#fff"><i class="ti ti-lightbulb"></i> Recomendaciones</p>';
     for (var i=0;i<recomendaciones.length;i++) {
       var rec = recomendaciones[i];
       var claseRec = clasesTipo[rec.tipo] || 'ds-azu';
       var iconoRec = iconosTipo[rec.tipo] || 'ti-info-circle';
       html += '<div class="rc-item" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:#fff;margin-bottom:6px">';
       html += '<div style="display:flex;align-items:center;gap:8px"><i class="ti '+iconoRec+'" style="font-size:16px;flex-shrink:0"></i>';
       html += '<span style="font-size:12.5px;font-weight:600;line-height:1.4">'+rec.texto+'</span></div></div>';
     }
     html += '</div>';
   } else {
     html += '<div class="card"><p class="dash-sec-tit"><i class="ti ti-check"></i> Estado general</p>';
     html += '<div class="rc-item" style="background:var(--grnl);border-color:hsl(142,60%,80%)"><div style="font-size:13px;font-weight:700;color:var(--grn)">Sin recomendaciones por el momento</div>';
     html += '<div style="font-size:11px;color:var(--muted);margin-top:2px">La unidad se encuentra en condiciones normales</div></div></div>';
   }
   cont.innerHTML = html;
}

function togEditDetalle() {
  var el = document.getElementById('ef-detalle');
  if (!el.classList.contains('hid')) { el.classList.add('hid'); return; }
  el.classList.remove('hid');
  var c = getCam(detalleCamionId);
  var campos = [{k:'rto',l:'RTO Venc.'},{k:'seg',l:'Seguro hasta'},{k:'uc',l:'Ult. cubiertas'},{k:'pc',l:'Prox. cubiertas'},{k:'ub',l:'Ult. bateria'},{k:'pb',l:'Prox. bateria'},{k:'ue',l:'Ult. engrase'},{k:'pe',l:'Prox. engrase'},{k:'us',l:'Ult. service'},{k:'ps',l:'Prox. service'},{k:'cho',l:'Chofer'}];
  var html = '<div class="g2">';
  for (var i=0;i<campos.length;i++) html += '<div class="field"><label>'+campos[i].l+'</label><input type="text" id="efd-'+campos[i].k+'" value="'+(c[campos[i].k]||'---')+'"></div>';
  html += '</div><div class="field"><label>Estado</label><select id="efd-est"><option value="DISPONIBLE" '+(c.est==='DISPONIBLE'?'selected':'')+'>Operativo</option><option value="REPARACION" '+(c.est==='REPARACION'?'selected':'')+'>En reparacion</option></select></div>';
  html += '<button class="bp" onclick="saveEditDetalle()" style="margin-top:8px"><i class="ti ti-device-floppy"></i> Guardar cambios</button>';
  el.innerHTML = html;
}

function saveEditDetalle() {
  var c = getCam(detalleCamionId);
  var campos = ['rto','seg','uc','pc','ub','pb','ue','pe','us','ps','cho'];
  for (var i=0;i<campos.length;i++) {
    var el = document.getElementById('efd-'+campos[i]);
    if (el) c[campos[i]] = el.value.trim() || '---';
  }
  c.est = document.getElementById('efd-est').value;
  saveRes(resData);
  abrirDetalle(detalleCamionId);
}

/* ============ CARGA RAPIDA (Reportar) ============ */
function qpReset() {
  tipoActual = '';
  document.getElementById('qp-step1').classList.remove('hid');
  document.getElementById('qp-step2').classList.add('hid');
  document.getElementById('ot-area').innerHTML = '';
}

function pickTipo(t) {
  tipoActual = t;
  var labels = {falla:'Reportar Falla',preventivo:'Reportar Preventivo',service:'Reportar Service',engrase:'Reportar Engrase',neumatico:'Reportar NeumÃ¡ticos',accesorios:'Reportar Accesorios',combustible:'Reportar Combustible',aceites:'Reportar Aceites'};
  document.getElementById('qp-tipo-tit').textContent = labels[t];
  document.getElementById('qp-step1').classList.add('hid');
  document.getElementById('qp-step2').classList.remove('hid');
  document.getElementById('falla-extra').classList.toggle('hid', t !== 'falla');
  document.getElementById('campos-combustible').classList.toggle('hid', t !== 'combustible');
  document.getElementById('campos-aceites').classList.toggle('hid', t !== 'aceites');
  document.getElementById('campos-accesorios').classList.toggle('hid', t !== 'accesorios');
}

function qpBack() {
  document.getElementById('qp-step1').classList.remove('hid');
  document.getElementById('qp-step2').classList.add('hid');
}

async function guardar() {
  var cam = document.getElementById('r-cam').value;
  var cho = document.getElementById('r-cam').value;
  var tip = tipoActual;
  var km = parseInt(document.getElementById('r-km').value) || 0;
  var des = document.getElementById('r-des').value.trim();
  var urg = document.getElementById('r-urg').value;
  var rep = document.getElementById('r-rep').value.trim();
  var fec = document.getElementById('r-fec').value;
  var extra = '';
  if (tip === 'combustible') {
    var horasComb = document.getElementById('r-horas-comb').value;
    var litros = document.getElementById('r-litros').value;
    if (horasComb) extra += 'Horas: '+horasComb+' | ';
    if (litros) extra += 'Litros: '+litros+' | ';
  }
  if (tip === 'aceites') {
    var horasAceite = document.getElementById('r-horas-aceite').value;
    var litrosAceite = document.getElementById('r-litros-aceite').value;
    var tipoAceite = document.getElementById('r-tipo-aceite').value.trim();
    if (horasAceite) extra += 'Horas: '+horasAceite+' | ';
    if (litrosAceite) extra += 'Litros: '+litrosAceite+' | ';
    if (tipoAceite) extra += 'Tipo: '+tipoAceite+' | ';
  }
  if (tip === 'accesorios') {
    var rotura = document.getElementById('r-rotura').value;
    var horasAcc = document.getElementById('r-horas-acc').value;
    if (rotura) extra += 'Rotura: '+rotura+' | ';
    if (horasAcc) extra += 'Horas: '+horasAcc+' | ';
  }
  if (extra) des = extra + ' | ' + des;
  if (!cam || !cho || !tip || !des) { showMsg('err-msg','err','Completa maquina, chofer y descripcion.'); return; }
  var esOT = (tip === 'falla');
  var id = esOT ? 'OT-'+String(otCounter).padStart(3,'0') : 'REP-'+Date.now();
  if (esOT) otCounter++;
  var rep2 = {id:id,fecha:fec,camion:cam,chofer:cho,tipo:tip,descripcion:des,km:km,urgencia:urg,repuestos:rep,es_ot:esOT};
  if (!isOnline) {
    addOfflineOp({type:'insert_reporte', data:rep2, timestamp:Date.now()});
    if (tip === 'engrase') { var c = getCam(cam); if (c) { c.ue = formatDateToDMY(fec); saveRes(resData); } }
    if (tip === 'service') { var c = getCam(cam); if (c) { c.us = formatDateToDMY(fec); saveRes(resData); } }
    if (tip === 'falla') { var c = getCam(cam); if (c && urg === 'alta') { c.est = 'REPARACION'; saveRes(resData); } }
    showMsg('ok-msg','ok','Sin conexion. Reporte guardado localmente y se sincronizara al recuperar conexion.');
    return;
  }
  var res = await sb.from('reportes').insert([rep2]);
  if (res.error) {
    if (res.error.message && res.error.message.indexOf('Failed to fetch') >= 0) {
      addOfflineOp({type:'insert_reporte', data:rep2, timestamp:Date.now()});
      if (tip === 'engrase') { var c = getCam(cam); if (c) { c.ue = formatDateToDMY(fec); saveRes(resData); } }
      if (tip === 'service') { var c = getCam(cam); if (c) { c.us = formatDateToDMY(fec); saveRes(resData); } }
      if (tip === 'falla') { var c = getCam(cam); if (c && urg === 'alta') { c.est = 'REPARACION'; saveRes(resData); } }
      showMsg('ok-msg','ok','Sin conexion. Reporte guardado localmente y se sincronizara al recuperar conexion.');
      return;
    }
    showMsg('err-msg','err','Error: '+res.error.message); return;
  }
  if (tip === 'engrase') { var c = getCam(cam); if (c) { c.ue = formatDateToDMY(fec); saveRes(resData); } }
  if (tip === 'service') { var c = getCam(cam); if (c) { c.us = formatDateToDMY(fec); saveRes(resData); } }
  if (tip === 'falla') { var c = getCam(cam); if (c && urg === 'alta') { c.est = 'REPARACION'; saveRes(resData); } }
  showMsg('ok-msg','ok', esOT ? 'Reporte guardado. OT '+id+' generada.' : 'Reporte guardado correctamente.');
  await loadAllReportes();
  if (esOT) showOT(rep2);
  else document.getElementById('ot-area').innerHTML = '';
  document.getElementById('r-des').value = '';
  document.getElementById('r-rep').value = '';
  document.getElementById('r-km').value = '';
  document.getElementById('r-horas-comb').value = '';
  document.getElementById('r-litros').value = '';
  document.getElementById('r-horas-aceite').value = '';
  document.getElementById('r-litros-aceite').value = '';
  document.getElementById('r-tipo-aceite').value = '';
  document.getElementById('r-rotura').value = '';
  document.getElementById('r-horas-acc').value = '';
  document.getElementById('r-cam').selectedIndex = 0;
  document.getElementById('r-cam').selectedIndex = 0;
  document.getElementById('r-fec').value = new Date().toISOString().split('T')[0];
}

function formatDateToDMY(iso) {
  var p = iso.split('-');
  return p[2]+'/'+p[1]+'/'+p[0];
}

var MESES = ['','enero','febrero','marzo','abr','mayo','jun','jul','agosto','sept','oct','nov','dic'];
function fmtFecha(iso) {
  if (!iso || iso === '---') return '---';
  var p = iso.split('-');
  var m = parseInt(p[1], 10);
  return p[2]+'/'+MESES[m]+'/'+p[0];
}

function showOT(r) {
  var ul = {alta:'ALTA - no puede circular',media:'Media - con cuidado',baja:'Baja - programar'};
  var mod = getCamModelo(r.camion);
  var h = '<div class="ot-wrap">';
  h += '<div class="ot-hdr"><div>';
  h += '<div class="ot-logo">M3 Monteverdi Cubico</div>';
  h += '<div class="ot-tit">Orden de Trabajo '+r.id+'</div>';
  h += '<div style="font-size:12px;color:#666;margin-top:2px">Fecha: '+r.fecha+'</div>';
  h += '</div><div style="text-align:right"><div style="font-size:11px;color:#888;font-weight:600">URGENCIA</div>';
  h += '<div style="font-weight:800;color:#DC2626;font-size:14px">'+(ul[r.urgencia]||'-')+'</div></div></div>';
  h += '<div class="ot-sec">Vehiculo</div>';
  h += '<div class="ot-kv"><span class="ot-k">Camion</span><span><strong>'+r.camion+'</strong> - '+mod+'</span></div>';
  h += '<div class="ot-kv"><span class="ot-k">Chofer</span><span>'+r.chofer+'</span></div>';
  h += '<div class="ot-kv"><span class="ot-k">Kilometraje</span><span>'+(r.km?r.km.toLocaleString('es-AR')+' km':'-')+'</span></div>';
  h += '<div class="ot-sec">Descripcion del problema</div>';
  h += '<div style="background:#EEF4FF;border-radius:10px;padding:12px;font-size:14px;border-left:4px solid var(--az)">'+r.descripcion+'</div>';
  h += '<div class="ot-sec">Repuestos estimados</div>';
  h += '<p style="font-size:13px">'+(r.repuestos||'A determinar por el taller')+'</p>';
  h += '<div class="firma-row"><div class="firma">Firma del chofer</div><div class="firma">Firma del mecanico</div><div class="firma">Autorizo</div></div>';
  h += '</div>';
  h += '<div style="display:flex;gap:8px;margin-top:14px" class="noprint">';
  h += '<button class="bp" onclick="window.print()" style="flex:1"><i class="ti ti-printer"></i> Imprimir OT</button>';
  h += '<button class="bo" onclick="document.getElementById(\'ot-area\').innerHTML=\'\'"><i class="ti ti-x"></i> Cerrar</button>';
  h += '</div>';
  document.getElementById('ot-area').innerHTML = h;
  document.getElementById('ot-area').scrollIntoView({behavior:'smooth'});
}

/* ============ REPARACIONES ============ */
async function loadOTs() {
  var fil = document.getElementById('fil-ot-cam').value;
  var q = sb.from('reportes').select('*').eq('es_ot',true).order('fecha',{ascending:false});
  if (fil) q = q.eq('camion',fil);
  var r = await q;
  var el = document.getElementById('lista-ots');
  el.innerHTML = '';
  if (!r.data || !r.data.length) { el.innerHTML = '<p style="color:#888;font-size:13px;padding:8px">No hay OTs generadas.</p>'; return; }
  otsCache = r.data;
  var p = document.createElement('p');
  p.style.cssText = 'font-size:12px;color:#888;margin-bottom:8px';
  p.textContent = 'Toca una OT para registrar la reparacion:';
  el.appendChild(p);
  var ul = {alta:'Alta',media:'Media',baja:'Baja'};
  for (var i = 0; i < r.data.length; i++) {
    (function(idx, x) {
      var div = document.createElement('div');
      div.className = 'rfalla';
      div.innerHTML = '<div style="display:flex;justify-content:space-between"><span style="font-weight:700;font-size:13px">'+x.id+' - '+x.camion+'</span><span style="font-size:12px;color:#D97706;font-weight:600">'+(ul[x.urgencia]||'')+'</span></div><div style="font-size:12px;color:#666;margin-top:4px">'+fmtFecha(x.fecha)+' | '+x.descripcion.substring(0,60)+'...</div>';
      div.onclick = function() { selOT(otsCache[idx]); };
      el.appendChild(div);
    })(i, r.data[i]);
  }
}

function selOT(r) {
  document.getElementById('buscador-ot').classList.add('hid');
  document.getElementById('form-rep').classList.remove('hid');
  var ul = {alta:'Alta',media:'Media',baja:'Baja'};
  document.getElementById('falla-sel').innerHTML =
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'
    +'<span style="font-weight:800;font-size:14px">'+r.id+' - Camion '+r.camion+'</span>'
    +'<span class="badge bamb">'+(ul[r.urgencia]||'')+'</span></div>'
    +'<div style="font-size:12px;color:#888;margin-bottom:8px">Fecha: '+fmtFecha(r.fecha)+' | Chofer: '+r.chofer+'</div>'
    +'<div style="background:#EEF4FF;border-radius:10px;padding:10px;font-size:13px;border-left:4px solid var(--az)">'+r.descripcion+'</div>'
    +(r.repuestos?'<div style="font-size:12px;color:#888;margin-top:6px">Repuestos estimados: '+r.repuestos+'</div>':'');
  window._otSel = r;
}

function cancelRep() {
  window._otSel = null;
  document.getElementById('buscador-ot').classList.remove('hid');
  document.getElementById('form-rep').classList.add('hid');
  document.getElementById('rep-tal').value = '';
  document.getElementById('rep-tra').value = '';
  document.getElementById('rep-rep').value = '';
}

async function saveRep() {
  if (!adminOk) { alert('Necesitas clave de administrador para guardar reparaciones.'); return; }
  var r = window._otSel;
  if (!r) return;
  var tra = document.getElementById('rep-tra').value.trim();
  if (!tra) { showMsg('err-rep','err','Describe los trabajos realizados.'); return; }
  var tal = document.getElementById('rep-tal').value.trim();
  var rep = document.getElementById('rep-rep').value.trim();
  var fec = document.getElementById('rep-fec').value;
  var desc = '[OT:'+r.id+'] '+(tal?'Taller: '+tal+' - ':'')+tra;
  var r2 = {id:'REP-'+Date.now(),fecha:fec,camion:r.camion,chofer:r.chofer,tipo:'reparacion',descripcion:desc,km:r.km,urgencia:'',repuestos:rep,es_ot:false};
  if (!isOnline) {
    addOfflineOp({type:'insert_reporte', data:r2, timestamp:Date.now()});
    var c = getCam(r.camion); if (c) { c.est = 'DISPONIBLE'; saveRes(resData); }
    showMsg('ok-rep','ok','Sin conexion. Reparacion guardada localmente.');
    cancelRep(); loadOTs(); loadReps(); await loadAllReportes();
    return;
  }
  var res = await sb.from('reportes').insert([r2]);
  if (res.error) {
    if (res.error.message && res.error.message.indexOf('Failed to fetch') >= 0) {
      addOfflineOp({type:'insert_reporte', data:r2, timestamp:Date.now()});
      var c = getCam(r.camion); if (c) { c.est = 'DISPONIBLE'; saveRes(resData); }
      showMsg('ok-rep','ok','Sin conexion. Reparacion guardada localmente.');
      cancelRep(); loadOTs(); loadReps(); await loadAllReportes();
      return;
    }
    showMsg('err-rep','err','Error: '+res.error.message); return;
  }
  var c = getCam(r.camion); if (c) { c.est = 'DISPONIBLE'; saveRes(resData); }
  showMsg('ok-rep','ok','Reparacion guardada. El camion vuelve a estar operativo.');
  cancelRep(); loadOTs(); loadReps(); await loadAllReportes();
}

async function loadReps() {
  var r = await sb.from('reportes').select('*').eq('tipo','reparacion').order('fecha',{ascending:false}).limit(30);
  var el = document.getElementById('lista-reps');
  if (!r.data || !r.data.length) { el.innerHTML = '<p style="color:#888;font-size:13px">Sin reparaciones registradas.</p>'; return; }
  var html = '';
  for (var i = 0; i < r.data.length; i++) {
    var x = r.data[i];
    html += '<div class="ri"><div class="rt"><span><span class="chip">'+x.camion+'</span><span class="badge bpur"><i class="ti ti-hammer"></i> Reparacion</span></span><span style="font-size:12px;color:#888">'+fmtFecha(x.fecha)+'</span></div>';
    html += '<div style="font-size:13px;margin:6px 0">'+x.descripcion.substring(0,90)+(x.descripcion.length>90?'...':'')+'</div>';
    html += '<div style="font-size:12px;color:#888">'+(x.repuestos?x.repuestos.substring(0,50)+' ':'')+'</div></div>';
  }
  el.innerHTML = html;
}

/* ============ HISTORIAL ============ */
 async function loadHist() {
   var fil = document.getElementById('fil-cam').value;
   var textFil = (document.getElementById('fil-text').value || '').toLowerCase().trim();
   var q = sb.from('reportes').select('*').order('fecha',{ascending:false});
   if (fil) q = q.eq('camion',fil);
   var r = await q;
   var el = document.getElementById('tabla-hist');
   if (!el) return;
   var data = r.data || [];
   if (textFil) {
     data = data.filter(function(x) {
       var desc = (x.descripcion || '').toLowerCase();
       return desc.indexOf(textFil) >= 0;
     });
   }
   if (!data.length) { el.innerHTML = '<p style="color:#888;text-align:center;padding:1.5rem;font-size:13px">Sin reportes.</p>'; return; }
   var html = '';
   for (var i = 0; i < data.length; i++) {
     var x = data[i];
     html += '<div class="ri"><div class="rt"><span><span class="chip">'+x.camion+'</span>'+tbadge(x.tipo)+'</span><span style="font-size:12px;color:#888">'+fmtFecha(x.fecha)+'</span></div>';
     html += '<div style="font-size:14px;margin:6px 0">'+x.descripcion.substring(0,80)+(x.descripcion.length>80?'...':'')+'</div>';
     html += '<div style="font-size:11px;color:#888;display:flex;justify-content:space-between;align-items:center">';
     html += '<span>'+(x.km?x.km.toLocaleString('es-AR')+' km':'')+'</span>';
     html += '<span style="display:flex;gap:6px">';
     if (adminOk) {
       html += '<button class="bd bd-del" onclick="delReporte(\''+x.id+'\')" title="Eliminar reporte" style="font-size:12px;padding:4px 8px"><i class="ti ti-trash"></i></button>';
     }
     if (x.es_ot) html += '<button class="bo" style="font-size:12px;padding:5px 10px" onclick="openOT(\''+x.id+'\')"><i class="ti ti-printer"></i> '+x.id+'</button>';
     html += '</span></div></div>';
   }
   el.innerHTML = html;
 }

async function delReporte(id) {
    if (!confirm('Â¿Eliminar este reporte?')) return;
    if (!isOnline) {
      addOfflineOp({type:'delete_reporte', data:id, timestamp:Date.now()});
      await loadAllReportes();
      await loadHist();
      if (document.getElementById('pane-reparaciones').classList.contains('on')) { loadOTs(); loadReps(); }
      showMsg('ok-msg','ok','Sin conexion. Reporte eliminado localmente.');
      return;
    }
    var r = await sb.from('reportes').delete().eq('id',id);
    if (r.error) {
      if (r.error.message && r.error.message.indexOf('Failed to fetch') >= 0) {
        addOfflineOp({type:'delete_reporte', data:id, timestamp:Date.now()});
        await loadAllReportes();
        await loadHist();
        if (document.getElementById('pane-reparaciones').classList.contains('on')) { loadOTs(); loadReps(); }
        showMsg('ok-msg','ok','Sin conexion. Reporte eliminado localmente.');
        return;
      }
      showMsg('err-msg','err','Error: '+r.error.message); return;
    }
    await loadAllReportes();
    await loadHist();
    if (document.getElementById('pane-reparaciones').classList.contains('on')) { loadOTs(); loadReps(); }
    if (document.getElementById('pane-dashboard').classList.contains('on') || document.getElementById('pane-dash').classList.contains('on')) { renderDash(); }
  }

async function openOT(id) {
   var r = await sb.from('reportes').select('*').eq('id',id).single();
   if (!r.data) return;
   document.querySelectorAll('.pane').forEach(function(p) { p.classList.remove('on'); });
   document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('on'); });
   document.getElementById('pane-nuevo').classList.add('on');
   document.querySelectorAll('.tab')[1].classList.add('on');
   document.getElementById('qp-step1').classList.add('hid');
   document.getElementById('qp-step2').classList.add('hid');
   showOT(r.data);
 }

 /* ============ NOTIFICACIONES EMAIL ============ */
 function obtenerVencimientos() {
   var vencs = [];
   for (var i=0;i<resData.length;i++) {
     var c = resData[i];
     ['rto','seg'].forEach(function(k){
        var d = diasHasta(c[k]);
        if (d !== null && d < 10) vencs.push({cam:c.id, tipo:k==='rto'?'RTO':'Seguro', dias:d, fecha:c[k], cho:c.cho, nom:c.nom});
     });
   }
   return vencs.sort(function(a,b){return a.dias-b.dias;});
 }

 async function enviarAlertasEmail() {
   var vencs = obtenerVencimientos();
   if (!vencs.length) { showMsg('ok-msg','ok','No hay vencimientos prÃ³ximos para alertar.'); return; }
   var htmlBody = '<h2>Alertas de Vencimientos - M3 Flota</h2><ul>';
   vencs.forEach(function(v){
     htmlBody += '<li><strong>'+v.cam+'</strong> - '+v.tipo+': '+fmtFecha(v.fecha)+' ('+v.dias+' dÃ­as)</li>';
   });
   htmlBody += '</ul>';
   try {
     if (EMAIL_PUBLIC_KEY === 'user_xxx') {
       alert('Configurar EmailJS: SERVICE_ID, TEMPLATE_ID y PUBLIC_KEY en app.js');
       return;
     }
     var res = await fetch(EMAIL_ENDPOINT, {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({
         service_id: EMAIL_SERVICE_ID,
         template_id: EMAIL_TEMPLATE_ID,
         user_id: EMAIL_PUBLIC_KEY,
         template_params: {
           to_email: 'm3.monteverdi@gmail.com',
           subject: 'Alertas de Vencimientos - M3 Flota',
           html_body: htmlBody
         }
       })
     });
     if (res.ok) showMsg('ok-msg','ok','Alertas enviadas a m3.monteverdi@gmail.com');
     else showMsg('err-msg','err','Error enviando email');
   } catch(e) {
     showMsg('err-msg','err','Error: '+e.message);
   }
 }

/* ============ CONFIG ============ */
async function loadConfig() {
  await loadmaquinarias(); await loadChoferes();
  var html = '';
  for (var i = 0; i < maquinarias.length; i++) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EEF4FF;font-size:14px">';
    html += '<span><strong>'+maquinarias[i].id+'</strong> - '+maquinarias[i].modelo+'</span>';
    html += '<button class="bd" onclick="delCamion(\''+maquinarias[i].id+'\')"><i class="ti ti-trash"></i></button></div>';
  }
  document.getElementById('lista-maquinarias').innerHTML = html;
  var html2 = '';
  for (var i = 0; i < choferes.length; i++) {
    html2 += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EEF4FF;font-size:14px">';
    html2 += '<span>'+choferes[i].nombre+'</span>';
    html2 += '<button class="bd" onclick="delChofer('+choferes[i].id+')"><i class="ti ti-trash"></i></button></div>';
  }
  document.getElementById('lista-choferes').innerHTML = html2;
}

async function addCamion() {
  var id = document.getElementById('nc-id').value.trim();
  var mod = document.getElementById('nc-mod').value.trim();
  if (!id || !mod) return;
  var data = {id:id,modelo:mod};
  if (!isOnline) {
    addOfflineOp({type:'insert_camion', data:data, timestamp:Date.now()});
    resData.push({id:id,nom:mod.toUpperCase(),pat:'---',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'});
    saveRes(resData);
    document.getElementById('nc-id').value = '';
    document.getElementById('nc-mod').value = '';
    await loadmaquinarias(); loadConfig();
    showMsg('ok-msg','ok','Sin conexion. Camion guardado localmente.');
    return;
  }
  var r = await sb.from('maquinarias').insert([data]);
  if (r.error) {
    if (r.error.message && r.error.message.indexOf('Failed to fetch') >= 0) {
      addOfflineOp({type:'insert_camion', data:data, timestamp:Date.now()});
      resData.push({id:id,nom:mod.toUpperCase(),pat:'---',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'});
      saveRes(resData);
      document.getElementById('nc-id').value = '';
      document.getElementById('nc-mod').value = '';
      await loadmaquinarias(); loadConfig();
      showMsg('ok-msg','ok','Sin conexion. Camion guardado localmente.');
      return;
    }
    alert('Error: '+r.error.message); return;
  }
  resData.push({id:id,nom:mod.toUpperCase(),pat:'---',cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'});
  saveRes(resData);
  document.getElementById('nc-id').value = '';
  document.getElementById('nc-mod').value = '';
  await loadmaquinarias(); loadConfig();
}
async function addChofer() {};
  if (!isOnline) {
    addOfflineOp({type:'insert_chofer', data:data, timestamp:Date.now()});
    document.getElementById('nc-cho').value = '';
    await loadChoferes(); loadConfig();
    showMsg('ok-msg','ok','Sin conexion. Chofer guardado localmente.');
    return;
  }
  var r = await sb.from('choferes').insert([data]);
  if (r.error) {
    if (r.error.message && r.error.message.indexOf('Failed to fetch') >= 0) {
      addOfflineOp({type:'insert_chofer', data:data, timestamp:Date.now()});
      document.getElementById('nc-cho').value = '';
      await loadChoferes(); loadConfig();
      showMsg('ok-msg','ok','Sin conexion. Chofer guardado localmente.');
      return;
    }
    alert('Error: '+r.error.message); return;
  }
  document.getElementById('nc-cho').value = '';
  await loadChoferes(); loadConfig();
}
async function delCamion(id) {
    if (!confirm('Eliminar camion '+id+'?')) return;
    if (!isOnline) {
      addOfflineOp({type:'delete_camion', data:id, timestamp:Date.now()});
      resData = resData.filter(function(c){return c.id!==id;});
      saveRes(resData);
      await loadmaquinarias(); loadConfig();
      showMsg('ok-msg','ok','Sin conexion. Camion eliminado localmente.');
      return;
    }
    await sb.from('maquinarias').delete().eq('id',id);
    resData = resData.filter(function(c){return c.id!==id;});
    saveRes(resData);
    await loadmaquinarias(); loadConfig();
  }
async function delChofer(id) {
  if (!confirm('Eliminar este chofer?')) return;
  if (!isOnline) {
    addOfflineOp({type:'delete_chofer', data:id, timestamp:Date.now()});
    await loadChoferes(); loadConfig();
    showMsg('ok-msg','ok','Sin conexion. Chofer eliminado localmente.');
    return;
  }
  await sb.from('choferes').delete().eq('id',id);
  await loadChoferes(); loadConfig();
}

/* ============ INFORME EXCEL COMPLETO ============ */
 async function exportExcel() {
    if (!adminOk) { alert('Necesitas clave de administrador para generar informes.'); return; }
    var btn = document.getElementById('btn-export');
   btn.innerHTML = '<i class="ti ti-loader"></i> Generando...';
   btn.disabled = true;
   try {
     var r1;
     try { r1 = await sb.from('reportes').select('*').order('fecha',{ascending:false}); }
     catch(e) { console.warn('Usando cache local para exportar:', e); r1 = {data: allReportes}; }
     var reps = r1.data || [];
    var wb = XLSX.utils.book_new();
    var fechaHoy = new Date().toLocaleDateString('es-AR');

    /* HOJA 1: RESUMEN GENERAL */
    var totalCam = resData.length;
    var op = resData.filter(function(c){return c.est==='DISPONIBLE';}).length;
    var rep = totalCam - op;
    var totalReps = reps.length;
    var totalFallas = reps.filter(function(r){return r.tipo==='falla';}).length;
    var totalOTabiertas = reps.filter(function(r){return r.es_ot;}).length;

    var resumenRows = [
      ['INFORME DE FLOTA - M3 MONTEVERDI CUBICO'],
      ['Generado el', fechaHoy],
      [],
      ['RESUMEN GENERAL'],
      ['Total de unidades', totalCam],
      ['Operativas', op],
      ['En reparacion', rep],
      ['Total de reportes', totalReps],
      ['Total de fallas reportadas', totalFallas],
      ['Ordenes de trabajo generadas', totalOTabiertas],
      ['Camion','Modelo','Chofer','Estado','RTO Vence','Seguro Hasta','Ult. Service','Ult. Engrase']
    ];
    for (var i=0;i<resData.length;i++) {
      var c = resData[i];
      resumenRows.push([c.id, c.nom, c.cho, c.est==='DISPONIBLE'?'Operativo':'En reparacion', c.rto, c.seg, c.us, c.ue]);
    }
    var wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
    wsResumen['!cols'] = [{wch:20},{wch:22},{wch:18},{wch:16},{wch:14},{wch:14},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

    /* HOJA 2: OT ABIERTAS */
    var otAbiertas = reps.filter(function(r){return r.es_ot;});
    var rowsOTA = [['OT','Fecha','Camion','Chofer','Urgencia','Descripcion','Km','Repuestos Estimados']];
    for (var i=0;i<otAbiertas.length;i++) {
      var x = otAbiertas[i];
      rowsOTA.push([x.id, x.fecha, x.camion, x.chofer||'', x.urgencia||'', x.descripcion||'', x.km||'', x.repuestos||'']);
    }
    var wsOTA = XLSX.utils.aoa_to_sheet(rowsOTA);
    wsOTA['!cols'] = [{wch:10},{wch:12},{wch:10},{wch:18},{wch:10},{wch:50},{wch:10},{wch:30},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsOTA, 'OT Abiertas');

    /* HOJA 3: REPARACIONES (cierres de OT) */
    var reparaciones = reps.filter(function(r){return r.tipo==='reparacion';});
    var rowsRep = [['Fecha','Camion','OT relacionada','Chofer','Descripcion','Repuestos']];
    for (var i=0;i<reparaciones.length;i++) {
      var x = reparaciones[i];
      var otMatch = (x.descripcion||'').match(/\[OT:([^\]]+)\]/);
      var otRef = otMatch ? otMatch[1] : '';
      rowsRep.push([x.fecha, x.camion, otRef, x.chofer||'', x.descripcion||'', x.repuestos||'']);
    }
    var wsRep = XLSX.utils.aoa_to_sheet(rowsRep);
    wsRep['!cols'] = [{wch:12},{wch:10},{wch:14},{wch:18},{wch:50},{wch:30},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsRep, 'Reparaciones');

    /* HOJA 4: SERVICIOS Y PREVENTIVOS */
    var servicios = reps.filter(function(r){return r.tipo==='service'||r.tipo==='preventivo'||r.tipo==='engrase'||r.tipo==='neumatico';});
    var rowsServ = [['Fecha','Camion','Tipo','Chofer','Descripcion','Km']];
    for (var i=0;i<servicios.length;i++) {
      var x = servicios[i];
      rowsServ.push([x.fecha, x.camion, x.tipo, x.chofer||'', x.descripcion||'', x.km||'']);
    }
    var wsServ = XLSX.utils.aoa_to_sheet(rowsServ);
    wsServ['!cols'] = [{wch:12},{wch:10},{wch:12},{wch:18},{wch:50},{wch:10},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsServ, 'Servicios y Preventivos');

    /* HOJA 5: VENCIMIENTOS */
    var rowsVenc = [['Camion','Tipo','Fecha','Dias restantes','Estado']];
    for (var i=0;i<resData.length;i++) {
      var c = resData[i];
      ['rto','seg'].forEach(function(k){
        var d = diasHasta(c[k]);
        if (d !== null) {
          var estadoTxt = d < 0 ? 'VENCIDO' : (d < 10 ? 'Urgente (10d)' : (d < 30 ? 'Proximo' : 'OK'));
          rowsVenc.push([c.id, k==='rto'?'RTO':'Seguro', c[k], d, estadoTxt]);
        }
      });
    }
    var wsVenc = XLSX.utils.aoa_to_sheet(rowsVenc);
    wsVenc['!cols'] = [{wch:10},{wch:10},{wch:14},{wch:14},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsVenc, 'Vencimientos');

    /* HOJAS POR CAMION */
    var todosIds = []; for (var i=0;i<maquinarias.length;i++) todosIds.push(maquinarias[i].id);
    var sinCamion = [];
    for (var i=0;i<reps.length;i++) { if (todosIds.indexOf(reps[i].camion)===-1 && sinCamion.indexOf(reps[i].camion)===-1) sinCamion.push(reps[i].camion); }
    var allIds = todosIds.concat(sinCamion);
    for (var ci=0;ci<allIds.length;ci++) {
      var camId = allIds[ci];
      var camReps = reps.filter(function(x){return x.camion===camId;});
      if (!camReps.length) continue;
      var camMod = getCamModelo(camId);
      var rows = [['Fecha','Tipo','Descripcion','Km','Chofer','Urgencia','Repuestos','OT']];
      for (var ri=0;ri<camReps.length;ri++) {
        var x = camReps[ri];
        rows.push([x.fecha,x.tipo,x.descripcion||'',x.km||'',x.chofer||'',x.urgencia||'',x.repuestos||'',x.es_ot?x.id:'']);
      }
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{wch:12},{wch:12},{wch:50},{wch:10},{wch:18},{wch:10},{wch:30},{wch:10}];
      var sheetName = (camId+' '+camMod).substring(0,31).replace(/[\/\\?*\[\]:]/g,'');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    var fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, 'M3_Informe_Flota_'+fecha+'.xlsx');
    btn.innerHTML = '<i class="ti ti-check"></i> Informe descargado!';
    setTimeout(function() { btn.innerHTML = '<i class="ti ti-file-spreadsheet"></i> Generar informe Excel'; btn.disabled = false; }, 3000);
  } catch(e) {
    btn.innerHTML = '<i class="ti ti-alert-circle"></i> Error al generar';
    btn.disabled = false;
    console.error(e);
  }
}

function showQR() {
  var modal = document.getElementById('qr-modal');
  var canvas = document.getElementById('qr-canvas');
  var camIdEl = document.getElementById('qr-cam-id');
  var url = window.location.origin + window.location.pathname + '?tab=nuevo';
  camIdEl.textContent = 'Escanear para reportar';
  modal.style.display = 'flex';
  document.getElementById('qr-print-area').innerHTML = '';
  canvas.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, url, { width: 256, margin: 2 }, function(error) {
      if (error) console.error(error);
    });
  }
}

function initQRFlota() {
  var cont = document.getElementById('qr-flota-canvas');
  if (!cont) return;
  var url = window.location.origin + window.location.pathname + '?tab=nuevo';
  cont.innerHTML = '<img src="https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=' + encodeURIComponent(url) + '&choe=UTF-8" style="background:#fff;padding:8px;border-radius:8px" alt="QR">';
}

function closeQR() {
  document.getElementById('qr-modal').style.display = 'none';
}

function printQR() {
  window.print();
}

function goToFlota() {
  document.getElementById('pane-detalle').classList.remove('on');
  document.getElementById('pane-flota').classList.add('on');
  document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('on'); });
  document.querySelectorAll('.tab')[0].classList.add('on');
}

var editCamionId = null;
function openEdit(id) {
  if (!adminOk) { alert('Necesitas clave de administrador.'); return; }
  editCamionId = id;
  var c = getCam(id);
  var html = '<div class="g2"><div class="field"><label>Modelo</label><input type="text" id="ed-mod" value="'+(c.nom||'')+'"></div>';
  html += '<div class="field"><label>Patente</label><input type="text" id="ed-pat" value="'+(c.pat||'')+'"></div>';
  html += '<div class="field"><label>Chofer</label><input type="text" id="ed-cho" value="'+(c.cho||'')+'"></div>';
  html += '<div class="field"><label>Capacidad</label><input type="text" id="ed-cap" value="'+(c.cap||'')+'"></div>';
  html += '<div class="field"><label>Estado</label><select id="ed-est"><option value="DISPONIBLE">Operativo</option><option value="REPARACION">En reparacion</option></select></div>';
  html += '<div class="field"><label>RTO</label><input type="text" id="ed-rto" value="'+(c.rto||'')+'"></div>';
  html += '<div class="field"><label>Seguro</label><input type="text" id="ed-seg" value="'+(c.seg||'')+'"></div>';
  html += '<div class="field"><label>Ultimo service</label><input type="text" id="ed-us" value="'+(c.us||'')+'"></div>';
  html += '<div class="field"><label>Prox. service</label><input type="text" id="ed-ps" value="'+(c.ps||'')+'"></div>';
  html += '<div class="field"><label>Ultimo engrase</label><input type="text" id="ed-ue" value="'+(c.ue||'')+'"></div>';
  html += '<div class="field"><label>Prox. engrase</label><input type="text" id="ed-pe" value="'+(c.pe||'')+'"></div>';
  html += '<div class="field"><label>Ult. cubiertas</label><input type="text" id="ed-uc" value="'+(c.uc||'')+'"></div>';
  html += '<div class="field"><label>Prox. cubiertas</label><input type="text" id="ed-pc" value="'+(c.pc||'')+'"></div>';
  html += '<div class="field"><label>Ult. bateria</label><input type="text" id="ed-ub" value="'+(c.ub||'')+'"></div>';
  html += '<div class="field"><label>Prox. bateria</label><input type="text" id="ed-pb" value="'+(c.pb||'')+'"></div></div>';
  document.getElementById('ed-est').value = c.est || 'DISPONIBLE';
  document.getElementById('edit-form').innerHTML = html;
  document.getElementById('edit-modal').style.display = 'flex';
}
function closeEdit() {
  document.getElementById('edit-modal').style.display = 'none';
  editCamionId = null;
}
async function saveEditCamion() {
  if (!editCamionId || !adminOk) return;
  var c = getCam(editCamionId);
  if (!c) return;
  c.nom = document.getElementById('ed-mod').value.trim() || c.nom;
  c.pat = document.getElementById('ed-pat').value.trim() || '---';
  c.cho = document.getElementById('ed-cho').value.trim() || '---';
  c.cap = document.getElementById('ed-cap').value.trim() || '---';
  c.est = document.getElementById('ed-est').value;
  c.rto = document.getElementById('ed-rto').value.trim() || '---';
  c.seg = document.getElementById('ed-seg').value.trim() || '---';
  c.us = document.getElementById('ed-us').value.trim() || '---';
  c.ps = document.getElementById('ed-ps').value.trim() || '---';
  c.ue = document.getElementById('ed-ue').value.trim() || '---';
  c.pe = document.getElementById('ed-pe').value.trim() || '---';
  c.uc = document.getElementById('ed-uc').value.trim() || '---';
  c.pc = document.getElementById('ed-pc').value.trim() || '---';
  c.ub = document.getElementById('ed-ub').value.trim() || '---';
  c.pb = document.getElementById('ed-pb').value.trim() || '---';
  saveRes(resData);
  closeEdit();
  renderFlota();
  showMsg('ok-msg','ok','Datos del camion actualizados.');
}

function toggleFlota() {
  flotaExpandida = !flotaExpandida;
  renderFlota();
}

var GPS_MAP = {
  'Hidrogrua': '107',
  '99': '109',
  'Isuzu': '116',
  'Mercedes Accelo': '115',
  'Toyota Hilux': 'HILUX',
  'Mercedes Hidro': '107',
  'Iveco Cursor': '109',
  'Iveco Trakker 350': '100',
  'Iveco Tector Attack': '101',
  'Scania P380': '102',
  'Scania P420': '104',
  'Scania 380': '105',
  'Iveco Trakker 380': '108',
  'Iveco Trakker 410': '110',
  'Ford Cargo': '113',
  'Iveco Tector Bomba': '114',
  'Cat Cargadora': '918',
  'Dimex': '106',
  'Carreton': 'CARR',
  'Semi': 'SEMI'
};

function normalizarNombrePestana(nombre) {
  if (!nombre) return null;
  var n = nombre.toLowerCase().trim();
  if (n.indexOf('hidro') >= 0 || n.indexOf('107') >= 0) return '107';
  if (n.indexOf('99') >= 0 || n.indexOf('bomba') >= 0 || n.indexOf('tector bomba') >= 0 || n.indexOf('114') >= 0) return '114';
  if (n.indexOf('cursor') >= 0 || n.indexOf('iveco cursor') >= 0 || n.indexOf('109') >= 0) return '109';
  if (n.indexOf('accelo') >= 0 || n.indexOf('acelo') >= 0 || n.indexOf('115') >= 0) return '115';
  if (n.indexOf('hilux') >= 0 || n.indexOf('toyota') >= 0) return 'HILUX';
  if (n.indexOf('isuzu') >= 0 || n.indexOf('npr') >= 0 || n.indexOf('npr75') >= 0 || n.indexOf('116') >= 0 || n.indexOf('isuzu npr') >= 0) return '116';
  if (n.indexOf('trakker 350') >= 0 || n.indexOf('100') >= 0) return '100';
  if (n.indexOf('tector attack') >= 0 || n.indexOf('101') >= 0 || n.indexOf('ag-160') >= 0) return '101';
  if (n.indexOf('scania p380') >= 0 || n.indexOf('p380') >= 0 || n.indexOf('102') >= 0) return '102';
  if (n.indexOf('scania p420') >= 0 || n.indexOf('p420') >= 0 || n.indexOf('104') >= 0) return '104';
  if (n.indexOf('scania 380') >= 0 || n.indexOf('105') >= 0) return '105';
  if (n.indexOf('trakker 380') >= 0 || n.indexOf('108') >= 0) return '108';
  if (n.indexOf('trakker 410') >= 0 || n.indexOf('110') >= 0) return '110';
  if (n.indexOf('ford') >= 0 || n.indexOf('cargo') >= 0 || n.indexOf('113') >= 0) return '113';
  if (n.indexOf('tector bomba') >= 0 || n.indexOf('bomba') >= 0 || n.indexOf('114') >= 0) return '114';
  if (n.indexOf('cat') >= 0 || n.indexOf('cargadora') >= 0 || n.indexOf('918') >= 0) return '918';
  if (n.indexOf('dimex') >= 0 || n.indexOf('106') >= 0 || n.indexOf('cms120') >= 0) return '106';
  if (n.indexOf('carreton') >= 0 || n.indexOf('carretÃ³n') >= 0 || n.indexOf('ecomec') >= 0) return 'CARR';
  if (n.indexOf('semi') >= 0 || n.indexOf('semirremolque') >= 0 || n.indexOf('gomatro') >= 0) return 'SEMI';
  return null;
}

async function importGPS(input) {
  var file = input.files[0];
  if (!file) return;
  var statusEl = document.getElementById('gps-status');
  statusEl.innerHTML = '<i class="ti ti-loader"></i> Procesando...';
  try {
    var data = await file.arrayBuffer();
    var wb = XLSX.read(data, {type:'array'});
    var viajesNuevos = [];
    var insertados = 0;
    var duplicados = 0;
    var errores = 0;
    var localRaw = localStorage.getItem('m3v7_gps_viajes');
    var gpsExistentes = [];
    if (localRaw) { try { gpsExistentes = JSON.parse(localRaw); } catch(e) {} }
    var pestaÃ±asEncontradas = [];
    var pestaÃ±asIgnoradas = [];
    for (var s=0; s<wb.SheetNames.length; s++) {
      var sheetName = wb.SheetNames[s];
      var camionId = normalizarNombrePestana(sheetName);
      if (!camionId) { pestaÃ±asIgnoradas.push(sheetName); continue; }
      pestaÃ±asEncontradas.push(sheetName);
      var ws = wb.Sheets[sheetName];
      var allRows = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
      if (!allRows || allRows.length < 3) { errores++; continue; }
      var headerIdx = -1;
      for (var h=0; h<allRows.length; h++) {
        var hr = allRows[h];
        if (hr && hr.length >= 10 && typeof hr[3] === 'string' && hr[3].toLowerCase().indexOf('comienzo') >= 0) {
          headerIdx = h; break;
        }
      }
      if (headerIdx < 0) { errores++; continue; }
      var dataRows = allRows.slice(headerIdx + 1);
      for (var i=0; i<dataRows.length; i++) {
        var row = dataRows[i];
        if (!row) continue;
        var viajesVal = parseFloat(row[1]) || 0;
        var kmFinRaw = row[9];
        var kmFin = parseFloat(String(kmFinRaw).replace(/[^\d.]/g,'')) || 0;
        var kmInicioRaw = row[6];
        var kmInicio = parseFloat(String(kmInicioRaw).replace(/[^\d.]/g,'')) || 0;
        var kmRec = kmFin - kmInicio;
        if (kmRec < 0) kmRec = kmFin;
        var fechaRaw = row[3] || row[4] || row[5];
        var fecha = null;
        if (fechaRaw) {
          if (typeof fechaRaw === 'number') {
            try { var d = XLSX.SSF.parse_date_code(fechaRaw); fecha = d.y+'-'+String(d.m).padStart(2,'0')+'-'+String(d.d).padStart(2,'0'); } catch(e) {}
          } else {
            var fStr = String(fechaRaw).trim().split(' ')[0];
            var m = fStr.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
            if (m) {
              var parts = m[0].split(/[\/\-]/);
              if (parts[0].length === 4) fecha = parts[0]+'-'+parts[1].padStart(2,'0')+'-'+parts[2].padStart(2,'0');
              else fecha = parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0');
            }
          }
        }
        if (!fecha || !kmFin) continue;
        var key = camionId+'|'+fecha;
        var yaExiste = gpsExistentes.some(function(g){ return g.camion===camionId && g.fecha===fecha; });
        if (yaExiste) { duplicados++; continue; }
        viajesNuevos.push({ camion: camionId, fecha: fecha, viajes: viajesVal, km_inicio: kmInicio, km_fin: kmFin, km_recorridos: kmRec });
        gpsExistentes.push(viajesNuevos[viajesNuevos.length-1]);
        insertados++;
      }
    }
    if (viajesNuevos.length > 0) {
      var local = JSON.parse(localStorage.getItem('m3v7_gps_viajes') || '[]');
      var localMap = {};
      for (var l=0; l<local.length; l++) localMap[local[l].camion+'|'+local[l].fecha] = local[l];
      for (var vn=0; vn<viajesNuevos.length; vn++) localMap[viajesNuevos[vn].camion+'|'+viajesNuevos[vn].fecha] = viajesNuevos[vn];
      localStorage.setItem('m3v7_gps_viajes', JSON.stringify(Object.keys(localMap).map(function(k){ return localMap[k]; })));
    }
    statusEl.innerHTML = '<i class="ti ti-check" style="color:var(--grn)"></i> Cargados: '+insertados+' | Duplicados: '+duplicados+' | Errores: '+errores;
    setTimeout(function(){ statusEl.innerHTML = ''; }, 6000);
  } catch(e) {
    statusEl.innerHTML = '<i class="ti ti-alert-circle" style="color:var(--red)"></i> Error al procesar archivo.';
  }
  input.value = '';
}

async function importMaquinas(input) {
  var file = input.files[0];
  if (!file) return;
  var statusEl = document.getElementById('maq-status');
  if (!statusEl) return;
  statusEl.innerHTML = '<i class="ti ti-loader"></i> Procesando Excel de mÃ¡quinas...';
  try {
    var data = await file.arrayBuffer();
    var wb = XLSX.read(data, {type:'array'});
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
    if (!rows || rows.length < 2) { statusEl.innerHTML = '<i class="ti ti-alert-circle" style="color:var(--red)"></i> El archivo estÃ¡ vacÃ­o o no tiene datos.'; return; }
    var nuevos = 0;
    var existentes = 0;
    var errores = 0;
    for (var i=1; i<rows.length; i++) {
      var row = rows[i];
      if (!row || !row.length) continue;
      var id = (row[0] || '').toString().trim().toUpperCase();
      var nom = (row[1] || '').toString().trim().toUpperCase();
      var marca = (row[2] || '').toString().trim() || '---';
      var modelo = (row[3] || '').toString().trim() || '---';
      if (!id || !nom) { errores++; continue; }
      var existe = false;
      for (var j=0; j<resData.length; j++) { if (resData[j].id === id) { existe = true; break; } }
      if (existe) { existentes++; continue; }
      resData.push({id:id,nom:nom,pat:id,cho:'---',cap:'---',est:'DISPONIBLE',seg:'---',rto:'---',us:'---',ps:'---',ue:'---',pe:'---',uc:'---',pc:'---',ub:'---',pb:'---'});
      if (sb && isOnline) {
        await sb.from('maquinarias').insert([{id:id,modelo:nom,marca:marca,modelo_equipo:modelo}]).catch(function(){});
      }
      nuevos++;
    }
    saveRes(resData);
    await loadmaquinarias();
    statusEl.innerHTML = '<i class="ti ti-check" style="color:var(--grn)"></i> Importados: '+nuevos+' | Ya existÃ­an: '+existentes+' | Errores: '+errores;
    setTimeout(function(){ if (statusEl) statusEl.innerHTML = ''; }, 6000);
  } catch(e) {
    statusEl.innerHTML = '<i class="ti ti-alert-circle" style="color:var(--red)"></i> Error: '+e.message;
  }
  input.value = '';
}

renderFlota();

async function renderGPSDash() {
  try {
    var tabla = document.getElementById('d-km-table');
    if (!tabla) return;
    tabla.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:1rem"><i class="ti ti-loader"></i> Cargando km...</p>';
    var viajes = [];
    try {
      var localRaw = localStorage.getItem('m3v7_gps_viajes');
      if (localRaw) {
        viajes = JSON.parse(localRaw);
      }
    } catch(e) {
      console.warn('Error leyendo localStorage GPS:', e);
    }
    if (!viajes || !viajes.length) {
      tabla.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:1rem">Sin datos GPS. SubÃ­ el Excel desde el botÃ³n azul.</p>';
      return;
    }
    viajes = viajes.slice(0, 200);
    var hoy = new Date();
    var fechasSemana = [];
    var lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay()+6)%7));
    for (var i=0;i<7;i++) {
      var d = new Date(lunes);
      d.setDate(lunes.getDate()+i);
      fechasSemana.push(d.toISOString().split('T')[0]);
    }
    var mesActual = hoy.toISOString().substring(0,7);
    var porCamion = {};
    for (var v=0; v<viajes.length; v++) {
      var x = viajes[v];
      if (!x.camion || !x.fecha) continue;
      if (!porCamion[x.camion]) porCamion[x.camion] = { semana:[0,0,0,0,0,0,0], mes:0 };
      var idx = fechasSemana.indexOf(x.fecha);
      if (idx >= 0) porCamion[x.camion].semana[idx] = x.km_recorridos || 0;
      if (x.fecha.substring(0,7) === mesActual) porCamion[x.camion].mes += (x.km_recorridos || 0);
    }
    var html = '<div class="km-table-wrap"><table class="km-table">';
    html += '<thead><tr>';
    html += '<th>Camion</th><th>Lun</th><th>Mar</th><th>Mie</th><th>Jue</th><th>Vie</th><th>Sab</th><th>Dom</th>';
    html += '<th class="km-mes-col">Mes</th></tr></thead><tbody>';
    for (var c=0; c<resData.length; c++) {
      var cam = resData[c];
      if (!maquinariaVisible(cam)) continue;
      var d = porCamion[cam.id] || {semana:[0,0,0,0,0,0,0],mes:0};
      var rowBg = cam.est==='REPARACION' ? 'km-reparacion' : '';
      html += '<tr class="'+rowBg+'" onclick="abrirDetalle(\''+cam.id+'\')">';
      html += '<td>'+cam.id+' <span style="font-weight:400;color:var(--muted);font-size:11px">'+(cam.nom||'')+'</span></td>';
      for (var i=0;i<7;i++) {
        html += '<td>'+(d.semana[i] ? '<span style="font-weight:700;color:var(--az)">'+d.semana[i].toLocaleString('es-AR')+'</span>' : '<span style="color:var(--muted)">-</span>')+'</td>';
      }
      html += '<td class="km-mes-col">'+(d.mes ? d.mes.toLocaleString('es-AR') : '-')+'</td>';
      html += '</tr>';
    }
    var idsPendientes = [];
    if (porCamion && typeof porCamion === 'object') {
      idsPendientes = Object.keys(porCamion).filter(function(id) { return !resData.some(function(c){ return c.id===id && maquinariaVisible(c); }); });
    }
    for (var p=0; p<idsPendientes.length; p++) {
      var pid = idsPendientes[p];
      var d = porCamion[pid];
      html += '<tr class="km-pendiente" onclick="alert(\'CamiÃ³n no configurado en la flota: '+pid+'\\nAgregalo en Config para ver detalles.\')">';
      html += '<td>'+pid+' <span style="font-weight:400;color:var(--org);font-size:11px">(sin configurar)</span></td>';
      for (var i=0;i<7;i++) {
        html += '<td>'+(d.semana[i] ? '<span style="font-weight:700;color:var(--az)">'+d.semana[i].toLocaleString('es-AR')+'</span>' : '<span style="color:var(--muted)">-</span>')+'</td>';
      }
      html += '<td class="km-mes-col">'+(d.mes ? d.mes.toLocaleString('es-AR') : '-')+'</td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<p style="font-size:11px;color:var(--muted);margin-top:10px;text-align:right"><i class="ti ti-info-circle"></i> Semana '+fechasSemana[0]+' al '+fechasSemana[6]+' | Mes: '+mesActual+'</p>';
    tabla.innerHTML = html;
  } catch(e) {
    console.error('Error dashboard GPS:', e);
    var tabla = document.getElementById('d-km-table');
    if (tabla) tabla.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:1rem">Error al cargar GPS.</p>';
  }
}

init();





