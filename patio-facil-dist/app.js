(() => {
  'use strict';

  const STORAGE_KEY = 'patio-facil-state-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const nowMinus = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
  const recentToday = (minutes) => {
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    return nowMinus(Math.min(minutes, Math.max(0, minutesSinceMidnight - 1)));
  };

  function createDemoState() {
    return {
      version: 1,
      settings: {
        businessName: 'Pátio Fácil',
        capacity: 18,
        graceMinutes: 10,
        firstHourCents: 1200,
        additionalHourCents: 600,
        dailyMaxCents: 5000,
      },
      services: [
        { id: 'simple', name: 'Lavagem simples', priceCents: 3500 },
        { id: 'complete', name: 'Lavagem completa', priceCents: 5500 },
        { id: 'wax', name: 'Completa + cera', priceCents: 8000 },
      ],
      active: [
        { id: uid(), plate: 'FRT4B21', model: 'Honda HR-V', color: 'Cinza', customer: 'Marina Costa', phone: '(11) 98814-2201', spot: '03', entryAt: nowMinus(44), serviceId: 'complete', washStatus: 'washing', notes: 'Cliente aguarda na recepção.' },
        { id: uid(), plate: 'GXP8C90', model: 'Chevrolet Onix', color: 'Branco', customer: 'Rafael Lima', phone: '', spot: '07', entryAt: nowMinus(106), serviceId: null, washStatus: null, notes: '' },
        { id: uid(), plate: 'DRY2A18', model: 'Toyota Corolla', color: 'Preto', customer: 'Fernanda Alves', phone: '(11) 97320-4455', spot: '11', entryAt: nowMinus(23), serviceId: 'simple', washStatus: 'waiting', notes: 'Atenção ao retrovisor esquerdo.' },
        { id: uid(), plate: 'QWE7J52', model: 'VW T-Cross', color: 'Azul', customer: 'Bruno Reis', phone: '', spot: '14', entryAt: nowMinus(78), serviceId: 'wax', washStatus: 'ready', notes: '' },
      ],
      history: [
        { id: uid(), plate: 'ELO1D45', model: 'Fiat Argo', customer: 'Camila Nunes', spot: '05', entryAt: nowMinus(127), exitAt: recentToday(20), durationMinutes: 107, serviceName: 'Lavagem simples', parkingCents: 1800, serviceCents: 3500, totalCents: 5300, payment: 'PIX' },
        { id: uid(), plate: 'HLK9F03', model: 'Hyundai HB20', customer: 'Carlos Melo', spot: '08', entryAt: nowMinus(135), exitAt: recentToday(50), durationMinutes: 85, serviceName: '', parkingCents: 1800, serviceCents: 0, totalCents: 1800, payment: 'Débito' },
        { id: uid(), plate: 'ABC3H77', model: 'Jeep Renegade', customer: 'Ana Souza', spot: '02', entryAt: nowMinus(200), exitAt: recentToday(110), durationMinutes: 90, serviceName: 'Lavagem completa', parkingCents: 1800, serviceCents: 5500, totalCents: 7300, payment: 'Crédito' },
      ],
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && parsed.version === 1 && parsed.settings && Array.isArray(parsed.active) && Array.isArray(parsed.history) && Array.isArray(parsed.services)) return parsed;
    } catch (error) {
      console.warn('Dados locais inválidos. A demonstração foi restaurada.', error);
    }
    const initial = createDemoState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  let state = loadState();
  let currentPage = 'patio';
  let currentFilter = 'all';
  let patioQuery = '';
  let currentCheckoutId = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      toast('Não foi possível salvar neste navegador.', 'alert');
      console.error(error);
      return false;
    }
  }

  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const normalizePlate = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  const validPlate = (plate) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate);
  const money = (cents = 0, compact = false) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: compact ? 0 : 2, maximumFractionDigits: compact ? 0 : 2 }).format(cents / 100);
  const shortDate = (iso) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso)).replace('.', '');
  const fullDate = (iso) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  const time = (iso) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const isToday = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  };
  const minutesSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  const durationLabel = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins ? ` ${String(mins).padStart(2, '0')}min` : ''}`;
  };
  const serviceById = (id) => state.services.find((service) => service.id === id);
  const vehicleService = (vehicle) => {
    if (!vehicle.serviceId) return null;
    if (vehicle.serviceName && Number.isFinite(vehicle.servicePriceCents)) return { id: vehicle.serviceId, name: vehicle.serviceName, priceCents: vehicle.servicePriceCents };
    return serviceById(vehicle.serviceId) || { id: vehicle.serviceId, name: 'Serviço removido', priceCents: 0 };
  };

  function parkingPrice(minutes) {
    const { graceMinutes, firstHourCents, additionalHourCents, dailyMaxCents } = state.settings;
    if (minutes <= graceMinutes) return 0;
    const fullDays = Math.floor(minutes / 1440);
    const remainder = minutes % 1440;
    const remainderPrice = remainder === 0 ? 0 : Math.min(firstHourCents + Math.ceil(Math.max(0, remainder - 60) / 60) * additionalHourCents, dailyMaxCents);
    return fullDays * dailyMaxCents + remainderPrice;
  }

  function vehicleStatus(vehicle) {
    if (!vehicle.serviceId) return { key: 'parking', label: 'Estacionado' };
    const labels = { waiting: 'Aguardando lavagem', washing: 'Em lavagem', ready: 'Pronto' };
    return { key: vehicle.washStatus, label: labels[vehicle.washStatus] || 'Estacionado' };
  }

  function toast(message, type = 'check') {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = `${icon(type)}<span>${escapeHTML(message)}</span>`;
    $('#toast-region').append(node);
    window.setTimeout(() => node.remove(), 3200);
  }

  function renderHeader() {
    const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
    $('#today-label').textContent = date.charAt(0).toUpperCase() + date.slice(1);
    $('#cash-date-label').textContent = `Movimentação de ${date}.`;
    $$('.brand strong').forEach((node) => { node.textContent = state.settings.businessName; });
  }

  function renderMetrics() {
    const active = state.active.length;
    const capacity = state.settings.capacity;
    const free = Math.max(0, capacity - active);
    const washing = state.active.filter((vehicle) => vehicle.washStatus === 'washing').length;
    const waiting = state.active.filter((vehicle) => vehicle.washStatus === 'waiting').length;
    const today = state.history.filter((entry) => isToday(entry.exitAt));
    const revenue = today.reduce((sum, entry) => sum + entry.totalCents, 0);
    const percent = capacity ? Math.min(100, Math.round(active / capacity * 100)) : 0;
    $('#metric-active').textContent = active;
    $('#metric-capacity').textContent = `de ${capacity} vagas`;
    $('#metric-free').textContent = free;
    $('#metric-wash').textContent = washing;
    $('#metric-waiting').textContent = `${waiting} aguardando`;
    $('#metric-revenue').textContent = money(revenue, true);
    $('#metric-sales').textContent = `${today.length} recebimento${today.length === 1 ? '' : 's'}`;
    $('#dial-percent').textContent = `${percent}%`;
    $('#dial-progress').style.strokeDashoffset = String(301.6 * (1 - percent / 100));
    $('#wash-nav-count').textContent = state.active.filter((vehicle) => vehicle.serviceId && vehicle.washStatus !== 'ready').length;
  }

  function activeMatchesFilter(vehicle) {
    const query = patioQuery.toLowerCase();
    const haystack = `${vehicle.plate} ${vehicle.model} ${vehicle.customer} ${vehicle.spot}`.toLowerCase();
    const queryMatch = !query || haystack.includes(query);
    const filterMatch = currentFilter === 'all' || (currentFilter === 'parking' ? !vehicle.serviceId : vehicle.washStatus === currentFilter);
    return queryMatch && filterMatch;
  }

  function renderPatio() {
    const vehicles = state.active.filter(activeMatchesFilter).sort((a, b) => new Date(a.entryAt) - new Date(b.entryAt));
    $('#filter-all-count').textContent = state.active.length;
    $('#vehicle-list').innerHTML = vehicles.map((vehicle) => {
      const status = vehicleStatus(vehicle);
      const service = vehicleService(vehicle);
      const nextAction = vehicle.washStatus === 'waiting' ? 'Iniciar' : vehicle.washStatus === 'washing' ? 'Concluir' : vehicle.washStatus === 'ready' ? 'Receber' : 'Saída';
      const action = ['waiting', 'washing'].includes(vehicle.washStatus) ? 'advance-wash' : 'checkout';
      return `<article class="vehicle-row" data-id="${vehicle.id}">
        <div class="vehicle-main"><div class="car-badge">${icon('car')}</div><div><strong>${escapeHTML(vehicle.plate)}</strong><span>${escapeHTML(vehicle.model || 'Modelo não informado')} • ${escapeHTML(vehicle.color || 'Cor não informada')}</span></div></div>
        <div class="row-info"><span class="row-label">Vaga</span><span class="row-value">${escapeHTML(vehicle.spot || '—')}</span></div>
        <div class="row-info"><span class="row-label">Permanência</span><span class="row-value">${icon('clock')}${durationLabel(minutesSince(vehicle.entryAt))}</span></div>
        <div class="row-info"><span class="row-label">Situação</span><span class="status-badge ${status.key}" title="${escapeHTML(service?.name || status.label)}">${status.label}</span></div>
        <div class="row-actions"><button class="quick-action" data-action="${action}">${nextAction}</button><button class="more-button" data-action="details" aria-label="Ver detalhes">${icon('more')}</button></div>
      </article>`;
    }).join('');
    $('#vehicle-empty').hidden = vehicles.length > 0;
    $('#vehicle-list').hidden = vehicles.length === 0;
  }

  function renderWash() {
    const columns = ['waiting', 'washing', 'ready'];
    columns.forEach((status) => {
      const vehicles = state.active.filter((vehicle) => vehicle.washStatus === status);
      $(`#${status}-count`).textContent = vehicles.length;
      const list = $(`#wash-${status}`);
      list.innerHTML = vehicles.length ? vehicles.map((vehicle) => {
        const service = vehicleService(vehicle);
        const nextLabel = status === 'waiting' ? 'Iniciar lavagem' : status === 'washing' ? 'Marcar como pronto' : 'Receber e liberar';
        const nextAction = status === 'ready' ? 'checkout' : 'advance-wash';
        return `<article class="wash-card" data-id="${vehicle.id}"><div class="wash-card-top"><span class="plate">${escapeHTML(vehicle.plate)}</span><span class="time-tag">${icon('clock')}${durationLabel(minutesSince(vehicle.entryAt))}</span></div><p class="service-name">${escapeHTML(service?.name || 'Serviço removido')}</p><p class="customer-line">${escapeHTML(vehicle.customer || vehicle.model || 'Cliente não informado')} • vaga ${escapeHTML(vehicle.spot || '—')}</p><div class="wash-card-actions"><button class="detail-button" data-action="details">Detalhes</button><button class="advance-button" data-action="${nextAction}">${nextLabel}${icon(status === 'ready' ? 'wallet' : 'arrow')}</button></div></article>`;
      }).join('') : '<div class="kanban-empty">Nenhum veículo nesta etapa.</div>';
    });
    $$('.kanban-column').forEach((column) => column.classList.toggle('mobile-active', column.dataset.column === ($('.wash-mobile-tabs .active')?.dataset.washView || 'waiting')));
  }

  function todayHistory() {
    return state.history.filter((entry) => isToday(entry.exitAt)).sort((a, b) => new Date(b.exitAt) - new Date(a.exitAt));
  }

  function renderCash() {
    const today = todayHistory();
    const total = today.reduce((sum, entry) => sum + entry.totalCents, 0);
    const parking = today.reduce((sum, entry) => sum + entry.parkingCents, 0);
    const wash = today.reduce((sum, entry) => sum + entry.serviceCents, 0);
    $('#cash-total').textContent = money(total);
    $('#cash-parking').textContent = money(parking);
    $('#cash-wash').textContent = money(wash);
    $('#cash-comparison').textContent = `${today.length} saída${today.length === 1 ? '' : 's'} concluída${today.length === 1 ? '' : 's'}`;
    const paymentOrder = ['PIX', 'Dinheiro', 'Débito', 'Crédito'];
    $('#payment-breakdown').innerHTML = paymentOrder.map((method) => {
      const amount = today.filter((entry) => entry.payment === method).reduce((sum, entry) => sum + entry.totalCents, 0);
      const percent = total ? Math.round(amount / total * 100) : 0;
      const css = method.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return `<div class="payment-line"><div class="payment-line-top"><span>${method}</span><strong>${money(amount)} • ${percent}%</strong></div><div class="bar-track"><div class="bar-fill ${css}" style="width:${percent}%"></div></div></div>`;
    }).join('');
    $('#cash-transactions').innerHTML = today.length ? today.slice(0, 6).map((entry) => `<article class="transaction-row"><div class="transaction-icon">${icon('wallet')}</div><div><strong>${escapeHTML(entry.plate)}</strong><span>${escapeHTML(entry.customer || entry.model || 'Cliente')} • ${time(entry.exitAt)}</span></div><div class="transaction-value"><strong>${money(entry.totalCents)}</strong><small>${escapeHTML(entry.payment)}</small></div></article>`).join('') : '<div class="kanban-empty">Nenhum recebimento hoje.</div>';
  }

  function filteredHistory() {
    const query = $('#history-search')?.value.trim().toLowerCase() || '';
    const payment = $('#history-payment')?.value || 'all';
    return [...state.history].sort((a, b) => new Date(b.exitAt) - new Date(a.exitAt)).filter((entry) => {
      const matchesQuery = !query || `${entry.plate} ${entry.customer} ${entry.model}`.toLowerCase().includes(query);
      const matchesPayment = payment === 'all' || entry.payment === payment;
      return matchesQuery && matchesPayment;
    });
  }

  function renderHistory() {
    const entries = filteredHistory();
    $('#history-list').innerHTML = entries.length ? entries.map((entry) => `<article class="history-row"><div><strong>${escapeHTML(entry.plate)}</strong><span>${escapeHTML(entry.model || 'Modelo não informado')} • ${escapeHTML(entry.customer || 'Cliente não informado')}</span></div><div><strong>${fullDate(entry.exitAt)}</strong><span>${time(entry.entryAt)} → ${time(entry.exitAt)}</span></div><div><strong>${durationLabel(entry.durationMinutes)}</strong><span>Vaga ${escapeHTML(entry.spot || '—')}</span></div><div><strong>${escapeHTML(entry.payment)}</strong><span>${escapeHTML(entry.serviceName || 'Só estacionamento')}</span></div><strong class="history-total">${money(entry.totalCents)}</strong></article>`).join('') : '<div class="empty-state"><div class="empty-icon">' + icon('history') + '</div><h4>Nenhum registro encontrado</h4><p>Ajuste os filtros ou conclua uma saída.</p></div>';
  }

  function renderSettings() {
    const form = $('#settings-form');
    form.elements.businessName.value = state.settings.businessName;
    form.elements.capacity.value = state.settings.capacity;
    form.elements.graceMinutes.value = state.settings.graceMinutes;
    form.elements.firstHour.value = (state.settings.firstHourCents / 100).toFixed(2);
    form.elements.additionalHour.value = (state.settings.additionalHourCents / 100).toFixed(2);
    form.elements.dailyMax.value = (state.settings.dailyMaxCents / 100).toFixed(2);
    $('#services-settings').innerHTML = state.services.map((service) => `<div class="service-setting-row" data-service-id="${service.id}"><input class="service-name-input" aria-label="Nome do serviço" value="${escapeHTML(service.name)}" maxlength="50" required /><input class="service-price-input" aria-label="Preço do serviço" type="number" min="0" step="0.01" value="${(service.priceCents / 100).toFixed(2)}" required /><button type="button" class="remove-service" aria-label="Remover serviço">${icon('x')}</button></div>`).join('');
  }

  function renderAll() {
    renderHeader();
    renderMetrics();
    renderPatio();
    renderWash();
    renderCash();
    renderHistory();
    renderSettings();
  }

  const pageTitles = { patio: 'Visão do pátio', lavagem: 'Lava-rápido', caixa: 'Caixa', historico: 'Histórico', configuracoes: 'Configurações' };
  function switchPage(page) {
    currentPage = page;
    $$('.page').forEach((node) => node.classList.toggle('active', node.id === `page-${page}`));
    $$('[data-page]').forEach((node) => node.classList.toggle('active', node.dataset.page === page));
    $('#page-title').textContent = pageTitles[page] || 'Pátio Fácil';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'caixa') renderCash();
    if (page === 'historico') renderHistory();
  }

  function availableSpots() {
    const used = new Set(state.active.map((vehicle) => String(vehicle.spot).padStart(2, '0')));
    return Array.from({ length: state.settings.capacity }, (_, index) => String(index + 1).padStart(2, '0')).filter((spot) => !used.has(spot));
  }

  function openEntry() {
    if (state.active.length >= state.settings.capacity) {
      toast('O pátio está lotado. Finalize uma saída primeiro.', 'alert');
      return;
    }
    const form = $('#entry-form');
    form.reset();
    $('#entry-error').hidden = true;
    $('#entry-spot').innerHTML = availableSpots().map((spot) => `<option value="${spot}">Vaga ${spot}</option>`).join('');
    $('#entry-services').innerHTML = `<label class="service-option"><input type="radio" name="serviceId" value="" checked /><span><b>Sem lavagem</b><small>Só estacionamento</small></span></label>${state.services.map((service) => `<label class="service-option"><input type="radio" name="serviceId" value="${service.id}" /><span><b>${escapeHTML(service.name)}</b><small>${money(service.priceCents)}</small></span></label>`).join('')}`;
    $('#entry-dialog').showModal();
    window.setTimeout(() => $('#entry-plate').focus(), 80);
  }

  function submitEntry(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const plate = normalizePlate(data.get('plate'));
    const error = $('#entry-error');
    if (!validPlate(plate)) {
      error.textContent = 'Informe uma placa válida, como ABC1D23 ou ABC1234.';
      error.hidden = false;
      return;
    }
    if (state.active.some((vehicle) => vehicle.plate === plate)) {
      error.textContent = 'Esta placa já possui uma comanda aberta.';
      error.hidden = false;
      return;
    }
    if (state.active.length >= state.settings.capacity) {
      error.textContent = 'Não há vagas disponíveis neste momento.';
      error.hidden = false;
      return;
    }
    const serviceId = String(data.get('serviceId') || '');
    const selectedService = serviceById(serviceId);
    state.active.push({
      id: uid(), plate, model: String(data.get('model') || '').trim(), color: String(data.get('color') || '').trim(), customer: String(data.get('customer') || '').trim(), phone: String(data.get('phone') || '').trim(), spot: String(data.get('spot') || ''), entryAt: new Date().toISOString(), serviceId: serviceId || null, serviceName: selectedService?.name || '', servicePriceCents: selectedService?.priceCents ?? 0, washStatus: serviceId ? 'waiting' : null, notes: String(data.get('notes') || '').trim(),
    });
    if (!saveState()) return;
    $('#entry-dialog').close();
    renderAll();
    switchPage('patio');
    toast(`Entrada de ${plate} registrada.`);
  }

  function openDetails(id) {
    const vehicle = state.active.find((item) => item.id === id);
    if (!vehicle) return;
    const service = vehicleService(vehicle);
    const status = vehicleStatus(vehicle);
    const nextLabel = vehicle.washStatus === 'waiting' ? 'Iniciar lavagem' : vehicle.washStatus === 'washing' ? 'Concluir lavagem' : '';
    $('#details-content').innerHTML = `<div class="detail-hero"><button type="button" class="icon-button modal-close" aria-label="Fechar">${icon('x')}</button><div class="detail-plate">${escapeHTML(vehicle.plate)}</div><div class="detail-car">${escapeHTML(vehicle.model || 'Modelo não informado')} • ${escapeHTML(vehicle.color || 'Cor não informada')}</div></div><div class="detail-body"><div class="detail-grid"><div class="detail-stat"><span>Vaga</span><strong>${escapeHTML(vehicle.spot || '—')}</strong></div><div class="detail-stat"><span>Entrada</span><strong>${time(vehicle.entryAt)}</strong></div><div class="detail-stat"><span>Permanência</span><strong>${durationLabel(minutesSince(vehicle.entryAt))}</strong></div><div class="detail-stat"><span>Situação</span><strong>${status.label}</strong></div><div class="detail-stat"><span>Cliente</span><strong>${escapeHTML(vehicle.customer || 'Não informado')}</strong></div><div class="detail-stat"><span>Telefone</span><strong>${escapeHTML(vehicle.phone || 'Não informado')}</strong></div></div>${service ? `<section class="detail-section"><h4>Serviço contratado</h4><div class="detail-service"><div><strong>${escapeHTML(service.name)}</strong><span>${status.label}</span></div><strong>${money(service.priceCents)}</strong></div></section>` : ''}${vehicle.notes ? `<section class="detail-section"><h4>Observações</h4><div class="detail-notes">${escapeHTML(vehicle.notes)}</div></section>` : ''}</div><div class="detail-actions">${nextLabel ? `<button class="btn btn-secondary" data-action="advance-wash" data-id="${vehicle.id}">${icon('drop')}${nextLabel}</button>` : ''}<button class="btn btn-primary" data-action="checkout" data-id="${vehicle.id}">${icon('wallet')}Ir para pagamento</button></div>`;
    $('#details-dialog').showModal();
  }

  function advanceWash(id) {
    const vehicle = state.active.find((item) => item.id === id);
    if (!vehicle || !vehicle.serviceId) return;
    if (vehicle.washStatus === 'waiting') {
      vehicle.washStatus = 'washing';
      toast(`Lavagem de ${vehicle.plate} iniciada.`);
    } else if (vehicle.washStatus === 'washing') {
      vehicle.washStatus = 'ready';
      toast(`${vehicle.plate} está pronto para entrega.`);
    } else return;
    saveState();
    $$('#details-dialog[open]').forEach((dialog) => dialog.close());
    renderAll();
  }

  function openCheckout(id) {
    const vehicle = state.active.find((item) => item.id === id);
    if (!vehicle) return;
    currentCheckoutId = id;
    const minutes = minutesSince(vehicle.entryAt);
    const service = vehicleService(vehicle);
    const parkingCents = parkingPrice(minutes);
    const serviceCents = service?.priceCents || 0;
    const pendingWarning = vehicle.serviceId && vehicle.washStatus !== 'ready' ? `<div class="checkout-line"><span>${icon('alert')} Lavagem ainda não concluída</span><strong>${vehicleStatus(vehicle).label}</strong></div>` : '';
    $('#checkout-subtitle').textContent = `${vehicle.plate} • ${durationLabel(minutes)} no pátio`;
    $('#checkout-summary').innerHTML = `${pendingWarning}<div class="checkout-line"><span>Estacionamento</span><strong>${money(parkingCents)}</strong></div>${service ? `<div class="checkout-line"><span>${escapeHTML(service.name)}</span><strong>${money(serviceCents)}</strong></div>` : ''}<div class="checkout-line checkout-total"><span>Total a receber</span><strong>${money(parkingCents + serviceCents)}</strong></div>`;
    $('#details-dialog').close();
    $('#checkout-form').reset();
    $('#checkout-dialog').showModal();
  }

  function submitCheckout(event) {
    event.preventDefault();
    const vehicle = state.active.find((item) => item.id === currentCheckoutId);
    if (!vehicle) {
      $('#checkout-dialog').close();
      return;
    }
    const submit = $('button[type="submit"]', event.currentTarget);
    submit.disabled = true;
    const exitAt = new Date().toISOString();
    const durationMinutes = Math.max(0, Math.floor((new Date(exitAt) - new Date(vehicle.entryAt)) / 60_000));
    const service = vehicleService(vehicle);
    const parkingCents = parkingPrice(durationMinutes);
    const serviceCents = service?.priceCents || 0;
    const payment = new FormData(event.currentTarget).get('payment');
    state.history.push({ id: uid(), plate: vehicle.plate, model: vehicle.model, customer: vehicle.customer, spot: vehicle.spot, entryAt: vehicle.entryAt, exitAt, durationMinutes, serviceName: service?.name || '', parkingCents, serviceCents, totalCents: parkingCents + serviceCents, payment: String(payment) });
    state.active = state.active.filter((item) => item.id !== vehicle.id);
    if (!saveState()) { submit.disabled = false; return; }
    currentCheckoutId = null;
    $('#checkout-dialog').close();
    submit.disabled = false;
    renderAll();
    switchPage('patio');
    toast(`Pagamento de ${money(parkingCents + serviceCents)} recebido. Vaga ${vehicle.spot} liberada.`);
  }

  function submitSettings(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const services = $$('.service-setting-row').map((row) => ({ id: row.dataset.serviceId || uid(), name: $('.service-name-input', row).value.trim(), priceCents: Math.round(Number($('.service-price-input', row).value) * 100) })).filter((service) => service.name && Number.isFinite(service.priceCents) && service.priceCents >= 0);
    if (!services.length) { toast('Mantenha pelo menos um serviço de lavagem.', 'alert'); return; }
    const capacity = Math.max(state.active.length, Math.round(Number(data.get('capacity'))));
    state.settings = { businessName: String(data.get('businessName')).trim() || 'Pátio Fácil', capacity, graceMinutes: Math.max(0, Math.round(Number(data.get('graceMinutes')))), firstHourCents: Math.max(0, Math.round(Number(data.get('firstHour')) * 100)), additionalHourCents: Math.max(0, Math.round(Number(data.get('additionalHour')) * 100)), dailyMaxCents: Math.max(0, Math.round(Number(data.get('dailyMax')) * 100)) };
    state.services = services;
    saveState();
    renderAll();
    toast('Configurações salvas com sucesso.');
  }

  function addServiceRow() {
    const row = document.createElement('div');
    row.className = 'service-setting-row';
    row.dataset.serviceId = uid();
    row.innerHTML = `<input class="service-name-input" aria-label="Nome do serviço" value="Novo serviço" maxlength="50" required /><input class="service-price-input" aria-label="Preço do serviço" type="number" min="0" step="0.01" value="0.00" required /><button type="button" class="remove-service" aria-label="Remover serviço">${icon('x')}</button>`;
    $('#services-settings').append(row);
    $('.service-name-input', row).select();
  }

  function downloadCSV(entries, filename) {
    const header = ['Placa', 'Modelo', 'Cliente', 'Entrada', 'Saída', 'Duração (min)', 'Estacionamento', 'Lavagem', 'Total', 'Pagamento'];
    const rows = entries.map((entry) => [entry.plate, entry.model, entry.customer, new Date(entry.entryAt).toLocaleString('pt-BR'), new Date(entry.exitAt).toLocaleString('pt-BR'), entry.durationMinutes, (entry.parkingCents / 100).toFixed(2), (entry.serviceCents / 100).toFixed(2), (entry.totalCents / 100).toFixed(2), entry.payment]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast('Arquivo CSV gerado.');
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-page]');
    if (nav) { switchPage(nav.dataset.page); return; }
    if (event.target.closest('.entry-trigger')) { openEntry(); return; }
    const close = event.target.closest('.modal-close');
    if (close) { close.closest('dialog')?.close(); return; }
    const filter = event.target.closest('.filter-tab');
    if (filter) { $$('.filter-tab').forEach((tab) => tab.classList.remove('active')); filter.classList.add('active'); currentFilter = filter.dataset.filter; renderPatio(); return; }
    const washTab = event.target.closest('[data-wash-view]');
    if (washTab) { $$('.wash-mobile-tabs button').forEach((tab) => tab.classList.remove('active')); washTab.classList.add('active'); renderWash(); return; }
    const action = event.target.closest('[data-action]');
    if (action) {
      const id = action.dataset.id || action.closest('[data-id]')?.dataset.id;
      if (action.dataset.action === 'details') openDetails(id);
      if (action.dataset.action === 'advance-wash') advanceWash(id);
      if (action.dataset.action === 'checkout') openCheckout(id);
      return;
    }
    const remove = event.target.closest('.remove-service');
    if (remove) {
      const row = remove.closest('.service-setting-row');
      if (state.active.some((vehicle) => vehicle.serviceId === row.dataset.serviceId)) toast('Este serviço está em uma comanda aberta e não pode ser removido.', 'alert');
      else if ($$('.service-setting-row').length <= 1) toast('Mantenha ao menos um serviço.', 'alert');
      else row.remove();
    }
  });

  $('#entry-form').addEventListener('submit', submitEntry);
  $('#checkout-form').addEventListener('submit', submitCheckout);
  $('#settings-form').addEventListener('submit', submitSettings);
  $('#add-service').addEventListener('click', addServiceRow);
  $('#entry-plate').addEventListener('input', (event) => { event.target.value = normalizePlate(event.target.value); $('#entry-error').hidden = true; });
  $('#global-search').addEventListener('input', (event) => { patioQuery = event.target.value.trim(); if (currentPage !== 'patio') switchPage('patio'); renderPatio(); });
  $('#history-search').addEventListener('input', renderHistory);
  $('#history-payment').addEventListener('change', renderHistory);
  $('#export-cash').addEventListener('click', () => downloadCSV(todayHistory(), `caixa-${new Date().toISOString().slice(0, 10)}.csv`));
  $('#export-history').addEventListener('click', () => downloadCSV(filteredHistory(), `historico-patio-facil.csv`));
  $('#reset-demo').addEventListener('click', () => {
    if (!window.confirm('Restaurar os dados de demonstração? Os registros atuais deste navegador serão substituídos.')) return;
    state = createDemoState();
    saveState();
    renderAll();
    toast('Dados de demonstração restaurados.');
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#global-search').focus(); }
  });
  $$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  }));
  window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) { state = loadState(); renderAll(); toast('Dados atualizados por outra aba.'); } });

  renderAll();
  switchPage('patio');
  window.setInterval(() => { renderMetrics(); renderPatio(); if (currentPage === 'lavagem') renderWash(); }, 30_000);
})();

