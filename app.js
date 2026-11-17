/**
 * Fintech iFood Control - JavaScript Vanilla Modular
 * Estética: Apple Bento Grid & Luxury Glassmorphism Dark UI
 * PWA, LocalStorage & Sistema Multi-Usuário Ready
 */

(function () {
  'use strict';

  // ==========================================
  // ESTADO PADRÃO (DEFAULT STATE)
  // ==========================================
  const DEFAULT_STATE = {
    settings: {
      metaExterior: 500,
      metaContas: 1450,
      metaReserva: 400,
      metaOficina: 250,
      metaTurnos: 26,
    },
    categories: {
      exterior: { accumulated: 0, peakExtra: 0 },
      contas: { accumulated: 0, spent: 0 },
      reserva: { accumulated: 0, peakExtra: 0 },
      oficina: { accumulated: 0, spent: 0 },
    },
    turnCount: 0,
    totalAccumulatedMonth: 0,
    totalPeakExtra: 0,
    entries: [],
    expenses: [],
    challenge: {
      mode: 100, // 100, 150 ou 283 blocos
      checked: {}, // { [index]: true }
    },
    debts: [
      { id: 1, title: 'Internet / Spotify', value: 84.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: [] },
      { id: 2, title: 'Crédito', value: 173.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: [] },
      { id: 3, title: 'Cartão Nubank', value: 320.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: [] },
      { id: 4, title: 'Empréstimo Nubank', value: 215.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: [] },
      { id: 5, title: 'Nova Compra Parcelada', value: 70.38, months: ['fev', 'mar', 'abr'], paidMonths: [], isHighlight: true },
    ],
    selectedDebtMonth: 'fev',
    privacyMode: false,
  };

  const USERS_STORAGE_KEY = 'fintech_users_list_v1';
  const ACTIVE_USER_KEY = 'fintech_active_user_v1';
  const LEGACY_STORAGE_KEY = 'fintech_ifood_control_v1';
  const LICENSE_STORAGE_KEY = 'fintech_license_key_v1';
  const REMOTE_KEYS_URL = 'https://raw.githubusercontent.com/conectcontent/ifood-control/main/chaves-autorizadas.json';
  const FALLBACK_KEYS = ['CONECT2026', 'MICHAEL-VIP', 'IFOOD-PRO-01', 'IFOOD-PRO-02', 'VIP-ENTREGADOR'];

  let appState = loadState();
  let pendingPeakEntry = null;

  // ==========================================
  // CONTROLE DE ACESSO & LICENÇA (WHITELIST)
  // ==========================================
  async function fetchAuthorizedKeys() {
    try {
      const res = await fetch(REMOTE_KEYS_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.chaves_ativas)) {
          return data;
        }
      }
    } catch (e) {
      try {
        const localRes = await fetch('./chaves-autorizadas.json');
        if (localRes.ok) return await localRes.json();
      } catch (err) {}
    }
    return {
      master_key: 'CONECT2026',
      chaves_ativas: FALLBACK_KEYS,
    };
  }

  async function checkLicenseStatus() {
    const activeKey = localStorage.getItem(LICENSE_STORAGE_KEY);
    const screen = document.getElementById('activationScreen');
    const label = document.getElementById('licenseStatusLabel');

    if (!activeKey) {
      if (screen) screen.classList.remove('hidden');
      return false;
    }

    if (label) label.textContent = 'Licença Ativa (Autorizado)';
    if (screen) screen.classList.add('hidden');

    if (navigator.onLine) {
      try {
        const data = await fetchAuthorizedKeys();
        const upperKey = activeKey.toUpperCase().trim();
        const isAuthorized = upperKey === data.master_key || (data.chaves_ativas || []).includes(upperKey);
        if (!isAuthorized) {
          localStorage.removeItem(LICENSE_STORAGE_KEY);
          if (screen) screen.classList.remove('hidden');
          showToast('Sua chave foi revogada pelo administrador!', '🔒');
          return false;
        }
      } catch (e) {}
    }
    return true;
  }

  async function validateAndActivateKey(rawKey) {
    if (!rawKey || !rawKey.trim()) {
      showToast('Digite a chave de ativação!', '⚠️');
      return;
    }

    const key = rawKey.toUpperCase().trim();
    const btn = document.getElementById('btnActivateApp');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Verificando chave...</span>';
    }

    const data = await fetchAuthorizedKeys();
    const isAuthorized = key === data.master_key || (data.chaves_ativas || []).includes(key);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="key" class="w-4 h-4"></i><span>Desbloquear Aplicativo</span>';
      if (window.lucide) window.lucide.createIcons();
    }

    if (isAuthorized) {
      localStorage.setItem(LICENSE_STORAGE_KEY, key);
      const screen = document.getElementById('activationScreen');
      if (screen) screen.classList.add('hidden');
      const label = document.getElementById('licenseStatusLabel');
      if (label) label.textContent = 'Licença Ativa (Autorizado)';
      triggerHaptic(40);
      showToast('Aplicativo desbloqueado com sucesso! Seja bem-vindo!', '🎉');
      renderAll();
    } else {
      triggerHaptic(50);
      showToast('Chave inválida ou não autorizada!', '❌');
    }
  }

  function revokeLocalLicense() {
    if (!confirm('Deseja desconectar a chave de acesso atual e bloquear o aplicativo?')) return;
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    const screen = document.getElementById('activationScreen');
    if (screen) screen.classList.remove('hidden');
    triggerHaptic(20);
    showToast('Chave desconectada. Digite uma nova chave.', '🔒');
  }

  // ==========================================
  // SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA (GITHUB)
  // ==========================================
  const CURRENT_APP_VERSION = '1.0.0';
  const VERSION_MANIFEST_URL = 'https://raw.githubusercontent.com/conectcontent/ifood-control/main/version.json';
  let pendingUpdateData = null;

  async function checkForAppUpdates(silent = true) {
    const iconCheck = document.getElementById('iconCheckUpdate');
    if (!silent && iconCheck) {
      iconCheck.classList.add('animate-spin');
    }

    try {
      const res = await fetch(`${VERSION_MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          const isNewer = compareVersions(data.version, CURRENT_APP_VERSION) > 0;
          if (isNewer) {
            pendingUpdateData = data;
            showUpdateModal(data);
            triggerHaptic(40);
            return true;
          } else if (!silent) {
            showToast(`Seu app já está na versão mais recente (v${CURRENT_APP_VERSION})!`, '✅');
          }
        }
      }
    } catch (e) {
      if (!silent) {
        showToast('Não foi possível verificar atualizações no momento.', '⚠️');
      }
    } finally {
      if (!silent && iconCheck) {
        iconCheck.classList.remove('animate-spin');
      }
    }
    return false;
  }

  function compareVersions(v1, v2) {
    const p1 = (v1 || '0').split('.').map(Number);
    const p2 = (v2 || '0').split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  function showUpdateModal(data) {
    const modal = document.getElementById('modalUpdateAvailable');
    if (!modal) return;

    const badge = document.getElementById('updateVersionBadge');
    const notes = document.getElementById('updateReleaseNotes');
    const apkBtn = document.getElementById('btnDownloadNewApk');

    if (badge) badge.textContent = `v${data.version}`;
    if (notes && data.releaseNotes) notes.textContent = data.releaseNotes;
    if (apkBtn && data.apkDownloadUrl) apkBtn.href = data.apkDownloadUrl;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function applyAppUpdate() {
    showToast('Atualizando aplicativo...', '🚀');
    triggerHaptic(30);

    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {}
    }

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage('SKIP_WAITING');
          }
          await reg.update();
        }
      } catch (e) {}
    }

    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  }

  // ==========================================
  // GESTÃO MULTI-USUÁRIO & PERSISTÊNCIA
  // ==========================================
  function getUsersList() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    const defaultUsers = [
      { id: 'user_1', name: 'Michael', vehicle: 'bike', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  function getActiveUserId() {
    let activeId = localStorage.getItem(ACTIVE_USER_KEY);
    const users = getUsersList();
    if (!activeId || !users.some((u) => u.id === activeId)) {
      activeId = users[0].id;
      localStorage.setItem(ACTIVE_USER_KEY, activeId);
    }
    return activeId;
  }

  function getCurrentUser() {
    const activeId = getActiveUserId();
    const users = getUsersList();
    return users.find((u) => u.id === activeId) || users[0];
  }

  function getStorageKeyForUser(userId) {
    return `fintech_user_data_${userId}`;
  }

  function loadState() {
    try {
      const activeId = getActiveUserId();
      const userKey = getStorageKeyForUser(activeId);
      const saved = localStorage.getItem(userKey) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return deepMerge(DEFAULT_STATE, parsed);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do localStorage, usando padrão:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() {
    try {
      const activeId = getActiveUserId();
      const userKey = getStorageKeyForUser(activeId);
      localStorage.setItem(userKey, JSON.stringify(appState));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  function switchUser(targetUserId) {
    saveState();
    localStorage.setItem(ACTIVE_USER_KEY, targetUserId);
    appState = loadState();
    renderAll();
    triggerHaptic(25);
    const user = getUsersList().find((u) => u.id === targetUserId);
    showToast(`Perfil alterado para ${user ? user.name : 'novo usuário'}!`, '👤');
  }

  function registerNewUser(name, vehicle, initialMeta) {
    if (!name || !name.trim()) {
      showToast('Digite o nome do entregador!', '⚠️');
      return;
    }
    const users = getUsersList();
    const newId = `user_${Date.now()}`;
    const newUser = {
      id: newId,
      name: name.trim(),
      vehicle: vehicle || 'bike',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Salva o estado atual e inicializa novo usuário
    saveState();
    localStorage.setItem(ACTIVE_USER_KEY, newId);

    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    const meta = parseFloat(initialMeta);
    if (!isNaN(meta) && meta > 0) {
      const ratio = meta / 2600;
      appState.settings.metaExterior = Math.round(500 * ratio);
      appState.settings.metaContas = Math.round(1450 * ratio);
      appState.settings.metaReserva = Math.round(400 * ratio);
      appState.settings.metaOficina = Math.round(250 * ratio);
    }
    saveState();
    renderAll();
    triggerHaptic(35);
    showToast(`Usuário "${newUser.name}" cadastrado com sucesso!`, '🎉');
  }

  function deleteUser(userId) {
    let users = getUsersList();
    if (users.length <= 1) {
      showToast('Você não pode excluir o único perfil existente!', '⚠️');
      return;
    }
    const userToDelete = users.find((u) => u.id === userId);
    if (!confirm(`Tem certeza que deseja excluir o perfil de "${userToDelete ? userToDelete.name : 'usuário'}" e todos os seus dados?`)) return;

    localStorage.removeItem(getStorageKeyForUser(userId));
    users = users.filter((u) => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    if (getActiveUserId() === userId) {
      localStorage.setItem(ACTIVE_USER_KEY, users[0].id);
      appState = loadState();
    }
    renderAll();
    triggerHaptic(20);
    showToast('Perfil excluído com sucesso.', '🗑️');
  }

  function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // ==========================================
  // FORMATADORES E UTILITÁRIOS
  // ==========================================
  function formatBRL(value) {
    return (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  }

  function formatDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function triggerHaptic(duration = 20) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  }

  function showToast(message, icon = '✨') {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    iconEl.textContent = icon;
    toast.classList.remove('opacity-0', '-translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', '-translate-y-4');
    }, 2800);
  }

  // ==========================================
  // CÁLCULOS E REGRAS DE NEGÓCIO DO IFOOD
  // ==========================================
  function calculateProportions(baseAmount) {
    const settings = appState.settings;
    const totalMeta = settings.metaExterior + settings.metaContas + settings.metaReserva + settings.metaOficina;

    const fExterior = settings.metaExterior / totalMeta;
    const fContas = settings.metaContas / totalMeta;
    const fReserva = settings.metaReserva / totalMeta;

    const exterior = Number((baseAmount * fExterior).toFixed(2));
    const contas = Number((baseAmount * fContas).toFixed(2));
    const reserva = Number((baseAmount * fReserva).toFixed(2));
    const oficina = Number((baseAmount - (exterior + contas + reserva)).toFixed(2));

    return { exterior, contas, reserva, oficina };
  }

  function processDailyGain(val) {
    const total = Number(val);
    if (isNaN(total) || total <= 0) {
      showToast('Digite um valor válido de ganho!', '⚠️');
      return;
    }

    if (total > 100) {
      const base = 100;
      const surplus = total - 100;
      pendingPeakEntry = { total, base, surplus };
      openPeakModal(total, surplus);
    } else {
      commitDailyEntry(total, total, 0, 'nenhum');
    }
  }

  function commitDailyEntry(total, base, surplus, surplusChoice) {
    const split = calculateProportions(base);

    let extraExterior = 0;
    let extraReserva = 0;

    if (surplus > 0) {
      if (surplusChoice === 'exterior') {
        extraExterior = surplus;
      } else if (surplusChoice === 'reserva') {
        extraReserva = surplus;
      } else if (surplusChoice === 'half') {
        extraExterior = Number((surplus / 2).toFixed(2));
        extraReserva = Number((surplus - extraExterior).toFixed(2));
      }
    }

    appState.categories.exterior.accumulated += (split.exterior + extraExterior);
    appState.categories.exterior.peakExtra += extraExterior;

    appState.categories.contas.accumulated += split.contas;

    appState.categories.reserva.accumulated += (split.reserva + extraReserva);
    appState.categories.reserva.peakExtra += extraReserva;

    appState.categories.oficina.accumulated += split.oficina;

    appState.totalAccumulatedMonth += total;
    appState.totalPeakExtra += surplus;
    appState.turnCount += 1;

    const entryRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      total,
      base,
      surplus,
      surplusChoice,
      split: {
        exterior: split.exterior + extraExterior,
        contas: split.contas,
        reserva: split.reserva + extraReserva,
        oficina: split.oficina,
      },
    };
    appState.entries.unshift(entryRecord);

    saveState();
    renderAll();
    triggerHaptic(30);

    const input = document.getElementById('dailyGainInput');
    if (input) input.value = '';

    if (surplus > 0) {
      showToast(`Lançamento de R$ ${total.toFixed(2)} registrado com R$ ${surplus.toFixed(2)} de pico!`, '🚀');
    } else {
      showToast(`Ganho de R$ ${total.toFixed(2)} dividido com sucesso!`, '✅');
    }
  }

  function openPeakModal(total, surplus) {
    const modal = document.getElementById('modalExcedente');
    if (!modal) return;

    document.getElementById('modalPeakTotal').textContent = formatBRL(total);
    document.getElementById('modalPeakSurplus').textContent = formatBRL(surplus);
    document.getElementById('modalPeakSurplusText').textContent = formatBRL(surplus);

    document.getElementById('optSurplusExterior').textContent = `+${formatBRL(surplus)}`;
    document.getElementById('optSurplusReserva').textContent = `+${formatBRL(surplus)}`;
    const half = surplus / 2;
    document.getElementById('optSurplusHalf').textContent = `+${formatBRL(half)} cada`;

    modal.classList.remove('hidden');
    triggerHaptic(40);
  }

  function closePeakModal() {
    const modal = document.getElementById('modalExcedente');
    if (modal) modal.classList.add('hidden');
    pendingPeakEntry = null;
  }

  function registerContasExpense(desc, val) {
    const value = parseFloat(val);
    if (isNaN(value) || value <= 0) {
      showToast('Valor de gasto inválido!', '⚠️');
      return;
    }
    appState.categories.contas.spent += value;
    appState.expenses.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      category: 'contas',
      desc: desc || 'Gasto Geral',
      value,
    });
    saveState();
    renderAll();
    triggerHaptic(20);
    showToast(`Gasto de ${formatBRL(value)} registrado em Contas!`, '📉');
  }

  function registerOficinaMaintenance(desc, val) {
    const value = parseFloat(val);
    if (isNaN(value) || value <= 0) {
      showToast('Valor de manutenção inválido!', '⚠️');
      return;
    }
    appState.categories.oficina.spent += value;
    appState.expenses.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      category: 'oficina',
      desc: desc || 'Manutenção da Bike',
      value,
    });
    saveState();
    renderAll();
    triggerHaptic(20);
    showToast(`Manutenção de ${formatBRL(value)} registrada!`, '🚲');
  }

  // ==========================================
  // RENDERIZAÇÃO DA UI
  // ==========================================
  function renderAll() {
    renderUsersUI();
    renderHeader();
    renderDashboardBento();
    renderChallengeGrid();
    renderAnalyticsAndDonut();
    renderDebtsSection();
    renderSettingsForm();
    applyPrivacyMode();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderUsersUI() {
    const currentUser = getCurrentUser();
    const users = getUsersList();
    const initial = (currentUser.name || 'U').charAt(0).toUpperCase();

    // Header Profile Pill
    const headerAvatar = document.getElementById('headerUserAvatar');
    const headerName = document.getElementById('headerUserName');
    if (headerAvatar) headerAvatar.textContent = initial;
    if (headerName) headerName.textContent = currentUser.name;

    // Modal Active Profile Header
    const modalActiveAvatar = document.getElementById('modalActiveUserAvatar');
    const modalActiveName = document.getElementById('modalActiveUserName');
    if (modalActiveAvatar) modalActiveAvatar.textContent = initial;
    if (modalActiveName) modalActiveName.textContent = currentUser.name;

    // Modal Users List
    const modalUserList = document.getElementById('modalUserList');
    if (modalUserList) {
      modalUserList.innerHTML = '';
      users.forEach((user) => {
        const isActive = user.id === currentUser.id;
        const uInitial = (user.name || 'U').charAt(0).toUpperCase();
        const row = document.createElement('div');
        row.className = `p-2.5 rounded-2xl border flex items-center justify-between text-xs cursor-pointer active:scale-98 transition-all ${
          isActive
            ? 'bg-cyan-500/20 border-cyan-500/40 text-white'
            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
        }`;
        row.innerHTML = `
          <div class="flex items-center space-x-2.5">
            <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-white text-[11px]">
              ${uInitial}
            </div>
            <div>
              <p class="font-bold text-white">${user.name}</p>
              <p class="text-[10px] text-slate-400 capitalize">${user.vehicle || 'bike'}</p>
            </div>
          </div>
          ${isActive ? '<span class="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full">Ativo</span>' : '<span class="text-[10px] text-slate-400">Selecionar</span>'}
        `;
        row.addEventListener('click', () => {
          if (!isActive) {
            switchUser(user.id);
            document.getElementById('modalUserMenu').classList.add('hidden');
          }
        });
        modalUserList.appendChild(row);
      });
    }

    // Settings Users List Container
    const usersContainer = document.getElementById('usersListContainer');
    if (usersContainer) {
      usersContainer.innerHTML = '';
      users.forEach((user) => {
        const isActive = user.id === currentUser.id;
        const uInitial = (user.name || 'U').charAt(0).toUpperCase();
        const row = document.createElement('div');
        row.className = `p-3 rounded-2xl border flex items-center justify-between text-xs ${
          isActive
            ? 'bg-cyan-950/20 border-cyan-500/30 text-white'
            : 'bg-white/5 border-white/10 text-slate-300'
        }`;
        row.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-black text-white text-xs">
              ${uInitial}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-white">${user.name}</span>
                ${isActive ? '<span class="text-[9px] bg-cyan-500/20 text-cyan-300 font-extrabold px-1.5 py-0.2 rounded-full uppercase">Ativo</span>' : ''}
              </div>
              <span class="text-[10px] text-slate-400 capitalize">${user.vehicle || 'bike'}</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            ${
              !isActive
                ? `<button class="btn-switch-user px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white" data-id="${user.id}">Entrar</button>
                   <button class="btn-del-user p-1 text-slate-400 hover:text-rose-400" data-id="${user.id}" title="Excluir Perfil"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>`
                : ''
            }
          </div>
        `;

        const btnSwitch = row.querySelector('.btn-switch-user');
        if (btnSwitch) {
          btnSwitch.addEventListener('click', () => switchUser(user.id));
        }
        const btnDel = row.querySelector('.btn-del-user');
        if (btnDel) {
          btnDel.addEventListener('click', () => deleteUser(user.id));
        }

        usersContainer.appendChild(row);
      });
    }
  }

  function renderHeader() {
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
      const now = new Date();
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      dateEl.textContent = now.toLocaleDateString('pt-BR', options).replace('.', '');
    }

    const turnsEl = document.getElementById('headerTurnCount');
    if (turnsEl) {
      turnsEl.textContent = `${appState.turnCount}/${appState.settings.metaTurnos || 26}`;
    }
  }

  function renderDashboardBento() {
    const cats = appState.categories;
    const settings = appState.settings;

    const totalMeta = settings.metaExterior + settings.metaContas + settings.metaReserva + settings.metaOficina;
    const currentTotal = appState.totalAccumulatedMonth;
    const totalPct = Math.min(100, Math.round((currentTotal / (totalMeta || 1)) * 100));

    const totalEl = document.getElementById('totalMonthAccumulated');
    if (totalEl) totalEl.textContent = formatBRL(currentTotal);

    const generalBar = document.getElementById('generalProgressBar');
    if (generalBar) generalBar.style.width = `${totalPct}%`;

    const generalPctEl = document.getElementById('generalProgressPct');
    if (generalPctEl) generalPctEl.textContent = `${totalPct}%`;

    updateBentoCard('exterior', cats.exterior.accumulated, settings.metaExterior, cats.exterior.peakExtra);

    const saldoContas = Math.max(0, cats.contas.accumulated - cats.contas.spent);
    updateBentoCard('contas', saldoContas, settings.metaContas, null);

    updateBentoCard('reserva', cats.reserva.accumulated, settings.metaReserva, cats.reserva.peakExtra);

    const saldoOficina = Math.max(0, cats.oficina.accumulated - cats.oficina.spent);
    updateBentoCard('oficina', saldoOficina, settings.metaOficina, null);
  }

  function updateBentoCard(catKey, currentVal, targetVal, extraPeak) {
    const valEl = document.getElementById(`val-${catKey}`);
    const pctEl = document.getElementById(`pct-${catKey}`);
    const ringEl = document.getElementById(`ring-${catKey}`);
    const extraEl = document.getElementById(`extra-${catKey}`);

    if (valEl) valEl.textContent = formatBRL(currentVal);

    const pct = targetVal > 0 ? Math.min(100, Math.round((currentVal / targetVal) * 100)) : 0;
    if (pctEl) pctEl.textContent = `${pct}%`;

    if (ringEl) {
      const offset = 100 - pct;
      ringEl.setAttribute('stroke-dashoffset', offset);
    }

    if (extraEl && extraPeak !== null) {
      extraEl.textContent = `+${formatBRL(extraPeak)} pico`;
    }
  }

  function renderChallengeGrid() {
    const gridEl = document.getElementById('challengeGrid');
    if (!gridEl) return;

    const mode = appState.challenge.mode || 100;
    const checkedMap = appState.challenge.checked || {};
    let checkedCount = 0;

    document.querySelectorAll('.challenge-mode-btn').forEach((btn) => {
      const btnMode = parseInt(btn.dataset.mode, 10);
      if (btnMode === mode) {
        btn.classList.add('bg-purple-600', 'text-white', 'shadow-glow-purple');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('bg-purple-600', 'text-white', 'shadow-glow-purple');
        btn.classList.add('text-slate-400', 'hover:text-white');
      }
    });

    gridEl.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= mode; i++) {
      const isChecked = !!checkedMap[i];
      if (isChecked) checkedCount++;

      const block = document.createElement('button');
      block.type = 'button';
      block.className = `h-11 rounded-xl font-bold text-xs flex items-center justify-center transition-all tabular-numbers active:scale-90 ${
        isChecked
          ? 'bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/30 border border-white/30 scale-100'
          : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
      }`;
      block.textContent = isChecked ? `✓ ${i}` : `${i}`;
      block.dataset.index = i;

      block.addEventListener('click', () => {
        toggleChallengeBlock(i);
      });

      fragment.appendChild(block);
    }
    gridEl.appendChild(fragment);

    const checkedCountEl = document.getElementById('challengeCheckedCount');
    const totalCountEl = document.getElementById('challengeTotalCount');
    const pctEl = document.getElementById('challengePct');
    const barEl = document.getElementById('challengeProgressBar');
    const accumValEl = document.getElementById('challengeAccumulatedVal');

    if (checkedCountEl) checkedCountEl.textContent = checkedCount;
    if (totalCountEl) totalCountEl.textContent = mode;

    const pct = Math.round((checkedCount / mode) * 100);
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;

    if (accumValEl) {
      const estimatedValue = checkedCount * 100;
      accumValEl.textContent = formatBRL(estimatedValue);
    }
  }

  function toggleChallengeBlock(index) {
    if (!appState.challenge.checked) appState.challenge.checked = {};
    const current = !!appState.challenge.checked[index];
    if (current) {
      delete appState.challenge.checked[index];
    } else {
      appState.challenge.checked[index] = true;
    }
    saveState();
    renderChallengeGrid();
    triggerHaptic(25);
  }

  function renderAnalyticsAndDonut() {
    const cats = appState.categories;
    const settings = appState.settings;

    const vExt = cats.exterior.accumulated;
    const vCon = Math.max(0, cats.contas.accumulated - cats.contas.spent);
    const vRes = cats.reserva.accumulated;
    const vOfi = Math.max(0, cats.oficina.accumulated - cats.oficina.spent);
    const total = vExt + vCon + vRes + vOfi;

    const chartTotalDisplay = document.getElementById('chartTotalDisplay');
    if (chartTotalDisplay) chartTotalDisplay.textContent = formatBRL(total);

    const centerTotal = document.getElementById('chartCenterTotal');
    if (centerTotal) centerTotal.textContent = formatBRL(total);

    const chartTurnCount = document.getElementById('chartTurnCount');
    if (chartTurnCount) chartTurnCount.textContent = `${appState.turnCount} turnos realizados`;

    document.getElementById('chartLegExterior').textContent = formatBRL(vExt);
    document.getElementById('chartLegContas').textContent = formatBRL(vCon);
    document.getElementById('chartLegReserva').textContent = formatBRL(vRes);
    document.getElementById('chartLegOficina').textContent = formatBRL(vOfi);

    const doneTurns = appState.turnCount;
    const metaTurns = settings.metaTurnos || 26;
    const kpiTurnosDone = document.getElementById('kpiTurnosDone');
    if (kpiTurnosDone) {
      kpiTurnosDone.innerHTML = `${doneTurns} <span class="text-xs font-normal text-slate-400">/ ${metaTurns}</span>`;
    }
    const kpiTurnosBar = document.getElementById('kpiTurnosBar');
    if (kpiTurnosBar) {
      const turnPct = Math.min(100, Math.round((doneTurns / metaTurns) * 100));
      kpiTurnosBar.style.width = `${turnPct}%`;
    }

    const kpiLucroExtra = document.getElementById('kpiLucroExtra');
    if (kpiLucroExtra) {
      kpiLucroExtra.textContent = formatBRL(appState.totalPeakExtra);
    }

    renderDonutSvg(vExt, vCon, vRes, vOfi, total);
    renderHistoryList();
  }

  function renderDonutSvg(vExt, vCon, vRes, vOfi, total) {
    const svg = document.getElementById('donutSvg');
    if (!svg) return;

    svg.innerHTML = '';
    const center = 50;
    const radius = 15.9155;

    if (total <= 0) {
      const emptyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      emptyCircle.setAttribute('cx', center);
      emptyCircle.setAttribute('cy', center);
      emptyCircle.setAttribute('r', radius);
      emptyCircle.setAttribute('fill', 'none');
      emptyCircle.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      emptyCircle.setAttribute('stroke-width', '4');
      svg.appendChild(emptyCircle);
      return;
    }

    const segments = [
      { val: vExt, color: '#06B6D4' },
      { val: vCon, color: '#10B981' },
      { val: vRes, color: '#A855F7' },
      { val: vOfi, color: '#F59E0B' },
    ];

    let accumulatedPct = 0;

    segments.forEach((seg) => {
      const pct = (seg.val / total) * 100;
      if (pct <= 0) return;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center);
      circle.setAttribute('cy', center);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', seg.color);
      circle.setAttribute('stroke-width', '4.5');
      circle.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
      circle.setAttribute('stroke-dashoffset', -accumulatedPct);
      circle.setAttribute('class', 'transition-all duration-700');
      svg.appendChild(circle);

      accumulatedPct += pct;
    });
  }

  function renderHistoryList() {
    const listEl = document.getElementById('historyList');
    const countEl = document.getElementById('historyCount');
    if (!listEl) return;

    const entries = appState.entries || [];
    if (countEl) countEl.textContent = `${entries.length} lançamentos`;

    if (entries.length === 0) {
      listEl.innerHTML = `
        <div class="py-6 text-center text-slate-500 text-xs">
          Nenhum faturamento registrado ainda.<br>Faça o primeiro lançamento no Painel!
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    entries.slice(0, 15).forEach((entry) => {
      const isPeak = entry.surplus > 0;
      const row = document.createElement('div');
      row.className = 'p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs';
      row.innerHTML = `
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl ${isPeak ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-slate-300'} flex items-center justify-center font-bold">
            ${isPeak ? '⚡' : '🛵'}
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-white tabular-numbers financial-val">${formatBRL(entry.total)}</span>
              ${isPeak ? `<span class="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">+${formatBRL(entry.surplus)} pico</span>` : ''}
            </div>
            <span class="text-[10px] text-slate-400">${formatDate(entry.date)}</span>
          </div>
        </div>
        <button class="btn-delete-entry text-slate-500 hover:text-rose-400 p-1.5 rounded-lg active:scale-90 transition-all" data-id="${entry.id}" title="Excluir lançamento">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;

      row.querySelector('.btn-delete-entry').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEntry(entry.id);
      });

      listEl.appendChild(row);
    });
  }

  function deleteEntry(id) {
    if (!confirm('Deseja estornar e remover este lançamento?')) return;

    const index = appState.entries.findIndex((e) => e.id === id);
    if (index === -1) return;

    const entry = appState.entries[index];

    appState.categories.exterior.accumulated = Math.max(0, appState.categories.exterior.accumulated - entry.split.exterior);
    appState.categories.contas.accumulated = Math.max(0, appState.categories.contas.accumulated - entry.split.contas);
    appState.categories.reserva.accumulated = Math.max(0, appState.categories.reserva.accumulated - entry.split.reserva);
    appState.categories.oficina.accumulated = Math.max(0, appState.categories.oficina.accumulated - entry.split.oficina);

    if (entry.surplus > 0) {
      appState.totalPeakExtra = Math.max(0, appState.totalPeakExtra - entry.surplus);
    }
    appState.totalAccumulatedMonth = Math.max(0, appState.totalAccumulatedMonth - entry.total);
    appState.turnCount = Math.max(0, appState.turnCount - 1);

    appState.entries.splice(index, 1);
    saveState();
    renderAll();
    showToast('Lançamento estornado com sucesso!', '🗑️');
  }

  function renderDebtsSection() {
    const listEl = document.getElementById('debtsList');
    if (!listEl) return;

    const currentMonth = appState.selectedDebtMonth || 'fev';
    const monthNames = { jan: 'Janeiro', fev: 'Fevereiro', mar: 'Março', abr: 'Abril' };

    document.querySelectorAll('.month-selector-btn').forEach((btn) => {
      const m = btn.dataset.month;
      if (m === currentMonth) {
        btn.classList.add('bg-emerald-500', 'text-black', 'font-black');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('bg-emerald-500', 'text-black', 'font-black');
        btn.classList.add('text-slate-400', 'hover:text-white');
      }
    });

    const monthLabelEl = document.getElementById('debtsMonthLabel');
    if (monthLabelEl) monthLabelEl.textContent = `Mês: ${monthNames[currentMonth] || currentMonth}`;

    const debts = appState.debts || [];
    const activeDebts = debts.filter((d) => d.months.includes(currentMonth));

    let totalMonth = 0;
    let pendingMonth = 0;

    listEl.innerHTML = '';

    if (activeDebts.length === 0) {
      listEl.innerHTML = `
        <div class="py-6 text-center text-slate-500 text-xs">
          Nenhum compromisso cadastrado para ${monthNames[currentMonth]}.
        </div>
      `;
    }

    activeDebts.forEach((debt) => {
      const isPaid = (debt.paidMonths || []).includes(currentMonth);
      totalMonth += debt.value;
      if (!isPaid) pendingMonth += debt.value;

      const card = document.createElement('div');
      card.className = `p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
        isPaid
          ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-400'
          : debt.isHighlight
          ? 'bg-cyan-950/25 border-cyan-500/40 text-white'
          : 'bg-white/5 border-white/10 text-white'
      }`;

      card.innerHTML = `
        <div class="flex items-center space-x-3">
          <button class="btn-toggle-paid w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
            isPaid
              ? 'bg-emerald-500 border-emerald-400 text-black font-black'
              : 'border-white/20 bg-white/5 text-transparent hover:border-emerald-400'
          }" data-id="${debt.id}">
            ✓
          </button>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-bold ${isPaid ? 'line-through text-slate-400' : 'text-white'}">${debt.title}</span>
              ${debt.isHighlight ? '<span class="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">Novo</span>' : ''}
            </div>
            <span class="text-[10px] text-slate-400 tabular-numbers financial-val">${formatBRL(debt.value)}</span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-[10px] font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}">
            ${isPaid ? 'Liquidado' : 'Pendente'}
          </span>
          ${
            !isPaid
              ? `<button class="btn-pay-from-contas px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold active:scale-95 transition-all" data-id="${debt.id}">
                  Abater Contas
                </button>`
              : ''
          }
        </div>
      `;

      card.querySelector('.btn-toggle-paid').addEventListener('click', () => {
        toggleDebtPaid(debt.id, currentMonth);
      });

      const btnPay = card.querySelector('.btn-pay-from-contas');
      if (btnPay) {
        btnPay.addEventListener('click', () => {
          payDebtFromContas(debt, currentMonth);
        });
      }

      listEl.appendChild(card);
    });

    const totalEl = document.getElementById('monthTotalDebts');
    const pendingEl = document.getElementById('monthPendingDebts');
    if (totalEl) totalEl.textContent = formatBRL(totalMonth);
    if (pendingEl) pendingEl.textContent = formatBRL(pendingMonth);

    const highlightStatus = document.getElementById('highlightPurchaseStatus');
    if (highlightStatus) {
      const purchaseFev = (appState.debts || []).find((d) => d.id === 5);
      const isFevPaid = purchaseFev && (purchaseFev.paidMonths || []).includes('fev');
      highlightStatus.textContent = isFevPaid ? '✅ Liquidada em Fev' : '⏳ Pendente para Fev';
      highlightStatus.className = isFevPaid ? 'font-bold text-emerald-400' : 'font-bold text-cyan-400';
    }
  }

  function toggleDebtPaid(debtId, month) {
    const debt = (appState.debts || []).find((d) => d.id === debtId);
    if (!debt) return;

    if (!debt.paidMonths) debt.paidMonths = [];
    const idx = debt.paidMonths.indexOf(month);

    if (idx > -1) {
      debt.paidMonths.splice(idx, 1);
      showToast(`${debt.title} marcado como pendente`, '⏳');
    } else {
      debt.paidMonths.push(month);
      showToast(`${debt.title} marcado como pago!`, '✅');
    }

    saveState();
    renderDebtsSection();
    triggerHaptic(20);
  }

  function payDebtFromContas(debt, month) {
    if (!confirm(`Deseja abater ${formatBRL(debt.value)} de "${debt.title}" diretamente do saldo da categoria Minhas Contas?`)) return;

    registerContasExpense(`Pagamento: ${debt.title} (${month.toUpperCase()})`, debt.value);

    if (!debt.paidMonths) debt.paidMonths = [];
    if (!debt.paidMonths.includes(month)) {
      debt.paidMonths.push(month);
    }

    saveState();
    renderAll();
    showToast(`${debt.title} quitado e abatido das Contas!`, '🎉');
  }

  function addNewDebt(title, value, months) {
    if (!title || isNaN(value) || value <= 0 || months.length === 0) {
      showToast('Preencha título, valor e ao menos 1 mês!', '⚠️');
      return;
    }

    const newId = Date.now();
    appState.debts.push({
      id: newId,
      title,
      value: parseFloat(value),
      months,
      paidMonths: [],
      isHighlight: false,
    });

    saveState();
    renderDebtsSection();
    triggerHaptic(20);
    showToast(`Dívida "${title}" adicionada!`, '💳');
  }

  function renderSettingsForm() {
    const s = appState.settings;
    setInputValue('settingMetaExterior', s.metaExterior);
    setInputValue('settingMetaContas', s.metaContas);
    setInputValue('settingMetaReserva', s.metaReserva);
    setInputValue('settingMetaOficina', s.metaOficina);
    setInputValue('settingMetaTurnos', s.metaTurnos);
  }

  function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function saveSettings() {
    const ext = parseFloat(document.getElementById('settingMetaExterior').value) || 500;
    const con = parseFloat(document.getElementById('settingMetaContas').value) || 1450;
    const res = parseFloat(document.getElementById('settingMetaReserva').value) || 400;
    const ofi = parseFloat(document.getElementById('settingMetaOficina').value) || 250;
    const tur = parseInt(document.getElementById('settingMetaTurnos').value, 10) || 26;

    appState.settings = {
      metaExterior: ext,
      metaContas: con,
      metaReserva: res,
      metaOficina: ofi,
      metaTurnos: tur,
    };

    saveState();
    renderAll();
    triggerHaptic(20);
    showToast('Metas atualizadas com sucesso!', '⚙️');
  }

  function exportBackupJSON() {
    try {
      const activeUser = getCurrentUser();
      const backupData = {
        user: activeUser,
        state: appState,
        exportedAt: new Date().toISOString(),
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `fintech-ifood-${activeUser.name.toLowerCase()}-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup JSON exportado com sucesso!', '💾');
    } catch (e) {
      showToast('Erro ao exportar backup', '❌');
    }
  }

  function importBackupJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        const dataToLoad = imported.state ? imported.state : imported;
        if (dataToLoad && (dataToLoad.categories || dataToLoad.settings)) {
          appState = deepMerge(DEFAULT_STATE, dataToLoad);
          saveState();
          renderAll();
          showToast('Backup importado com sucesso!', '📥');
        } else {
          showToast('Arquivo JSON com formato inválido!', '❌');
        }
      } catch (err) {
        showToast('Erro ao ler o arquivo JSON', '❌');
      }
    };
    reader.readAsText(file);
  }

  function loadDemoData() {
    if (!confirm('Deseja carregar dados realistas de demonstração para testar o aplicativo?')) return;

    appState = {
      settings: {
        metaExterior: 500,
        metaContas: 1450,
        metaReserva: 400,
        metaOficina: 250,
        metaTurnos: 26,
      },
      categories: {
        exterior: { accumulated: 295.40, peakExtra: 60.00 },
        contas: { accumulated: 780.78, spent: 257.38 },
        reserva: { accumulated: 255.32, peakExtra: 40.00 },
        oficina: { accumulated: 134.68, spent: 35.00 },
      },
      turnCount: 14,
      totalAccumulatedMonth: 1566.18,
      totalPeakExtra: 100.00,
      entries: [
        { id: 101, date: new Date(Date.now() - 3600000 * 2).toISOString(), total: 140, base: 100, surplus: 40, surplusChoice: 'exterior', split: { exterior: 59.23, contas: 55.77, reserva: 15.38, oficina: 9.62 } },
        { id: 102, date: new Date(Date.now() - 3600000 * 26).toISOString(), total: 100, base: 100, surplus: 0, surplusChoice: 'nenhum', split: { exterior: 19.23, contas: 55.77, reserva: 15.38, oficina: 9.62 } },
        { id: 103, date: new Date(Date.now() - 3600000 * 50).toISOString(), total: 160, base: 100, surplus: 60, surplusChoice: 'half', split: { exterior: 49.23, contas: 55.77, reserva: 45.38, oficina: 9.62 } },
        { id: 104, date: new Date(Date.now() - 3600000 * 74).toISOString(), total: 100, base: 100, surplus: 0, surplusChoice: 'nenhum', split: { exterior: 19.23, contas: 55.77, reserva: 15.38, oficina: 9.62 } },
      ],
      expenses: [
        { id: 201, date: new Date(Date.now() - 3600000 * 12).toISOString(), category: 'contas', desc: 'Internet / Spotify', value: 84.00 },
        { id: 202, date: new Date(Date.now() - 3600000 * 24).toISOString(), category: 'contas', desc: 'Crédito', value: 173.00 },
        { id: 203, date: new Date(Date.now() - 3600000 * 48).toISOString(), category: 'oficina', desc: 'Câmara e remendo bike', value: 35.00 },
      ],
      challenge: {
        mode: 100,
        checked: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true },
      },
      debts: [
        { id: 1, title: 'Internet / Spotify', value: 84.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: ['jan', 'fev'] },
        { id: 2, title: 'Crédito', value: 173.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: ['jan', 'fev'] },
        { id: 3, title: 'Cartão Nubank', value: 320.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: ['jan'] },
        { id: 4, title: 'Empréstimo Nubank', value: 215.00, months: ['jan', 'fev', 'mar', 'abr'], paidMonths: ['jan'] },
        { id: 5, title: 'Nova Compra Parcelada', value: 70.38, months: ['fev', 'mar', 'abr'], paidMonths: [], isHighlight: true },
      ],
      selectedDebtMonth: 'fev',
      privacyMode: false,
    };

    saveState();
    renderAll();
    showToast('Dados de demonstração carregados com sucesso!', '🚀');
  }

  function resetAllData() {
    if (!confirm('ATENÇÃO: Deseja apagar todos os lançamentos do perfil atual?')) return;
    const activeId = getActiveUserId();
    localStorage.removeItem(getStorageKeyForUser(activeId));
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    renderAll();
    showToast('Dados do usuário atual foram resetados.', '🧹');
  }

  function togglePrivacy() {
    appState.privacyMode = !appState.privacyMode;
    saveState();
    applyPrivacyMode();
    triggerHaptic(15);
  }

  function applyPrivacyMode() {
    const isBlur = !!appState.privacyMode;
    const values = document.querySelectorAll('.financial-val');
    const eyeIcon = document.getElementById('privacyIcon');

    values.forEach((el) => {
      if (isBlur) {
        el.classList.add('privacy-blur');
      } else {
        el.classList.remove('privacy-blur');
      }
    });

    if (eyeIcon) {
      eyeIcon.setAttribute('data-lucide', isBlur ? 'eye-off' : 'eye');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function switchTab(targetId) {
    const tabs = ['tab-painel', 'tab-desafio', 'tab-graficos', 'tab-dividas', 'tab-ajustes'];

    tabs.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === targetId) {
        el.classList.remove('hidden');
        el.classList.add('flex', 'fade-in-tab');
      } else {
        el.classList.add('hidden');
        el.classList.remove('flex', 'fade-in-tab');
      }
    });

    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      const isTarget = btn.dataset.target === targetId;
      const iconWrap = btn.querySelector('.nav-icon-wrapper');
      const label = btn.querySelector('.nav-label');

      if (isTarget) {
        iconWrap.className = 'nav-icon-wrapper w-9 h-9 rounded-full flex items-center justify-center transition-all bg-cyan-500/20 text-cyan-400 shadow-glow-cyan';
        label.className = 'nav-label text-[10px] font-bold tracking-tight text-cyan-300 mt-0.5';
      } else {
        iconWrap.className = 'nav-icon-wrapper w-9 h-9 rounded-full flex items-center justify-center transition-all text-slate-400 group-hover:text-white';
        label.className = 'nav-label text-[10px] font-semibold tracking-tight text-slate-400 mt-0.5';
      }
    });

    if (targetId === 'tab-graficos') {
      renderAnalyticsAndDonut();
    } else if (targetId === 'tab-desafio') {
      renderChallengeGrid();
    } else if (targetId === 'tab-dividas') {
      renderDebtsSection();
    }

    triggerHaptic(15);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // INICIALIZAÇÃO DE EVENT LISTENERS
  // ==========================================
  function initEvents() {
    // Menu e Perfil do Usuário
    const btnUserProfile = document.getElementById('btnUserProfile');
    const modalUserMenu = document.getElementById('modalUserMenu');
    const btnCloseUserMenu = document.getElementById('btnCloseUserMenu');
    const btnAddNewUserFromMenu = document.getElementById('btnAddNewUserFromMenu');
    const btnOpenNewUserModal = document.getElementById('btnOpenNewUserModal');
    const modalRegisterUser = document.getElementById('modalRegisterUser');
    const btnCancelRegUser = document.getElementById('btnCancelRegUser');
    const btnConfirmRegUser = document.getElementById('btnConfirmRegUser');

    if (btnUserProfile && modalUserMenu) {
      btnUserProfile.addEventListener('click', () => {
        renderUsersUI();
        modalUserMenu.classList.remove('hidden');
        triggerHaptic(15);
      });
      if (btnCloseUserMenu) {
        btnCloseUserMenu.addEventListener('click', () => modalUserMenu.classList.add('hidden'));
      }
    }

    function openRegUserModal() {
      if (modalUserMenu) modalUserMenu.classList.add('hidden');
      if (modalRegisterUser) {
        document.getElementById('regUserName').value = '';
        document.getElementById('regUserMeta').value = '2600';
        modalRegisterUser.classList.remove('hidden');
        triggerHaptic(15);
      }
    }

    if (btnAddNewUserFromMenu) btnAddNewUserFromMenu.addEventListener('click', openRegUserModal);
    if (btnOpenNewUserModal) btnOpenNewUserModal.addEventListener('click', openRegUserModal);

    if (btnCancelRegUser && modalRegisterUser) {
      btnCancelRegUser.addEventListener('click', () => modalRegisterUser.classList.add('hidden'));
    }

    if (btnConfirmRegUser && modalRegisterUser) {
      btnConfirmRegUser.addEventListener('click', () => {
        const name = document.getElementById('regUserName').value;
        const vehicle = document.getElementById('regUserVehicle').value;
        const meta = document.getElementById('regUserMeta').value;
        registerNewUser(name, vehicle, meta);
        modalRegisterUser.classList.add('hidden');
      });
    }

    // Dock Navigation
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target) switchTab(target);
      });
    });

    const btnGoToDebts = document.getElementById('btnGoToDebts');
    if (btnGoToDebts) {
      btnGoToDebts.addEventListener('click', () => {
        appState.selectedDebtMonth = 'fev';
        switchTab('tab-dividas');
      });
    }

    const privacyBtn = document.getElementById('togglePrivacyBtn');
    if (privacyBtn) {
      privacyBtn.addEventListener('click', togglePrivacy);
    }

    const btnSplit = document.getElementById('btnSplitDaily');
    const dailyInput = document.getElementById('dailyGainInput');
    if (btnSplit && dailyInput) {
      btnSplit.addEventListener('click', () => {
        processDailyGain(dailyInput.value);
      });

      dailyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          processDailyGain(dailyInput.value);
        }
      });
    }

    document.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.val;
        if (dailyInput) {
          dailyInput.value = val;
          triggerHaptic(15);
        }
      });
    });

    document.querySelectorAll('.choice-surplus-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        if (pendingPeakEntry) {
          commitDailyEntry(
            pendingPeakEntry.total,
            pendingPeakEntry.base,
            pendingPeakEntry.surplus,
            choice
          );
        }
        closePeakModal();
      });
    });

    const btnCancelPeak = document.getElementById('btnCancelPeakModal');
    if (btnCancelPeak) {
      btnCancelPeak.addEventListener('click', closePeakModal);
    }

    const btnQuickExpense = document.getElementById('btnQuickExpense');
    const modalExpense = document.getElementById('modalExpense');
    const btnCancelExpense = document.getElementById('btnCancelExpense');
    const btnConfirmExpense = document.getElementById('btnConfirmExpense');

    if (btnQuickExpense && modalExpense) {
      btnQuickExpense.addEventListener('click', () => {
        document.getElementById('expenseDesc').value = '';
        document.getElementById('expenseValue').value = '';
        modalExpense.classList.remove('hidden');
        triggerHaptic(15);
      });
      btnCancelExpense.addEventListener('click', () => modalExpense.classList.add('hidden'));
      btnConfirmExpense.addEventListener('click', () => {
        const desc = document.getElementById('expenseDesc').value;
        const val = document.getElementById('expenseValue').value;
        registerContasExpense(desc, val);
        modalExpense.classList.add('hidden');
      });
    }

    const btnQuickMaint = document.getElementById('btnQuickMaintenance');
    const modalMaint = document.getElementById('modalMaintenance');
    const btnCancelMaint = document.getElementById('btnCancelMaint');
    const btnConfirmMaint = document.getElementById('btnConfirmMaint');

    if (btnQuickMaint && modalMaint) {
      btnQuickMaint.addEventListener('click', () => {
        document.getElementById('maintDesc').value = '';
        document.getElementById('maintValue').value = '';
        modalMaint.classList.remove('hidden');
        triggerHaptic(15);
      });
      btnCancelMaint.addEventListener('click', () => modalMaint.classList.add('hidden'));
      btnConfirmMaint.addEventListener('click', () => {
        const desc = document.getElementById('maintDesc').value;
        const val = document.getElementById('maintValue').value;
        registerOficinaMaintenance(desc, val);
        modalMaint.classList.add('hidden');
      });
    }

    document.querySelectorAll('.challenge-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = parseInt(btn.dataset.mode, 10);
        appState.challenge.mode = mode;
        saveState();
        renderChallengeGrid();
        triggerHaptic(15);
      });
    });

    document.querySelectorAll('.month-selector-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const month = btn.dataset.month;
        appState.selectedDebtMonth = month;
        saveState();
        renderDebtsSection();
        triggerHaptic(15);
      });
    });

    const btnNewDebt = document.getElementById('btnNewDebtModal');
    const modalNewDebt = document.getElementById('modalNewDebt');
    const btnCancelNewDebt = document.getElementById('btnCancelNewDebt');
    const btnConfirmNewDebt = document.getElementById('btnConfirmNewDebt');

    if (btnNewDebt && modalNewDebt) {
      btnNewDebt.addEventListener('click', () => {
        document.getElementById('newDebtTitle').value = '';
        document.getElementById('newDebtValue').value = '';
        modalNewDebt.classList.remove('hidden');
      });
      btnCancelNewDebt.addEventListener('click', () => modalNewDebt.classList.add('hidden'));
      btnConfirmNewDebt.addEventListener('click', () => {
        const title = document.getElementById('newDebtTitle').value;
        const value = document.getElementById('newDebtValue').value;
        const months = [];
        if (document.getElementById('chkJan').checked) months.push('jan');
        if (document.getElementById('chkFev').checked) months.push('fev');
        if (document.getElementById('chkMar').checked) months.push('mar');
        if (document.getElementById('chkAbr').checked) months.push('abr');

        addNewDebt(title, value, months);
        modalNewDebt.classList.add('hidden');
      });
    }

    const btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', saveSettings);
    }

    const btnExport = document.getElementById('btnExportBackup');
    if (btnExport) btnExport.addEventListener('click', exportBackupJSON);

    const importInput = document.getElementById('importFileInput');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importBackupJSON(file);
      });
    }

    const btnDemo = document.getElementById('btnLoadDemoData');
    if (btnDemo) btnDemo.addEventListener('click', loadDemoData);

    const btnReset = document.getElementById('btnResetAll');
    if (btnReset) btnReset.addEventListener('click', resetAllData);

    // Controle de Acesso e Licença
    const btnActivateApp = document.getElementById('btnActivateApp');
    const activationKeyInput = document.getElementById('activationKeyInput');
    const btnRevokeLocalLicense = document.getElementById('btnRevokeLocalLicense');

    if (btnActivateApp && activationKeyInput) {
      btnActivateApp.addEventListener('click', () => {
        validateAndActivateKey(activationKeyInput.value);
      });
      activationKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          validateAndActivateKey(activationKeyInput.value);
        }
      });
    }

    const toggleShowKeyInput = document.getElementById('toggleShowKeyInput');
    const iconEyeKey = document.getElementById('iconEyeKey');
    if (toggleShowKeyInput && activationKeyInput && iconEyeKey) {
      toggleShowKeyInput.addEventListener('click', () => {
        const isPass = activationKeyInput.type === 'password';
        activationKeyInput.type = isPass ? 'text' : 'password';
        iconEyeKey.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
        if (window.lucide) window.lucide.createIcons();
      });
    }

    if (btnRevokeLocalLicense) {
      btnRevokeLocalLicense.addEventListener('click', revokeLocalLicense);
    }

    // Auto-Update Events
    const btnManualCheckUpdate = document.getElementById('btnManualCheckUpdate');
    const btnApplyUpdateNow = document.getElementById('btnApplyUpdateNow');
    const btnDismissUpdate = document.getElementById('btnDismissUpdate');
    const modalUpdateAvailable = document.getElementById('modalUpdateAvailable');

    if (btnManualCheckUpdate) {
      btnManualCheckUpdate.addEventListener('click', () => {
        checkForAppUpdates(false);
      });
    }

    if (btnApplyUpdateNow) {
      btnApplyUpdateNow.addEventListener('click', applyAppUpdate);
    }

    if (btnDismissUpdate && modalUpdateAvailable) {
      btnDismissUpdate.addEventListener('click', () => {
        modalUpdateAvailable.classList.add('hidden');
      });
    }
  }

  // ==========================================
  // REGISTRO DE SERVICE WORKER (PWA)
  // ==========================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            console.log('PWA ServiceWorker registrado com sucesso:', reg.scope);
            // Detecta quando um novo service worker é encontrado
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    checkForAppUpdates(true);
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.log('Falha no registro do ServiceWorker:', err);
          });
      });
    }
  }

  // ==========================================
  // INICIALIZAÇÃO GERAL
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    renderAll();
    checkLicenseStatus();
    registerServiceWorker();

    // Verificação de atualizações no GitHub ao abrir e a cada 15 minutos
    setTimeout(() => checkForAppUpdates(true), 2000);
    setInterval(() => checkForAppUpdates(true), 15 * 60 * 1000);
  });

})();
