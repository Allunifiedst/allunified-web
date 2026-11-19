/* ACMA v1.1 — ALLUNIFIED Cyber Maturity Assessment
 * Todo el cálculo ocurre en el navegador. No se envía ni se almacena información.
 */
(function () {
  'use strict';

  const DOMAINS = JSON.parse(document.getElementById('domainsData').textContent);
  const SCALE = JSON.parse(document.getElementById('scaleData').textContent);
  const NA = 'na';
  const TOTAL_STEPS = DOMAINS.length + 2; // datos + dominios + revisión
  const LAST_STEP = TOTAL_STEPS - 1;

  // Umbrales del reporte (0-100)
  const STRENGTH_MIN = 60;   // a partir de aquí se considera fortaleza
  const WEAK_MAX = 50;       // por debajo se considera debilidad
  const CRITICAL_MAX = 35;   // por debajo, prioridad crítica

  let step = 0;
  let consent = false;
  const answers = {};
  DOMAINS.forEach(d => {
    d.questions.forEach(q => { q.weight = Number(q.weight || 1); });
    answers[d.id] = Array(d.questions.length).fill(null);
  });
  const company = { name: '', sector: 'PyME', owner: '', email: '', size: '1-50 empleados', critical: 'Operación normal' };

  const guidance = {
    govern: ['La organización demuestra una base adecuada de gobierno y supervisión ejecutiva sobre riesgos de ciberseguridad.', 'Requiere fortalecer dirección, responsabilidades, políticas, indicadores y seguimiento ejecutivo.', 'Riesgo de decisiones reactivas, falta de presupuesto y ausencia de responsables claros.', 'Formalizar comité, responsable, políticas e indicadores ejecutivos.'],
    identify: ['Existe visibilidad razonable sobre activos, proveedores, información y dependencias críticas.', 'La visibilidad sobre activos, información, proveedores, cloud u OT es limitada.', 'Riesgo de activos desconocidos, shadow IT y exposición no identificada.', 'Actualizar inventario de activos, cloud, proveedores y servicios críticos.'],
    protect: ['Los controles preventivos muestran avances en accesos, respaldos, endpoints y configuración segura.', 'Los controles preventivos requieren refuerzo en MFA, respaldos, hardening, segmentación y privilegios.', 'Mayor probabilidad de accesos no autorizados, ransomware y errores humanos.', 'Implementar MFA, hardening, respaldos protegidos y privilegio mínimo.'],
    detect: ['Cuenta con capacidades de monitoreo y detección que permiten identificar eventos relevantes.', 'La capacidad de detección es limitada por falta de logs, SIEM/XDR, alertas o monitoreo de vulnerabilidades.', 'Riesgo de detectar incidentes tarde, perder evidencia y permitir movimiento lateral.', 'Centralizar logs, definir alertas, escanear vulnerabilidades y evaluar SIEM/XDR.'],
    respond: ['Existen elementos para coordinar respuesta a incidentes, roles, comunicación y aprendizaje.', 'Requiere formalizar planes, roles, ejercicios, comunicación, contención y lecciones aprendidas.', 'Riesgo de improvisación, tiempos mayores de contención e impacto reputacional.', 'Documentar plan de respuesta a incidentes, matriz de comunicación y ejecutar ejercicios tabletop.'],
    recover: ['Cuenta con bases de continuidad, recuperación y resiliencia para restaurar servicios críticos.', 'Requiere fortalecer DRP, BCP, pruebas, RTO/RPO, respaldos protegidos y continuidad.', 'Riesgo de interrupciones prolongadas, pérdida de información crítica e incapacidad operativa.', 'Definir RTO/RPO, probar respaldos, actualizar DRP/BCP y resiliencia anti-ransomware.']
  };

  // Mismos nombres de servicio que la página principal
  const serviceMap = {
    govern: ['GRC & AI Governance', 'Gobierno, riesgo y cumplimiento con ISO 27001, ISO 37301 e ISO 42001.'],
    identify: ['IT Infrastructure Assessment', 'Diagnóstico de red, servidores, nube, operación, riesgos y continuidad.'],
    protect: ['Cybersecurity Executive Assessment', 'Evaluación ejecutiva de controles, exposición y roadmap alineado a NIST e ISO 27001.'],
    detect: ['Managed IT & Security Services', 'Soporte operativo, monitoreo, hardening, continuidad y mejora continua.'],
    respond: ['Cybersecurity Executive Assessment', 'Plan de respuesta a incidentes, roles, comunicación y ejercicios.'],
    recover: ['IT Infrastructure Assessment', 'Continuidad, recuperación ante desastres y respaldos protegidos.']
  };

  const roadmapMap = {
    govern: ['Formalizar responsable, comité, política y KPIs.', 'Definir presupuesto, reporte ejecutivo y gestión de proveedores.', 'Institucionalizar el gobierno de riesgo tecnológico.', 'Alinear el programa a ISO 27001/NIST.'],
    identify: ['Actualizar inventario de activos, software, cloud y proveedores.', 'Clasificar información y mapear servicios críticos.', 'Incorporar inventario OT y dependencias.', 'Automatizar inventarios y gestión de riesgos.'],
    protect: ['Implementar MFA en cuentas críticas.', 'Revisar respaldos, hardening, privilegios y endpoint.', 'Segmentar redes críticas y fortalecer concientización.', 'Evolucionar hacia Zero Trust.'],
    detect: ['Centralizar logs críticos.', 'Implementar escaneo de vulnerabilidades y monitoreo.', 'Evaluar SIEM/XDR/SOC administrado.', 'Integrar inteligencia de amenazas y monitoreo OT.'],
    respond: ['Documentar el plan de respuesta a incidentes.', 'Diseñar matriz de comunicación y playbooks.', 'Ejecutar un ejercicio tabletop con Dirección y TI.', 'Madurar el CSIRT y la gestión de crisis.'],
    recover: ['Definir RTO/RPO y servicios críticos.', 'Probar respaldos y actualizar DRP/BCP.', 'Agregar respaldos inmutables u offline.', 'Establecer un programa de resiliencia.']
  };

  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function option(value, label, selected) {
    return `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;
  }

  function selectOptions(list, current) {
    return list.map(v => option(v, v, v === current)).join('');
  }

  function renderDomainCards() {
    $('domainCards').innerHTML = DOMAINS.map(d =>
      `<article class="domain-card"><div class="domain-icon">${esc(d.name.substring(0, 2).toUpperCase())}</div><h3>${esc(d.label)}</h3><div class="domain-en">${esc(d.name)}</div><p>${esc(d.summary)}</p></article>`
    ).join('');
  }

  function setError(message) {
    const box = $('wizardError');
    box.textContent = message || '';
    box.hidden = !message;
  }

  function renderStep() {
    setError('');
    const pct = Math.round(step / LAST_STEP * 100);
    $('progressFill').style.width = pct + '%';
    $('stepPercent').textContent = pct + '%';
    $('stepEyebrow').textContent = `Paso ${step + 1} de ${TOTAL_STEPS}`;
    const content = $('wizardContent');

    if (step === 0) {
      $('stepTitle').textContent = 'Información de la empresa';
      $('stepSub').textContent = 'Datos básicos para personalizar el dashboard y el PDF. Son opcionales y no salen de su navegador.';
      content.innerHTML = `<div class="form-grid">
        <div class="field"><label for="companyName">Empresa</label><input id="companyName" maxlength="120" autocomplete="organization" value="${esc(company.name)}" placeholder="Nombre de la empresa" /></div>
        <div class="field"><label for="companySector">Sector</label><select id="companySector">${selectOptions(['PyME', 'Manufactura', 'Logística', 'Retail', 'Servicios profesionales', 'Otro'], company.sector)}</select></div>
        <div class="field"><label for="companyOwner">Responsable</label><input id="companyOwner" maxlength="120" autocomplete="name" value="${esc(company.owner)}" placeholder="Nombre del responsable" /></div>
        <div class="field"><label for="companyEmail">Correo</label><input id="companyEmail" type="email" maxlength="160" autocomplete="email" value="${esc(company.email)}" placeholder="correo@empresa.com" /></div>
        <div class="field"><label for="companySize">Tamaño</label><select id="companySize">${selectOptions(['1-50 empleados', '51-250 empleados', '251-1000 empleados', '1000+ empleados'], company.size)}</select></div>
        <div class="field"><label for="companyCritical">Operación crítica</label><select id="companyCritical">${selectOptions(['Operación normal', 'Horario extendido', 'Operación 24/7'], company.critical)}</select></div>
      </div>`;
    } else if (step <= DOMAINS.length) {
      const d = DOMAINS[step - 1];
      $('stepTitle').textContent = `${d.label} · ${d.name}`;
      $('stepSub').textContent = d.summary;
      content.innerHTML = `<p class="q-help">Responda con el nivel que mejor represente la evidencia y la operación actual. Si no lo sabe, elija «No sé / No aplica»: esa pregunta no cuenta en el cálculo.</p><div class="questions">` +
        d.questions.map((q, i) => {
          const current = answers[d.id][i];
          const qid = `q-${d.id}-${i}`;
          return `<div class="question" id="wrap-${qid}">
            <p><label class="q-title" for="${qid}">${esc(q.title)}</label><br>${esc(q.text)}</p>
            <select id="${qid}" data-domain="${esc(d.id)}" data-index="${i}">
              ${option('', 'Seleccione un nivel…', current === null)}
              ${SCALE.map(s => option(s.value, `${s.value} - ${s.label}`, current === s.value)).join('')}
              ${option(NA, 'No sé / No aplica', current === NA)}
            </select>
          </div>`;
        }).join('') + `</div>`;
    } else {
      $('stepTitle').textContent = 'Revisión final y generación';
      $('stepSub').textContent = 'Confirme la información antes de generar el dashboard y el reporte ejecutivo.';
      const row = (k, v) => `<div class="review-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`;
      content.innerHTML = `
        <div class="final-review">
          <div class="review-card">
            <h3>Información de la empresa</h3>
            <div class="review-table">
              ${row('Empresa', company.name || 'No especificada')}
              ${row('Sector / Industria', company.sector)}
              ${row('Responsable', company.owner || 'No especificado')}
              ${row('Correo electrónico', company.email || 'No especificado')}
              ${row('Tamaño', company.size)}
              ${row('Operación crítica', company.critical)}
            </div>
            <div class="privacy-note"><strong>Sus respuestas no se envían ni se almacenan.</strong><br/>El cálculo se realiza completamente en su navegador. ALLUNIFIED no recibe estos datos a menos que usted decida compartir el reporte con nosotros.</div>
            <label class="consent"><input type="checkbox" id="consentBox"${consent ? ' checked' : ''} /> <span>He leído el <a href="/privacidad" target="_blank" rel="noopener">aviso de privacidad</a> y entiendo que este resultado es una valoración primaria, no una certificación ni auditoría.</span></label>
          </div>
          <div class="review-card">
            <h3>¿Qué obtendrá al finalizar?</h3>
            <div class="review-benefit"><div class="review-icon">01</div><div><strong>Dashboard ejecutivo interactivo</strong><br/><span class="muted">Visualización completa de su nivel de madurez.</span></div></div>
            <div class="review-benefit"><div class="review-icon">02</div><div><strong>Madurez general y por dominio</strong><br/><span class="muted">Resultado alineado a las funciones NIST CSF 2.0.</span></div></div>
            <div class="review-benefit"><div class="review-icon">03</div><div><strong>Fortalezas y debilidades</strong><br/><span class="muted">Identificación de capacidades actuales y brechas prioritarias.</span></div></div>
            <div class="review-benefit"><div class="review-icon">04</div><div><strong>Riesgos, quick wins y roadmap</strong><br/><span class="muted">Acciones recomendadas a 30, 90, 180 y 365 días.</span></div></div>
            <div class="review-benefit"><div class="review-icon">PDF</div><div><strong>Reporte ejecutivo</strong><br/><span class="muted">Documento listo para guardar como PDF y compartir internamente.</span></div></div>
          </div>
        </div>`;
    }
    $('nextButton').textContent = step === LAST_STEP ? 'Generar resultados' : 'Siguiente';
    $('prevButton').disabled = step === 0;
  }

  function saveCompany() {
    if (step !== 0) return;
    company.name = $('companyName').value.trim();
    company.sector = $('companySector').value;
    company.owner = $('companyOwner').value.trim();
    company.email = $('companyEmail').value.trim();
    company.size = $('companySize').value;
    company.critical = $('companyCritical').value;
  }

  function validateStep() {
    if (step === 0) {
      const email = $('companyEmail');
      if (company.email && !email.checkValidity()) {
        setError('Revise el formato del correo o déjelo vacío.');
        email.focus();
        return false;
      }
      return true;
    }
    if (step <= DOMAINS.length) {
      const d = DOMAINS[step - 1];
      const missing = [];
      answers[d.id].forEach((v, i) => {
        const wrap = $(`wrap-q-${d.id}-${i}`);
        const empty = v === null;
        if (wrap) wrap.classList.toggle('missing', empty);
        if (empty) missing.push(i);
      });
      if (missing.length) {
        setError(`Faltan ${missing.length} pregunta(s) por responder en este dominio. Si no tiene la información, elija «No sé / No aplica».`);
        const first = $(`q-${d.id}-${missing[0]}`);
        if (first) first.focus();
        return false;
      }
      return true;
    }
    if (!consent) {
      setError('Para generar el reporte, confirme que leyó el aviso de privacidad.');
      return false;
    }
    return true;
  }

  function nextStep() {
    saveCompany();
    if (!validateStep()) return;
    if (step < LAST_STEP) {
      step++;
      renderStep();
      $('start').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      calculate();
    }
  }

  function prevStep() {
    saveCompany();
    if (step > 0) { step--; renderStep(); }
  }

  function level(score) {
    if (score >= 85) return 'Optimizado';
    if (score >= 70) return 'Gestionado';
    if (score >= 50) return 'Intermedio';
    if (score >= 30) return 'Básico';
    return 'Inicial';
  }

  function riskLevel(score) {
    if (score >= 75) return 'Bajo';
    if (score >= 55) return 'Medio';
    if (score >= 35) return 'Alto';
    return 'Crítico';
  }

  function scoreDomains() {
    return DOMAINS.map(d => {
      let weighted = 0, totalWeight = 0, answered = 0;
      d.questions.forEach((q, i) => {
        const v = answers[d.id][i];
        if (v === null || v === NA) return;
        weighted += v * q.weight;
        totalWeight += 5 * q.weight;
        answered++;
      });
      return {
        id: d.id,
        label: d.label,
        answered,
        total: d.questions.length,
        score: totalWeight ? Math.round(weighted / totalWeight * 100) : null
      };
    });
  }

  function calculate() {
    const all = scoreDomains();
    const scored = all.filter(d => d.score !== null);
    const report = $('resultsSection');

    if (!scored.length) {
      setError('Todas las respuestas fueron «No sé / No aplica». Responda al menos algunas preguntas para generar un resultado.');
      return;
    }

    const weights = { govern: 1.15, identify: 1.1, protect: 1.2, detect: 1.15, respond: 1.05, recover: 1.15 };
    const overall = Math.round(scored.reduce((a, d) => a + d.score * weights[d.id], 0) / scored.reduce((a, d) => a + weights[d.id], 0));
    const resil = scored.filter(d => ['detect', 'respond', 'recover'].includes(d.id));
    const resilience = resil.length ? Math.round(resil.reduce((a, d) => a + d.score, 0) / resil.length) : null;

    const answered = all.reduce((a, d) => a + d.answered, 0);
    const total = all.reduce((a, d) => a + d.total, 0);

    $('overallScore').textContent = overall;
    $('levelName').textContent = level(overall);
    $('riskLevel').textContent = riskLevel(overall);
    $('resilienceIndex').textContent = resilience === null ? 'N/D' : resilience;
    $('gaugeFill').style.width = overall + '%';
    $('reportMeta').textContent = [
      company.name || 'Empresa evaluada',
      company.sector,
      company.owner || 'Responsable no especificado',
      new Date().toLocaleDateString('es-MX'),
      `${answered} de ${total} preguntas con respuesta`
    ].join(' · ');

    renderBars(all);
    renderRadar(all);
    renderInsights(scored, overall, answered, total);
    renderRoadmap(scored);
    renderServices(scored);

    updateWorkshopLinks(all, overall);

    report.classList.add('active');
    report.scrollIntoView({ behavior: 'smooth' });
  }

  // Mensaje prellenado para solicitar el workshop. Solo se envía si el usuario lo decide.
  function updateWorkshopLinks(all, overall) {
    const lines = [
      'Hola ALLUNIFIED, quiero solicitar un Workshop Ejecutivo ACMA.',
      '',
      `Empresa: ${company.name || 'No especificada'}`,
      `Sector: ${company.sector} · ${company.size} · ${company.critical}`,
      `Madurez general: ${overall}/100 (${level(overall)}) · Riesgo ${riskLevel(overall).toLowerCase()}`,
      'Por dominio: ' + all.map(d => `${d.label} ${d.score === null ? 'N/D' : d.score + '%'}`).join(', ')
    ];
    const text = lines.join('\n');
    const wa = $('workshopWhatsapp');
    const mail = $('workshopEmail');
    if (wa) wa.href = 'https://wa.me/525599152707?text=' + encodeURIComponent(text);
    if (mail) mail.href = 'mailto:contacto@allunifiedst.com?subject=' +
      encodeURIComponent('Solicitud de Workshop Ejecutivo ACMA' + (company.name ? ' - ' + company.name : '')) +
      '&body=' + encodeURIComponent(text);
  }

  function renderBars(all) {
    $('bars').innerHTML = all.map(d => {
      const pct = d.score === null ? 0 : d.score;
      const txt = d.score === null ? 'N/D' : `${d.score}%`;
      return `<div class="bar-row"><strong>${esc(d.label)}</strong><div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div><span>${txt}</span></div>`;
    }).join('');
  }

  function renderRadar(all) {
    const svg = $('radarSvg'), cx = 220, cy = 185, maxR = 128, n = all.length, stepDeg = 360 / n;
    const at = (i, r) => {
      const a = (-90 + i * stepDeg) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const axis = all.map((d, i) => at(i, maxR));
    const pts = all.map((d, i) => at(i, maxR * (d.score || 0) / 100));
    const labels = all.map((d, i) => {
      const [x, y] = at(i, maxR + 22);
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="#334155" font-size="13" font-weight="800" text-anchor="middle">${esc(d.label)}</text>`;
    }).join('');
    const rings = [0.25, 0.5, 0.75].map(f => `<polygon points="${all.map((d, i) => at(i, maxR * f).join(',')).join(' ')}" fill="none" stroke="#eef2f7"/>`).join('');
    const summary = all.map(d => `${d.label} ${d.score === null ? 'sin datos' : d.score + '%'}`).join(', ');
    svg.innerHTML = `<title>Radar de madurez por dominio: ${esc(summary)}</title>${rings}<polygon points="${axis.map(p => p.join(',')).join(' ')}" fill="none" stroke="#cbd5e1" stroke-width="2"/>${axis.map(p => `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#e2e8f0"/>`).join('')}<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="rgba(34,211,238,.35)" stroke="#0891b2" stroke-width="3"/>${labels}`;
  }

  function li(text) { return `<li>${text}</li>`; }

  function renderInsights(scored, overall, answered, total) {
    const asc = [...scored].sort((a, b) => a.score - b.score);
    const desc = [...scored].sort((a, b) => b.score - a.score);
    const strong = desc.filter(d => d.score >= STRENGTH_MIN).slice(0, 3);
    const weak = asc.filter(d => d.score < WEAK_MAX).slice(0, 3);

    $('strengths').innerHTML = strong.length
      ? strong.map(d => li(`${esc(guidance[d.id][0])} <strong>(${esc(d.label)}: ${d.score}%)</strong>`)).join('')
      : li(desc[0].score > 0
          ? `Aún no hay dominios con madurez de ${STRENGTH_MIN}% o más. El dominio más avanzado es ${esc(desc[0].label)} (${desc[0].score}%).`
          : 'Aún no se identifican controles implementados en ningún dominio. Es el punto de partida ideal para un roadmap desde cero.');

    $('weaknesses').innerHTML = weak.length
      ? weak.map(d => li(`${esc(guidance[d.id][1])} <strong>(${esc(d.label)}: ${d.score}%)</strong>`)).join('')
      : li(`No hay dominios por debajo de ${WEAK_MAX}%. El área con más margen de mejora es ${esc(asc[0].label)} (${asc[0].score}%).`);

    $('risks').innerHTML = weak.length
      ? weak.map(d => {
          const critical = d.score < CRITICAL_MAX;
          return `<div class="risk ${critical ? 'high' : ''}"><strong>${esc(d.label)} · Prioridad ${critical ? 'crítica' : 'alta'}</strong><br/>${esc(guidance[d.id][2])}</div>`;
        }).join('')
      : `<div class="quickwin"><strong>Sin riesgos prioritarios por madurez</strong><br/>Mantenga la medición periódica y valide la evidencia con un assessment técnico.</div>`;

    const qwTargets = weak.length ? weak : asc.slice(0, 1);
    $('quickwins').innerHTML = qwTargets.map(d => `<div class="quickwin"><strong>${esc(d.label)}</strong><br/>${esc(guidance[d.id][3])}</div>`).join('');

    const coverage = answered < total
      ? ` ${total - answered} pregunta(s) se marcaron como «No sé / No aplica» y no se incluyeron en el cálculo; conviene confirmarlas.`
      : '';
    $('executiveSummary').textContent = `La organización presenta un nivel ${level(overall)} con una madurez general de ${overall}/100 y un riesgo ${riskLevel(overall).toLowerCase()}.${coverage} El resultado permite identificar tendencias ejecutivas y priorizar dominios críticos. ALLUNIFIED recomienda validar estos hallazgos mediante un Workshop Ejecutivo y posteriormente un Assessment Técnico en campo para confirmar evidencias, identificar dependencias operativas y construir un roadmap alineado al negocio.`;
  }

  function renderRoadmap(scored) {
    const focus = [...scored].sort((a, b) => a.score - b.score).slice(0, 2);
    const labels = ['30 días', '90 días', '180 días', '365 días'];
    $('roadmap').innerHTML = labels.map((lab, i) =>
      `<div class="road"><strong>${lab}</strong><ul>${focus.map(d => `<li><b>${esc(d.label)}:</b> ${esc(roadmapMap[d.id][i])}</li>`).join('')}</ul></div>`
    ).join('');
  }

  function renderServices(scored) {
    const asc = [...scored].sort((a, b) => a.score - b.score);
    const weak = asc.filter(d => d.score < WEAK_MAX);
    const targets = (weak.length ? weak : asc.slice(0, 2)).slice(0, 3);
    const seen = new Set();
    $('servicesRec').innerHTML = targets.filter(d => {
      const name = serviceMap[d.id][0];
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    }).map(d => `<div class="service-rec"><strong>${esc(serviceMap[d.id][0])}</strong><p class="muted">${esc(serviceMap[d.id][1])} Atiende brechas del dominio ${esc(d.label)}.</p></div>`).join('');
  }

  // Eventos (sin manejadores en línea, compatible con CSP estricta)
  $('nextButton').addEventListener('click', nextStep);
  $('prevButton').addEventListener('click', prevStep);
  $('printButton').addEventListener('click', () => window.print());
  $('wizardContent').addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'consentBox') { consent = t.checked; if (consent) setError(''); return; }
    if (!t.dataset || !t.dataset.domain) return;
    const raw = t.value;
    const value = raw === '' ? null : raw === NA ? NA : Number(raw);
    answers[t.dataset.domain][Number(t.dataset.index)] = value;
    const wrap = $(`wrap-${t.id}`);
    if (wrap && value !== null) wrap.classList.remove('missing');
  });

  renderDomainCards();
  renderStep();
})();
