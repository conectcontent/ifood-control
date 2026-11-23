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
    goals: [
      { id: 'contas', name: 'Minhas Contas', target: 1450, color: 'emerald', icon: 'receipt', isContas: true, syncWithDebts: true },
      { id: 'reserva', name: 'Minha Reserva', target: 400, color: 'purple', icon: 'shield', isPeakTarget: true },
      { id: 'exterior', name: 'Namorado', target: 500, color: 'cyan', icon: 'heart', isPeakTarget: true },
      { id: 'oficina', name: 'Oficina Bike', target: 250, color: 'amber', icon: 'wrench' },
    ],
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
      mode: 100, // Quantidade de blocos (personalizável)
      valueMode: 'fixed', // 'fixed', 'total', 'progressive'
      blockValue: 100, // Valor padrão de cada bloco
      targetTotal: 10000, // Meta total do desafio
      customValues: {}, // Valores customizados opcionais: { [index]: number }
      checked: {}, // { [index]: true }
    },
    debts: [],
    selectedDebtMonth: 'fev',
    privacyMode: false,
  };

  const HEX_COLORS = {
    cyan: '#06B6D4',
    emerald: '#10B981',
    purple: '#A855F7',
    amber: '#F59E0B',
    rose: '#F43F5E',
    blue: '#3B82F6',
  };

  const MONTHS_LIST = [
    { key: 'jan', short: 'Jan', name: 'Janeiro' },
    { key: 'fev', short: 'Fev', name: 'Fevereiro' },
    { key: 'mar', short: 'Mar', name: 'Março' },
    { key: 'abr', short: 'Abr', name: 'Abril' },
    { key: 'mai', short: 'Mai', name: 'Maio' },
    { key: 'jun', short: 'Jun', name: 'Junho' },
    { key: 'jul', short: 'Jul', name: 'Julho' },
    { key: 'ago', short: 'Ago', name: 'Agosto' },
    { key: 'set', short: 'Set', name: 'Setembro' },
    { key: 'out', short: 'Out', name: 'Outubro' },
    { key: 'nov', short: 'Nov', name: 'Novembro' },
    { key: 'dez', short: 'Dez', name: 'Dezembro' },
  ];

  const MONTH_NAMES = {
    jan: 'Janeiro',
    fev: 'Fevereiro',
    mar: 'Março',
    abr: 'Abril',
    mai: 'Maio',
    jun: 'Junho',
    jul: 'Julho',
    ago: 'Agosto',
    set: 'Setembro',
    out: 'Outubro',
    nov: 'Novembro',
    dez: 'Dezembro',
  };

  const MONTH_SHORT = {
    jan: 'Jan',
    fev: 'Fev',
    mar: 'Mar',
    abr: 'Abr',
    mai: 'Mai',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    set: 'Set',
    out: 'Out',
    nov: 'Nov',
    dez: 'Dez',
  };

  const COLOR_PALETTES = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      tagText: 'text-cyan-400',
      ringColor: 'text-cyan-400',
      pctColor: 'text-cyan-300',
      extraColor: 'text-cyan-300',
      glow: 'shadow-glow-cyan',
      badge: 'bg-cyan-500/20 text-cyan-300',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      tagText: 'text-emerald-400',
      ringColor: 'text-emerald-400',
      pctColor: 'text-emerald-300',
      extraColor: 'text-emerald-300',
      glow: 'shadow-glow-emerald',
      badge: 'bg-emerald-500/20 text-emerald-300',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      tagText: 'text-purple-400',
      ringColor: 'text-purple-400',
      pctColor: 'text-purple-300',
      extraColor: 'text-purple-300',
      glow: 'shadow-glow-purple',
      badge: 'bg-purple-500/20 text-purple-300',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      tagText: 'text-amber-400',
      ringColor: 'text-amber-400',
      pctColor: 'text-amber-300',
      extraColor: 'text-amber-300',
      glow: 'shadow-glow-amber',
      badge: 'bg-amber-500/20 text-amber-300',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      tagText: 'text-rose-400',
      ringColor: 'text-rose-400',
      pctColor: 'text-rose-300',
      extraColor: 'text-rose-300',
      glow: 'shadow-glow-rose',
      badge: 'bg-rose-500/20 text-rose-300',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      tagText: 'text-blue-400',
      ringColor: 'text-blue-400',
      pctColor: 'text-blue-300',
      extraColor: 'text-blue-300',
      glow: 'shadow-glow-blue',
      badge: 'bg-blue-500/20 text-blue-300',
    },
  };

  let selectedNewGoalColor = 'cyan';

  function getGoalsList() {
    if (Array.isArray(appState.goals) && appState.goals.length > 0) {
      return appState.goals;
    }
    const s = appState.settings || {};
    const defaultGoals = [
      { id: 'contas', name: 'Minhas Contas', target: s.metaContas !== undefined ? s.metaContas : 1450, color: 'emerald', icon: 'receipt', isContas: true, syncWithDebts: true },
      { id: 'reserva', name: 'Minha Reserva', target: s.metaReserva !== undefined ? s.metaReserva : 400, color: 'purple', icon: 'shield', isPeakTarget: true },
      { id: 'exterior', name: 'Namorado', target: s.metaExterior !== undefined ? s.metaExterior : 500, color: 'cyan', icon: 'heart', isPeakTarget: true },
      { id: 'oficina', name: 'Oficina Bike', target: s.metaOficina !== undefined ? s.metaOficina : 250, color: 'amber', icon: 'wrench' },
    ];
    appState.goals = defaultGoals;
    return appState.goals;
  }

  function getEffectiveGoalTarget(goal) {
    if (!goal) return 0;
    if (goal.isContas && goal.syncWithDebts !== false) {
      const currentMonth = appState.selectedDebtMonth || 'fev';
      const debts = appState.debts || [];
      const activeDebts = debts.filter((d) => d.months && d.months.includes(currentMonth));
      const totalMonthDebts = activeDebts.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
      return totalMonthDebts;
    }
    return parseFloat(goal.target) || 0;
  }

  function getTotalMetaMonth() {
    const goals = getGoalsList();
    let sum = 0;
    goals.forEach((g) => {
      sum += getEffectiveGoalTarget(g);
    });
    return sum;
  }

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
  const CURRENT_APP_VERSION = '1.5.0';
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
      let saved = localStorage.getItem(userKey);

      // Migração apenas para o perfil inicial 'user_1' se nunca salvou nada antes
      if (!saved && activeId === 'user_1') {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          saved = legacy;
          localStorage.setItem(userKey, legacy);
        }
      }

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

    // Inicializa o estado TOTALMENTE ZERADO
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    appState.goals = JSON.parse(JSON.stringify(DEFAULT_STATE.goals));
    appState.debts = [];
    appState.entries = [];
    appState.expenses = [];
    appState.turnCount = 0;
    appState.totalAccumulatedMonth = 0;
    appState.totalPeakExtra = 0;
    appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    appState.categories = {
      exterior: { accumulated: 0, peakExtra: 0 },
      contas: { accumulated: 0, spent: 0 },
      reserva: { accumulated: 0, peakExtra: 0 },
      oficina: { accumulated: 0, spent: 0 },
    };

    const meta = parseFloat(initialMeta);
    if (!isNaN(meta) && meta > 0) {
      const ratio = meta / 2600;
      appState.settings.metaExterior = Math.round(500 * ratio);
      appState.settings.metaContas = Math.round(1450 * ratio);
      appState.settings.metaReserva = Math.round(400 * ratio);
      appState.settings.metaOficina = Math.round(250 * ratio);
      appState.goals.forEach((g) => {
        if (!g.isContas) {
          g.target = Math.round(g.target * ratio);
        }
      });
    }
    saveState();
    renderAll();
    triggerHaptic(35);
    showToast(`Perfil "${newUser.name}" cadastrado 100% zerado!`, '🎉');
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
    const goals = getGoalsList();
    if (!goals || goals.length === 0) return {};

    let sumTargets = 0;
    const targetMap = {};
    goals.forEach((g) => {
      const eff = getEffectiveGoalTarget(g);
      targetMap[g.id] = eff;
      sumTargets += eff;
    });

    const split = {};
    let allocated = 0;

    if (sumTargets <= 0) {
      const share = Number((baseAmount / goals.length).toFixed(2));
      goals.forEach((g, idx) => {
        if (idx === goals.length - 1) {
          split[g.id] = Number((baseAmount - allocated).toFixed(2));
        } else {
          split[g.id] = share;
          allocated += share;
        }
      });
    } else {
      goals.forEach((g, idx) => {
        const eff = targetMap[g.id] || 0;
        const frac = eff / sumTargets;
        if (idx === goals.length - 1) {
          split[g.id] = Number((baseAmount - allocated).toFixed(2));
        } else {
          const val = Number((baseAmount * frac).toFixed(2));
          split[g.id] = val;
          allocated += val;
        }
      });
    }

    // Compatibilidade reversa com acessos split.exterior, split.contas, etc.
    if (split.contas === undefined && split['contas']) split.contas = split['contas'];
    if (split.reserva === undefined && split['reserva']) split.reserva = split['reserva'];
    if (split.exterior === undefined && split['exterior']) split.exterior = split['exterior'];
    if (split.oficina === undefined && split['oficina']) split.oficina = split['oficina'];

    return split;
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
    const goals = getGoalsList();

    if (!appState.categories) appState.categories = {};
    goals.forEach((g) => {
      if (!appState.categories[g.id]) {
        appState.categories[g.id] = { accumulated: 0, spent: 0, peakExtra: 0 };
      }
    });

    const extraMap = {};
    if (surplus > 0) {
      if (surplusChoice === 'half') {
        const peakGoals = goals.filter((g) => g.isPeakTarget);
        const g1 = peakGoals[0] || goals[0];
        const g2 = peakGoals[1] || goals[1] || g1;
        const h1 = Number((surplus / 2).toFixed(2));
        const h2 = Number((surplus - h1).toFixed(2));
        if (g1) extraMap[g1.id] = (extraMap[g1.id] || 0) + h1;
        if (g2 && g2 !== g1) extraMap[g2.id] = (extraMap[g2.id] || 0) + h2;
        else if (g2 === g1) extraMap[g1.id] = (extraMap[g1.id] || 0) + h2;
      } else if (surplusChoice && appState.categories[surplusChoice]) {
        extraMap[surplusChoice] = surplus;
      } else {
        const firstPeak = goals.find((g) => g.isPeakTarget) || goals[0];
        if (firstPeak) extraMap[firstPeak.id] = surplus;
      }
    }

    const recordedSplit = {};
    goals.forEach((g) => {
      const baseAlloc = split[g.id] || 0;
      const extra = extraMap[g.id] || 0;
      const totalGoalAlloc = Number((baseAlloc + extra).toFixed(2));
      recordedSplit[g.id] = totalGoalAlloc;

      appState.categories[g.id].accumulated = Number(((appState.categories[g.id].accumulated || 0) + totalGoalAlloc).toFixed(2));
      if (extra > 0) {
        appState.categories[g.id].peakExtra = Number(((appState.categories[g.id].peakExtra || 0) + extra).toFixed(2));
      }
    });

    appState.totalAccumulatedMonth = Number((appState.totalAccumulatedMonth + total).toFixed(2));
    appState.totalPeakExtra = Number((appState.totalPeakExtra + surplus).toFixed(2));
    appState.turnCount += 1;

    const entryRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      total,
      base,
      surplus,
      surplusChoice,
      split: recordedSplit,
    };
    appState.entries.unshift(entryRecord);

    saveState();
    renderAll();
    triggerHaptic(30);

    const input = document.getElementById('dailyGainInput');
    if (input) input.value = '';

    if (surplus > 0) {
      showToast(`Lançamento de ${formatBRL(total)} registrado com ${formatBRL(surplus)} de pico!`, '🚀');
    } else {
      showToast(`Ganho de ${formatBRL(total)} dividido com sucesso!`, '✅');
    }
  }

  function openPeakModal(total, surplus) {
    const modal = document.getElementById('modalExcedente');
    if (!modal) return;

    document.getElementById('modalPeakTotal').textContent = formatBRL(total);
    document.getElementById('modalPeakSurplus').textContent = formatBRL(surplus);
    document.getElementById('modalPeakSurplusText').textContent = formatBRL(surplus);

    const container = document.getElementById('surplusChoicesContainer');
    if (container) {
      container.innerHTML = '';
      const goals = getGoalsList();
      const peakCandidates = goals.filter((g) => !g.isContas);

      // Metas individuais elegíveis
      peakCandidates.forEach((g) => {
        const palette = COLOR_PALETTES[g.color] || COLOR_PALETTES.cyan;
        const btn = document.createElement('button');
        btn.className = `choice-surplus-btn w-full p-3 rounded-2xl bg-white/5 border ${palette.border} hover:bg-white/10 text-left flex items-center justify-between group active:scale-98 transition-all`;
        btn.dataset.choice = g.id;
        btn.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-xl bg-white/10 ${palette.tagText} flex items-center justify-center">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-bold text-white group-hover:${palette.tagText}">100% ${g.name}</p>
              <p class="text-[10px] text-slate-400">Acelerar conquista desta meta</p>
            </div>
          </div>
          <span class="text-xs font-black ${palette.pctColor} tabular-numbers">+${formatBRL(surplus)}</span>
        `;
        btn.addEventListener('click', () => {
          if (pendingPeakEntry) {
            commitDailyEntry(pendingPeakEntry.total, 100, pendingPeakEntry.surplus, g.id);
            closePeakModal();
          }
        });
        container.appendChild(btn);
      });

      // Opção de divisão 50/50 se houver 2 ou mais
      if (peakCandidates.length >= 2) {
        const half = surplus / 2;
        const btnHalf = document.createElement('button');
        btnHalf.className = 'choice-surplus-btn w-full p-3 rounded-2xl bg-white/5 border border-emerald-500/30 hover:bg-emerald-500/10 text-left flex items-center justify-between group active:scale-98 transition-all';
        btnHalf.dataset.choice = 'half';
        btnHalf.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <i data-lucide="scale" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-bold text-white group-hover:text-emerald-300">50/50 Dividir entre Metas</p>
              <p class="text-[10px] text-slate-400">Equilíbrio perfeito de alocação</p>
            </div>
          </div>
          <span class="text-xs font-black text-emerald-300 tabular-numbers">+${formatBRL(half)} cada</span>
        `;
        btnHalf.addEventListener('click', () => {
          if (pendingPeakEntry) {
            commitDailyEntry(pendingPeakEntry.total, 100, pendingPeakEntry.surplus, 'half');
            closePeakModal();
          }
        });
        container.appendChild(btnHalf);
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

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

  function registerContasDeposit(desc, val) {
    const value = parseFloat(val);
    if (isNaN(value) || value <= 0) {
      showToast('Valor de entrada inválido!', '⚠️');
      return;
    }
    appState.categories.contas.accumulated += value;
    appState.totalAccumulatedMonth += value;
    appState.entries.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'deposit_contas',
      desc: desc || 'Aporte em Contas',
      total: value,
      base: value,
      surplus: 0,
      surplusChoice: 'nenhum',
      split: { exterior: 0, contas: value, reserva: 0, oficina: 0 },
    });
    saveState();
    renderAll();
    triggerHaptic(20);
    showToast(`Adicionado ${formatBRL(value)} ao saldo de Contas!`, '💰');
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
    const goals = getGoalsList();
    const totalMeta = getTotalMetaMonth();
    const currentTotal = appState.totalAccumulatedMonth;
    const totalPct = totalMeta > 0 ? Math.min(100, Math.round((currentTotal / totalMeta) * 100)) : (currentTotal > 0 ? 100 : 0);

    const totalEl = document.getElementById('totalMonthAccumulated');
    if (totalEl) totalEl.textContent = formatBRL(currentTotal);

    const generalMetaEl = document.getElementById('generalMetaTotal');
    if (generalMetaEl) generalMetaEl.textContent = formatBRL(totalMeta);

    const generalBar = document.getElementById('generalProgressBar');
    if (generalBar) generalBar.style.width = `${totalPct}%`;

    const generalPctEl = document.getElementById('generalProgressPct');
    if (generalPctEl) generalPctEl.textContent = `${totalPct}%`;

    const gridContainer = document.getElementById('bentoGridContainer');
    if (gridContainer) {
      renderBentoGridCards(gridContainer, goals);
    }

    updateDashboardDebtAlert();
  }

  function renderBentoGridCards(container, goals) {
    container.innerHTML = '';
    const cats = appState.categories || {};
    const currentMonth = appState.selectedDebtMonth || 'fev';
    const monthShort = { jan: 'Jan', fev: 'Fev', mar: 'Mar', abr: 'Abr' };
    const debts = appState.debts || [];
    const activeDebts = debts.filter((d) => d.months && d.months.includes(currentMonth));
    const pendingDebts = activeDebts.filter((d) => !(d.paidMonths || []).includes(currentMonth));
    const pendingTotal = pendingDebts.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
    const totalMonthDebts = activeDebts.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

    goals.forEach((goal, idx) => {
      const catData = cats[goal.id] || { accumulated: 0, spent: 0, peakExtra: 0 };
      const val = Math.max(0, (catData.accumulated || 0) - (catData.spent || 0));
      const target = getEffectiveGoalTarget(goal);
      const pct = target > 0 ? Math.min(100, Math.round((val / target) * 100)) : (val > 0 ? 100 : 0);
      const offset = 100 - pct;
      const palette = COLOR_PALETTES[goal.color] || COLOR_PALETTES.cyan;
      const hexColor = HEX_COLORS[goal.color] || '#06B6D4';

      // Se for número ímpar de cards, o último ganha destaque em largura completa no Bento
      const isLastOdd = goals.length % 2 === 1 && idx === goals.length - 1;
      const card = document.createElement('div');
      card.className = `glass-card p-4 flex flex-col justify-between ${palette.border} relative group ${isLastOdd ? 'col-span-2' : ''}`;

      let valLabel = 'Acumulado';
      if (goal.isContas) valLabel = 'Saldo Protegido';
      else if (goal.id === 'oficina' || goal.name.toLowerCase().includes('oficina') || goal.name.toLowerCase().includes('manutenção')) valLabel = 'Saldo Manutenção';

      let bottomRowHtml = '';
      if (goal.isContas) {
        bottomRowHtml = `
          <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-white/5">
            <span>${goal.syncWithDebts !== false ? `Dívidas ${monthShort[currentMonth] || currentMonth}: ${formatBRL(totalMonthDebts)}` : `Teto: ${formatBRL(target)}`}</span>
            ${goal.syncWithDebts !== false ? (pendingTotal > 0 ? `<span class="text-amber-300 font-bold">${formatBRL(pendingTotal)} pend.</span>` : `<span class="text-emerald-300 font-bold">Em dia ✓</span>`) : ''}
          </div>
          <div class="grid grid-cols-2 gap-1.5 mt-2.5">
            <button class="btn-action-add-conta py-1.5 px-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 active:scale-95 text-[11px] font-bold flex items-center justify-center space-x-1 transition-all" title="Colocar Conta ou Saldo">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
              <span>+ Colocar</span>
            </button>
            <button class="btn-action-remove-conta py-1.5 px-2 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 hover:bg-rose-500/25 active:scale-95 text-[11px] font-bold flex items-center justify-center space-x-1 transition-all" title="Tirar Gasto ou Conta">
              <i data-lucide="minus-circle" class="w-3.5 h-3.5"></i>
              <span>- Tirar</span>
            </button>
          </div>
        `;
      } else if (goal.id === 'oficina' || goal.name.toLowerCase().includes('oficina') || goal.name.toLowerCase().includes('manutenção')) {
        bottomRowHtml = `
          <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-white/5">
            <span>Meta: ${formatBRL(target)}</span>
          </div>
          <button class="btn-action-maintenance mt-2.5 w-full py-1.5 px-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 active:scale-95 text-[11px] font-bold flex items-center justify-center space-x-1 transition-all">
            <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
            <span>- Manutenção</span>
          </button>
        `;
      } else {
        bottomRowHtml = `
          <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-white/5">
            <span>Meta: ${formatBRL(target)}</span>
            ${(catData.peakExtra || 0) > 0 ? `<span class="${palette.extraColor} font-bold">+${formatBRL(catData.peakExtra)} pico</span>` : ''}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-extrabold tracking-wider ${palette.tagText} uppercase">0${idx + 1}. ${goal.name}</span>
            <h3 class="text-xs font-semibold text-slate-300 truncate max-w-[115px]">${goal.name}</h3>
          </div>
          <div class="relative w-11 h-11 flex items-center justify-center shrink-0">
            <svg class="w-11 h-11" viewBox="0 0 36 36">
              <path class="text-white/10" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="progress-ring-circle" stroke="${hexColor}" stroke-dasharray="100, 100" stroke-dashoffset="${offset}" stroke-width="3.5" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <span class="absolute text-[9px] font-black ${palette.pctColor} tabular-numbers">${pct}%</span>
          </div>
        </div>

        <div class="mt-3">
          <span class="text-[11px] text-slate-400 block">${valLabel}</span>
          <p class="text-lg font-black text-white tabular-numbers financial-val">${formatBRL(val)}</p>
          ${bottomRowHtml}
        </div>
      `;

      // Eventos dos botões rápidos dentro do card
      const btnAddConta = card.querySelector('.btn-action-add-conta');
      if (btnAddConta) {
        btnAddConta.addEventListener('click', () => {
          const m = document.getElementById('modalColocarMenu');
          if (m) m.classList.remove('hidden');
        });
      }
      const btnRemoveConta = card.querySelector('.btn-action-remove-conta');
      if (btnRemoveConta) {
        btnRemoveConta.addEventListener('click', () => {
          const m = document.getElementById('modalTirarMenu');
          if (m) m.classList.remove('hidden');
        });
      }
      const btnMaintenance = card.querySelector('.btn-action-maintenance');
      if (btnMaintenance) {
        btnMaintenance.addEventListener('click', () => {
          const m = document.getElementById('modalMaintenance');
          if (m) m.classList.remove('hidden');
        });
      }

      container.appendChild(card);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function openManageGoalsModal() {
    const modal = document.getElementById('modalManageGoals');
    if (!modal) return;

    const currentMonth = appState.selectedDebtMonth || 'fev';
    const monthNames = MONTH_NAMES;
    const debts = appState.debts || [];
    const activeDebts = debts.filter((d) => d.months && d.months.includes(currentMonth));
    const totalMonthDebts = activeDebts.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

    const debtPreviewEl = document.getElementById('manageGoalsMonthDebtPreview');
    if (debtPreviewEl) {
      debtPreviewEl.textContent = `${formatBRL(totalMonthDebts)} em ${monthNames[currentMonth] || currentMonth}`;
    }

    renderManageGoalsList();
    modal.classList.remove('hidden');
    triggerHaptic(20);
  }

  function closeManageGoalsModal() {
    const modal = document.getElementById('modalManageGoals');
    if (modal) modal.classList.add('hidden');
  }

  function renderManageGoalsList() {
    const container = document.getElementById('manageGoalsListContainer');
    const countEl = document.getElementById('manageGoalsCount');
    if (!container) return;

    const goals = getGoalsList();
    if (countEl) countEl.textContent = `${goals.length} meta(s)`;

    container.innerHTML = '';
    const currentMonth = appState.selectedDebtMonth || 'fev';
    const monthShort = { jan: 'Jan', fev: 'Fev', mar: 'Mar', abr: 'Abr' };
    const debts = appState.debts || [];
    const activeDebts = debts.filter((d) => d.months && d.months.includes(currentMonth));
    const totalMonthDebts = activeDebts.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

    goals.forEach((goal) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2';
      const palette = COLOR_PALETTES[goal.color] || COLOR_PALETTES.cyan;

      if (goal.isContas) {
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full ${palette.glow}" style="background-color: ${HEX_COLORS[goal.color] || '#10B981'}"></span>
              <span class="text-xs font-bold text-white">${goal.name}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">Contas</span>
            </div>
            <button class="btn-remove-goal p-1 text-slate-500 hover:text-rose-400 active:scale-90 transition-all" data-id="${goal.id}" title="Tirar Meta">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <label class="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-300 select-none">
              <input type="checkbox" class="chk-goal-sync rounded bg-white/10 text-emerald-500 focus:ring-0" data-id="${goal.id}" ${goal.syncWithDebts !== false ? 'checked' : ''}>
              <span>Acompanhar aba Dívidas</span>
            </label>
          </div>

          <div class="goal-sync-info-box ${goal.syncWithDebts !== false ? '' : 'hidden'} p-2 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-[10px] text-emerald-300 flex items-center justify-between">
            <span>Dívidas de ${monthShort[currentMonth] || currentMonth}:</span>
            <span class="font-bold tabular-numbers text-white">${formatBRL(totalMonthDebts)}</span>
          </div>

          <div class="goal-target-fixed-box ${goal.syncWithDebts !== false ? 'hidden' : ''} flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Teto Fixo Manual:</span>
            <div class="relative w-28">
              <span class="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">R$</span>
              <input type="number" class="goal-input-target w-full bg-black/40 border border-white/10 rounded-xl py-1 pl-7 pr-2 text-xs text-white font-bold text-right focus:border-emerald-400 focus:outline-none" data-id="${goal.id}" value="${goal.target}">
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 flex-1 mr-2">
              <span class="w-2.5 h-2.5 rounded-full ${palette.glow} shrink-0" style="background-color: ${HEX_COLORS[goal.color] || '#06B6D4'}"></span>
              <input type="text" class="goal-input-name bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-400 text-xs font-bold text-white focus:outline-none w-full" data-id="${goal.id}" value="${goal.name}" title="Toque para editar o nome da meta">
            </div>
            <button class="btn-remove-goal p-1 text-slate-500 hover:text-rose-400 active:scale-90 transition-all shrink-0" data-id="${goal.id}" title="Tirar Meta">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-white/5">
            <span class="text-[11px] text-slate-400">Meta Mensal:</span>
            <div class="relative w-28">
              <span class="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">R$</span>
              <input type="number" class="goal-input-target w-full bg-black/40 border border-white/10 rounded-xl py-1 pl-7 pr-2 text-xs text-white font-bold text-right focus:border-cyan-400 focus:outline-none" data-id="${goal.id}" value="${goal.target}">
            </div>
          </div>
        `;
      }

      const chkSync = card.querySelector('.chk-goal-sync');
      if (chkSync) {
        chkSync.addEventListener('change', (e) => {
          const syncBox = card.querySelector('.goal-sync-info-box');
          const fixedBox = card.querySelector('.goal-target-fixed-box');
          if (syncBox && fixedBox) {
            if (e.target.checked) {
              syncBox.classList.remove('hidden');
              fixedBox.classList.add('hidden');
            } else {
              syncBox.classList.add('hidden');
              fixedBox.classList.remove('hidden');
            }
          }
        });
      }

      card.querySelector('.btn-remove-goal').addEventListener('click', () => {
        deleteGoal(goal.id);
      });

      container.appendChild(card);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function addCustomGoal() {
    const nameInput = document.getElementById('newGoalName');
    const targetInput = document.getElementById('newGoalTarget');
    const name = nameInput ? nameInput.value.trim() : '';
    const target = targetInput ? parseFloat(targetInput.value) : 0;

    if (!name) {
      showToast('Digite o nome da meta!', '⚠️');
      if (nameInput) nameInput.focus();
      return;
    }
    if (isNaN(target) || target <= 0) {
      showToast('Digite um valor válido para a meta!', '⚠️');
      if (targetInput) targetInput.focus();
      return;
    }

    const goals = getGoalsList();
    const newId = `meta_${Date.now()}`;
    const newGoal = {
      id: newId,
      name,
      target,
      color: selectedNewGoalColor || 'cyan',
      icon: 'target',
      isPeakTarget: true,
    };

    goals.push(newGoal);
    appState.goals = goals;

    if (!appState.categories) appState.categories = {};
    if (!appState.categories[newId]) {
      appState.categories[newId] = { accumulated: 0, spent: 0, peakExtra: 0 };
    }

    if (nameInput) nameInput.value = '';
    if (targetInput) targetInput.value = '';

    saveState();
    renderAll();
    renderManageGoalsList();
    triggerHaptic(30);
    showToast(`Meta "${name}" colocada com sucesso!`, '🎯');
  }

  function deleteGoal(goalId) {
    const goals = getGoalsList();
    if (goals.length <= 1) {
      showToast('Você precisa manter pelo menos 1 meta no app!', '⚠️');
      return;
    }
    const goalToDelete = goals.find((g) => g.id === goalId);
    const title = goalToDelete ? goalToDelete.name : 'esta meta';
    if (!confirm(`Deseja tirar a meta "${title}" do seu aplicativo?`)) return;

    appState.goals = goals.filter((g) => g.id !== goalId);
    saveState();
    renderAll();
    renderManageGoalsList();
    triggerHaptic(25);
    showToast(`Meta "${title}" removida com sucesso!`, '🗑️');
  }

  function saveGoalsFromModal() {
    const container = document.getElementById('manageGoalsListContainer');
    if (!container) return;

    const goals = getGoalsList();
    goals.forEach((goal) => {
      const nameInput = container.querySelector(`.goal-input-name[data-id="${goal.id}"]`);
      if (nameInput && nameInput.value.trim()) {
        goal.name = nameInput.value.trim();
      }
      const targetInput = container.querySelector(`.goal-input-target[data-id="${goal.id}"]`);
      if (targetInput) {
        const tVal = parseFloat(targetInput.value);
        if (!isNaN(tVal) && tVal >= 0) {
          goal.target = tVal;
        }
      }
      const syncChk = container.querySelector(`.chk-goal-sync[data-id="${goal.id}"]`);
      if (syncChk) {
        goal.syncWithDebts = syncChk.checked;
      }
    });

    appState.goals = goals;
    saveState();
    renderAll();
    closeManageGoalsModal();
    triggerHaptic(25);
    showToast('Alterações de metas salvas!', '✅');
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

  function updateDashboardDebtAlert() {
    const cardEl = document.getElementById('dashboardDebtAlertCard');
    const titleEl = document.getElementById('dashboardDebtAlertTitle');
    const badgeEl = document.getElementById('dashboardDebtAlertBadge');
    const descEl = document.getElementById('dashboardDebtAlertDesc');
    const iconWrapper = document.getElementById('dashboardDebtAlertIcon');
    const btnText = document.getElementById('dashboardDebtAlertBtnText');
    if (!cardEl || !titleEl) return;

    const currentMonth = appState.selectedDebtMonth || 'fev';
    const monthNames = MONTH_NAMES;
    const debts = appState.debts || [];
    const activeDebts = debts.filter((d) => d.months && d.months.includes(currentMonth));
    const pendingDebts = activeDebts.filter((d) => !(d.paidMonths || []).includes(currentMonth));

    if (debts.length === 0) {
      cardEl.className = 'glass-card p-4 border-emerald-500/25 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/30 flex items-center justify-between';
      if (iconWrapper) {
        iconWrapper.className = 'w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0';
        iconWrapper.innerHTML = '<i data-lucide="shield-check" class="w-5 h-5"></i>';
      }
      titleEl.textContent = 'Contas Zeradas';
      if (badgeEl) {
        badgeEl.textContent = 'Em Dia';
        badgeEl.className = 'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      }
      if (descEl) descEl.textContent = 'Nenhum compromisso cadastrado neste perfil';
      if (btnText) btnText.textContent = '+ Colocar';
    } else if (pendingDebts.length === 0) {
      cardEl.className = 'glass-card p-4 border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-teal-950/20 flex items-center justify-between';
      if (iconWrapper) {
        iconWrapper.className = 'w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0';
        iconWrapper.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5"></i>';
      }
      titleEl.textContent = 'Tudo Liquidado!';
      if (badgeEl) {
        badgeEl.textContent = monthNames[currentMonth];
        badgeEl.className = 'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      }
      if (descEl) descEl.textContent = `Todas as contas de ${monthNames[currentMonth]} estão pagas`;
      if (btnText) btnText.textContent = 'Ver';
    } else {
      const nextDebt = pendingDebts[0];
      cardEl.className = 'glass-card p-4 border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-purple-950/20 flex items-center justify-between';
      if (iconWrapper) {
        iconWrapper.className = 'w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0';
        iconWrapper.innerHTML = '<i data-lucide="calendar-clock" class="w-5 h-5"></i>';
      }
      titleEl.textContent = nextDebt.title;
      if (badgeEl) {
        badgeEl.textContent = `${monthNames[currentMonth]} • Pendente`;
        badgeEl.className = 'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30';
      }
      if (descEl) descEl.innerHTML = `<span class="tabular-numbers font-bold text-white">${formatBRL(nextDebt.value)}</span> • ${pendingDebts.length} conta(s) pendente(s)`;
      if (btnText) btnText.textContent = 'Ver';
    }
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

  function getBlockValue(index) {
    if (!appState.challenge) return 100;
    const ch = appState.challenge;
    if (ch.customValues && ch.customValues[index] !== undefined) {
      return parseFloat(ch.customValues[index]) || 0;
    }
    if (ch.valueMode === 'progressive') {
      return index;
    }
    if (ch.valueMode === 'total') {
      const total = parseFloat(ch.targetTotal) || 10000;
      const count = parseInt(ch.mode, 10) || 100;
      return count > 0 ? total / count : 0;
    }
    return ch.blockValue !== undefined ? parseFloat(ch.blockValue) : 100;
  }

  function getChallengeTotalGoal() {
    if (!appState.challenge) return 10000;
    const ch = appState.challenge;
    const count = parseInt(ch.mode, 10) || 100;
    if (ch.valueMode === 'total') {
      return parseFloat(ch.targetTotal) || (count * 100);
    }
    if (ch.valueMode === 'progressive') {
      return (count * (count + 1)) / 2;
    }
    let total = 0;
    for (let i = 1; i <= count; i++) {
      total += getBlockValue(i);
    }
    return total;
  }

  function getChallengeAccumulated() {
    if (!appState.challenge) return 0;
    const ch = appState.challenge;
    const count = parseInt(ch.mode, 10) || 100;
    const checked = ch.checked || {};
    let sum = 0;
    for (let i = 1; i <= count; i++) {
      if (checked[i]) {
        sum += getBlockValue(i);
      }
    }
    return sum;
  }

  let activeDepositBlockIndex = null;

  function openBlockDepositModal(index) {
    activeDepositBlockIndex = index;
    const modal = document.getElementById('modalBlockDeposit');
    if (!modal) return;

    if (!appState.challenge) {
      appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    }

    const isChecked = !!(appState.challenge.checked && appState.challenge.checked[index]);
    const currentVal = getBlockValue(index);

    const iconEl = document.getElementById('modalBlockIcon');
    const titleEl = document.getElementById('modalBlockTitle');
    const inputVal = document.getElementById('inputBlockDepositValue');
    const statusBadge = document.getElementById('modalBlockCurrentStatus');
    const confirmBtnText = document.getElementById('btnConfirmBlockDepositText');
    const btnUncheck = document.getElementById('btnUncheckBlockDeposit');

    if (iconEl) iconEl.textContent = `#${index}`;
    if (titleEl) titleEl.textContent = `Depósito no Bloco #${index}`;
    if (inputVal) {
      inputVal.value = currentVal;
    }

    if (statusBadge) {
      if (isChecked) {
        statusBadge.textContent = `Concluído (${formatBRL(currentVal)})`;
        statusBadge.className = 'font-bold text-emerald-400';
      } else {
        statusBadge.textContent = 'Pendente';
        statusBadge.className = 'font-bold text-amber-300';
      }
    }

    if (confirmBtnText) {
      confirmBtnText.textContent = isChecked ? 'Atualizar Valor Depositado' : 'Confirmar Depósito';
    }

    if (btnUncheck) {
      if (isChecked) {
        btnUncheck.classList.remove('hidden');
      } else {
        btnUncheck.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');
    triggerHaptic(15);

    setTimeout(() => {
      if (inputVal) {
        inputVal.focus();
        inputVal.select();
      }
    }, 100);
  }

  function closeBlockDepositModal() {
    const modal = document.getElementById('modalBlockDeposit');
    if (modal) modal.classList.add('hidden');
    activeDepositBlockIndex = null;
  }

  function confirmBlockDeposit() {
    if (activeDepositBlockIndex === null) return;
    const inputVal = document.getElementById('inputBlockDepositValue');
    const val = parseFloat(inputVal ? inputVal.value.replace(',', '.') : 0);

    if (isNaN(val) || val <= 0) {
      showToast('Informe um valor de depósito maior que zero!', '⚠️');
      return;
    }

    if (!appState.challenge) {
      appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    }
    if (!appState.challenge.customValues) appState.challenge.customValues = {};
    if (!appState.challenge.checked) appState.challenge.checked = {};

    appState.challenge.customValues[activeDepositBlockIndex] = val;
    appState.challenge.checked[activeDepositBlockIndex] = true;

    saveState();
    renderChallengeGrid();
    closeBlockDepositModal();
    triggerHaptic(30);
    showToast(`Depósito de ${formatBRL(val)} confirmado no Bloco #${activeDepositBlockIndex}!`, '🎯');
  }

  function uncheckBlockDeposit() {
    if (activeDepositBlockIndex === null) return;
    if (appState.challenge && appState.challenge.checked) {
      delete appState.challenge.checked[activeDepositBlockIndex];
    }
    saveState();
    renderChallengeGrid();
    closeBlockDepositModal();
    triggerHaptic(20);
    showToast(`Bloco #${activeDepositBlockIndex} marcado como pendente.`, '↩️');
  }

  function promptEditBlockValue(index, currentVal) {
    openBlockDepositModal(index);
  }

  function renderChallengeGrid() {
    const gridEl = document.getElementById('challengeGrid');
    if (!gridEl) return;

    if (!appState.challenge) {
      appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    }
    const ch = appState.challenge;
    const mode = parseInt(ch.mode, 10) || 100;
    const checkedMap = ch.checked || {};
    let checkedCount = 0;

    // Atualiza botões seletores rápidos
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

    const currentModeLabel = document.getElementById('challengeCurrentModeLabel');
    if (currentModeLabel) {
      const isPreset = [30, 50, 100, 150].includes(mode);
      currentModeLabel.textContent = isPreset ? 'Outro' : `${mode} bl`;
    }

    gridEl.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= mode; i++) {
      const isChecked = !!checkedMap[i];
      if (isChecked) checkedCount++;
      const val = getBlockValue(i);

      const block = document.createElement('button');
      block.type = 'button';
      block.className = `min-h-[50px] py-1.5 px-1 rounded-xl font-bold flex flex-col items-center justify-center transition-all tabular-numbers active:scale-90 select-none ${
        isChecked
          ? 'bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/30 border border-white/30 scale-100'
          : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
      }`;
      block.dataset.index = i;

      block.innerHTML = `
        <span class="text-xs font-black leading-tight">${isChecked ? `✓ ${i}` : `${i}`}</span>
        <span class="text-[8.5px] font-bold opacity-80 leading-tight mt-0.5">${formatBRL(val)}</span>
      `;

      let pressTimer = null;
      let isLongPress = false;

      block.addEventListener('click', () => {
        if (!isLongPress) {
          openBlockDepositModal(i);
        }
        isLongPress = false;
      });

      block.addEventListener('touchstart', () => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
          isLongPress = true;
          triggerHaptic(25);
          openBlockDepositModal(i);
        }, 500);
      }, { passive: true });

      block.addEventListener('touchend', () => {
        if (pressTimer) clearTimeout(pressTimer);
      });

      block.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openBlockDepositModal(i);
      });

      fragment.appendChild(block);
    }
    gridEl.appendChild(fragment);

    const checkedCountEl = document.getElementById('challengeCheckedCount');
    const totalCountEl = document.getElementById('challengeTotalCount');
    const remainingCountEl = document.getElementById('challengeRemainingCount');
    const pctEl = document.getElementById('challengePct');
    const barEl = document.getElementById('challengeProgressBar');
    const accumValEl = document.getElementById('challengeAccumulatedVal');
    const metaGoalEl = document.getElementById('challengeMetaGoalDisplay');

    if (checkedCountEl) checkedCountEl.textContent = checkedCount;
    if (totalCountEl) totalCountEl.textContent = mode;
    if (remainingCountEl) remainingCountEl.textContent = `${Math.max(0, mode - checkedCount)} restantes`;

    const pct = mode > 0 ? Math.round((checkedCount / mode) * 100) : 0;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;

    const accumulatedTotal = getChallengeAccumulated();
    const targetGoal = getChallengeTotalGoal();

    if (accumValEl) accumValEl.textContent = formatBRL(accumulatedTotal);
    if (metaGoalEl) metaGoalEl.textContent = `Meta: ${formatBRL(targetGoal)}`;
  }

  function toggleChallengeBlock(index) {
    if (!appState.challenge) appState.challenge = {};
    if (!appState.challenge.checked) appState.challenge.checked = {};
    const current = !!appState.challenge.checked[index];
    if (current) {
      delete appState.challenge.checked[index];
    } else {
      appState.challenge.checked[index] = true;
    }
    saveState();
    renderChallengeGrid();
    triggerHaptic(20);
  }

  let tempChallengeValueMode = 'fixed';

  function openChallengeSettingsModal() {
    const modal = document.getElementById('modalChallengeSettings');
    if (!modal) return;

    if (!appState.challenge) {
      appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    }
    const ch = appState.challenge;

    const inputCount = document.getElementById('inputChallengeCount');
    const inputBlockVal = document.getElementById('inputChallengeBlockValue');
    const inputTotalGoal = document.getElementById('inputChallengeTotalGoal');

    if (inputCount) inputCount.value = ch.mode || 100;
    if (inputBlockVal) inputBlockVal.value = ch.blockValue !== undefined ? ch.blockValue : 100;
    if (inputTotalGoal) inputTotalGoal.value = ch.targetTotal || (inputCount ? inputCount.value * 100 : 10000);

    setChallengeSettingsValueMode(ch.valueMode || 'fixed');
    updateChallengeSettingsPreview();

    modal.classList.remove('hidden');
    triggerHaptic(15);
  }

  function setChallengeSettingsValueMode(mode) {
    tempChallengeValueMode = mode;

    const btnFixed = document.getElementById('btnModeValFixed');
    const btnTotal = document.getElementById('btnModeValTotal');
    const btnProg = document.getElementById('btnModeValProgressive');

    const secFixed = document.getElementById('sectionFixedValue');
    const secTotal = document.getElementById('sectionTotalGoal');
    const secProg = document.getElementById('sectionProgressiveInfo');

    [btnFixed, btnTotal, btnProg].forEach((b) => {
      if (b) {
        b.className = 'py-1.5 px-1 rounded-xl font-bold transition-all text-slate-400 hover:text-white';
      }
    });

    if (mode === 'fixed') {
      if (btnFixed) btnFixed.className = 'py-1.5 px-1 rounded-xl font-bold transition-all bg-purple-600 text-white shadow-glow-purple';
      if (secFixed) secFixed.classList.remove('hidden');
      if (secTotal) secTotal.classList.add('hidden');
      if (secProg) secProg.classList.add('hidden');
    } else if (mode === 'total') {
      if (btnTotal) btnTotal.className = 'py-1.5 px-1 rounded-xl font-bold transition-all bg-purple-600 text-white shadow-glow-purple';
      if (secFixed) secFixed.classList.add('hidden');
      if (secTotal) secTotal.classList.remove('hidden');
      if (secProg) secProg.classList.add('hidden');
    } else if (mode === 'progressive') {
      if (btnProg) btnProg.className = 'py-1.5 px-1 rounded-xl font-bold transition-all bg-purple-600 text-white shadow-glow-purple';
      if (secFixed) secFixed.classList.add('hidden');
      if (secTotal) secTotal.classList.add('hidden');
      if (secProg) secProg.classList.remove('hidden');
    }

    updateChallengeSettingsPreview();
  }

  function updateChallengeSettingsPreview() {
    const inputCount = document.getElementById('inputChallengeCount');
    const inputBlockVal = document.getElementById('inputChallengeBlockValue');
    const inputTotalGoal = document.getElementById('inputChallengeTotalGoal');

    const previewCount = document.getElementById('previewChallengeCount');
    const previewBlockVal = document.getElementById('previewChallengeBlockVal');
    const previewTotalGoal = document.getElementById('previewChallengeTotalGoal');

    const count = Math.max(1, parseInt(inputCount && inputCount.value ? inputCount.value : 100, 10) || 100);
    let blockVal = 100;
    let totalGoal = 10000;

    if (tempChallengeValueMode === 'fixed') {
      blockVal = parseFloat(inputBlockVal && inputBlockVal.value ? inputBlockVal.value : 100) || 0;
      totalGoal = count * blockVal;
    } else if (tempChallengeValueMode === 'total') {
      totalGoal = parseFloat(inputTotalGoal && inputTotalGoal.value ? inputTotalGoal.value : 10000) || 0;
      blockVal = count > 0 ? totalGoal / count : 0;
    } else if (tempChallengeValueMode === 'progressive') {
      totalGoal = (count * (count + 1)) / 2;
      blockVal = `R$ 1 até R$ ${count}`;
    }

    if (previewCount) previewCount.textContent = `${count} blocos`;
    if (previewBlockVal) previewBlockVal.textContent = typeof blockVal === 'number' ? formatBRL(blockVal) : blockVal;
    if (previewTotalGoal) previewTotalGoal.textContent = formatBRL(totalGoal);
  }

  function saveChallengeSettings() {
    const inputCount = document.getElementById('inputChallengeCount');
    const inputBlockVal = document.getElementById('inputChallengeBlockValue');
    const inputTotalGoal = document.getElementById('inputChallengeTotalGoal');

    const count = parseInt(inputCount ? inputCount.value : 100, 10);
    if (isNaN(count) || count <= 0) {
      showToast('Digite uma quantidade de blocos válida (mínimo 1)!', '⚠️');
      return;
    }
    if (count > 1000) {
      showToast('O limite máximo recomendado é 1.000 blocos.', '⚠️');
      return;
    }

    if (!appState.challenge) appState.challenge = {};
    appState.challenge.mode = count;
    appState.challenge.valueMode = tempChallengeValueMode;

    if (tempChallengeValueMode === 'fixed') {
      const bVal = parseFloat(inputBlockVal ? inputBlockVal.value : 100);
      appState.challenge.blockValue = isNaN(bVal) || bVal < 0 ? 100 : bVal;
      appState.challenge.targetTotal = count * appState.challenge.blockValue;
    } else if (tempChallengeValueMode === 'total') {
      const tGoal = parseFloat(inputTotalGoal ? inputTotalGoal.value : 10000);
      appState.challenge.targetTotal = isNaN(tGoal) || tGoal < 0 ? 10000 : tGoal;
      appState.challenge.blockValue = count > 0 ? appState.challenge.targetTotal / count : 100;
    } else if (tempChallengeValueMode === 'progressive') {
      appState.challenge.targetTotal = (count * (count + 1)) / 2;
    }

    // Se a quantidade de blocos diminuiu, remove marcações além do limite
    if (appState.challenge.checked) {
      Object.keys(appState.challenge.checked).forEach((k) => {
        if (parseInt(k, 10) > count) {
          delete appState.challenge.checked[k];
        }
      });
    }

    saveState();
    renderChallengeGrid();

    const modal = document.getElementById('modalChallengeSettings');
    if (modal) modal.classList.add('hidden');

    triggerHaptic(30);
    showToast(`Desafio configurado: ${count} blocos de ${formatBRL(appState.challenge.blockValue || 0)}!`, '🎯');
  }

  function resetAllChallengeChecks() {
    if (!confirm('Deseja desmarcar todos os quadradinhos para reiniciar este desafio?')) return;
    if (appState.challenge) {
      appState.challenge.checked = {};
    }
    saveState();
    renderChallengeGrid();
    triggerHaptic(20);
    showToast('Todos os quadradinhos foram desmarcados.', '🧹');
  }

  function renderAnalyticsAndDonut() {
    const cats = appState.categories || {};
    const settings = appState.settings || {};
    const goals = getGoalsList();

    let total = 0;
    const catValues = {};

    goals.forEach((g) => {
      const c = cats[g.id] || { accumulated: 0, spent: 0 };
      const val = Math.max(0, (c.accumulated || 0) - (c.spent || 0));
      catValues[g.id] = val;
      total += val;
    });

    const chartTotalDisplay = document.getElementById('chartTotalDisplay');
    if (chartTotalDisplay) chartTotalDisplay.textContent = formatBRL(total);

    const centerTotal = document.getElementById('chartCenterTotal');
    if (centerTotal) centerTotal.textContent = formatBRL(total);

    const chartTurnCount = document.getElementById('chartTurnCount');
    if (chartTurnCount) chartTurnCount.textContent = `${appState.turnCount} turnos realizados`;

    // Renderiza legendas dinâmicas
    const legendContainer = document.getElementById('chartLegendContainer');
    if (legendContainer) {
      legendContainer.innerHTML = '';
      goals.forEach((g) => {
        const palette = COLOR_PALETTES[g.color] || COLOR_PALETTES.cyan;
        const val = catValues[g.id] || 0;
        const item = document.createElement('div');
        item.className = 'flex items-center space-x-2';
        item.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full ${palette.glow}" style="background-color: ${HEX_COLORS[g.color] || '#06B6D4'}"></span>
          <span class="text-slate-300 truncate">${g.name}:</span>
          <span class="font-bold text-white tabular-numbers financial-val">${formatBRL(val)}</span>
        `;
        legendContainer.appendChild(item);
      });
    }

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
      kpiLucroExtra.textContent = formatBRL(appState.totalPeakExtra || 0);
    }

    renderDynamicDonutSvg(goals, catValues, total);
    renderHistoryList();
  }

  function renderDynamicDonutSvg(goals, catValues, total) {
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

    let accumulatedPct = 0;

    goals.forEach((g) => {
      const val = catValues[g.id] || 0;
      const pct = (val / total) * 100;
      if (pct <= 0) return;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center);
      circle.setAttribute('cy', center);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', HEX_COLORS[g.color] || '#06B6D4');
      circle.setAttribute('stroke-width', '4.5');
      circle.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
      circle.setAttribute('stroke-dashoffset', -accumulatedPct);
      circle.setAttribute('class', 'transition-all duration-700');
      svg.appendChild(circle);

      accumulatedPct += pct;
    });
  }

  // Fallback para código legado
  function renderDonutSvg(vExt, vCon, vRes, vOfi, total) {
    const goals = getGoalsList();
    const catValues = {
      exterior: vExt,
      contas: vCon,
      reserva: vRes,
      oficina: vOfi,
    };
    renderDynamicDonutSvg(goals, catValues, total);
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
    const monthNames = MONTH_NAMES;

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
    const activeDebts = debts.filter((d) => d.months && d.months.includes(currentMonth));

    let totalMonth = 0;
    let pendingMonth = 0;

    listEl.innerHTML = '';

    if (activeDebts.length === 0) {
      listEl.innerHTML = `
        <div class="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
          <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500/40"></i>
          <span>Nenhum compromisso cadastrado para ${monthNames[currentMonth]}.</span>
          <button id="btnEmptyAddDebt" class="mt-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center space-x-1.5 active:scale-95 transition-all">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>+ Colocar Conta</span>
          </button>
        </div>
      `;
      const btnEmptyAdd = listEl.querySelector('#btnEmptyAddDebt');
      if (btnEmptyAdd) {
        btnEmptyAdd.addEventListener('click', () => {
          const modalNewDebt = document.getElementById('modalNewDebt');
          if (modalNewDebt) {
            document.getElementById('newDebtTitle').value = '';
            document.getElementById('newDebtValue').value = '';
            modalNewDebt.classList.remove('hidden');
          }
        });
      }
    } else {
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
            }" data-id="${debt.id}" title="${isPaid ? 'Marcar como pendente' : 'Marcar como pago'}">
              ✓
            </button>
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="font-bold ${isPaid ? 'line-through text-slate-400' : 'text-white'}">${debt.title}</span>
                ${debt.isHighlight ? '<span class="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">Destaque</span>' : ''}
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
                    Abater
                  </button>`
                : ''
            }
            <button class="btn-del-debt p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 active:scale-90 transition-all" data-id="${debt.id}" title="Tirar/Excluir Conta">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
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

        const btnDel = card.querySelector('.btn-del-debt');
        if (btnDel) {
          btnDel.addEventListener('click', () => {
            deleteDebt(debt.id);
          });
        }

        listEl.appendChild(card);
      });
    }

    const totalEl = document.getElementById('monthTotalDebts');
    const pendingEl = document.getElementById('monthPendingDebts');
    if (totalEl) totalEl.textContent = formatBRL(totalMonth);
    if (pendingEl) pendingEl.textContent = formatBRL(pendingMonth);

    renderHighlightBanner(currentMonth, activeDebts);
  }

  function renderHighlightBanner(currentMonth, activeDebts) {
    const highlightCard = document.getElementById('highlightDebtCard');
    if (!highlightCard) return;

    if (!activeDebts || activeDebts.length === 0) {
      highlightCard.classList.add('hidden');
      return;
    }

    const targetDebt = activeDebts.find((d) => d.isHighlight) || activeDebts.find((d) => !(d.paidMonths || []).includes(currentMonth)) || activeDebts[0];
    if (!targetDebt) {
      highlightCard.classList.add('hidden');
      return;
    }

    highlightCard.classList.remove('hidden');

    const titleEl = document.getElementById('highlightDebtTitle');
    const badgeEl = document.getElementById('highlightDebtBadge');
    const subtitleEl = document.getElementById('highlightDebtSubtitle');
    const scheduleEl = document.getElementById('highlightDebtSchedule');
    const statusEl = document.getElementById('highlightPurchaseStatus');

    if (titleEl) titleEl.textContent = targetDebt.title;
    if (badgeEl) badgeEl.textContent = `${(targetDebt.months || []).length}x parcelas`;
    if (subtitleEl) subtitleEl.innerHTML = `Parcela mensal: <strong class="text-white tabular-numbers financial-val">${formatBRL(targetDebt.value)}</strong>`;
    if (scheduleEl) scheduleEl.textContent = `Cronograma: ${(targetDebt.months || []).map((m) => m.toUpperCase()).join(' / ')}`;

    const isPaid = (targetDebt.paidMonths || []).includes(currentMonth);
    if (statusEl) {
      statusEl.textContent = isPaid ? `✅ Liquidada em ${currentMonth.toUpperCase()}` : `⏳ Pendente para ${currentMonth.toUpperCase()}`;
      statusEl.className = isPaid ? 'font-bold text-emerald-400' : 'font-bold text-cyan-400';
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
    renderDashboardBento();
    triggerHaptic(20);
    showToast(`Conta "${title}" cadastrada!`, '💳');
  }

  function deleteDebt(debtId) {
    const debt = (appState.debts || []).find((d) => d.id === debtId);
    const title = debt ? debt.title : 'esta conta';
    if (!confirm(`Deseja tirar "${title}" dos seus compromissos?`)) return;

    appState.debts = (appState.debts || []).filter((d) => d.id !== debtId);
    saveState();
    renderDebtsSection();
    renderDashboardBento();
    triggerHaptic(20);
    showToast(`Conta "${title}" removida com sucesso!`, '🗑️');
  }

  function clearAllDebts() {
    if (!appState.debts || appState.debts.length === 0) {
      showToast('Não há contas cadastradas para remover.', 'ℹ️');
      return;
    }
    if (!confirm('Deseja apagar TODAS as contas cadastradas deste perfil? O perfil ficará totalmente zerado.')) return;
    appState.debts = [];
    saveState();
    renderDebtsSection();
    renderDashboardBento();
    triggerHaptic(25);
    showToast('Todas as contas foram removidas. Perfil zerado!', '🧹');
  }

  function renderSettingsForm() {
    const s = appState.settings || {};
    setInputValue('settingMetaTurnos', s.metaTurnos || 26);
    renderSettingsGoalsList();
    renderSettingsChallengeForm();
  }

  function renderSettingsGoalsList() {
    const container = document.getElementById('settingsGoalsListContainer');
    if (!container) return;
    const goals = getGoalsList();
    const currentMonth = appState.selectedDebtMonth || 'fev';
    const monthShort = {
      jan: 'Jan', fev: 'Fev', mar: 'Mar', abr: 'Abr',
      mai: 'Mai', jun: 'Jun', jul: 'Jul', ago: 'Ago',
      set: 'Set', out: 'Out', nov: 'Nov', dez: 'Dez'
    };

    container.innerHTML = '';
    goals.forEach((goal) => {
      const palette = COLOR_PALETTES[goal.color] || COLOR_PALETTES.cyan;
      const targetVal = getEffectiveGoalTarget(goal);
      const isSynced = goal.isContas && goal.syncWithDebts !== false;
      const row = document.createElement('div');
      row.className = 'p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs gap-2';

      row.innerHTML = `
        <div class="flex items-center space-x-2.5 min-w-0 flex-1">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 ${palette.glow}" style="background-color: ${HEX_COLORS[goal.color] || '#06B6D4'}"></span>
          <div class="min-w-0">
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-white truncate">${goal.name}</span>
              ${goal.isContas ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">Contas</span>' : ''}
            </div>
            ${isSynced ? `<p class="text-[10px] text-emerald-400 font-medium">Sincronizado com Dívidas (${monthShort[currentMonth] || currentMonth})</p>` : `<p class="text-[10px] text-slate-400">Meta Mensal</p>`}
          </div>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          <div class="relative w-28">
            <span class="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold">R$</span>
            <input type="number" step="0.01" class="setting-goal-target-input w-full bg-black/40 border ${isSynced ? 'border-emerald-500/20 opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-cyan-400'} rounded-xl py-1.5 pl-7 pr-2 text-xs font-bold text-white focus:outline-none" data-goal-id="${goal.id}" value="${targetVal}" ${isSynced ? 'readonly title="Sincronizado com a aba Dívidas"' : ''}>
          </div>
          <button class="btn-del-goal-settings p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs active:scale-90 transition-all" data-id="${goal.id}" title="Tirar Meta">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;

      row.querySelector('.btn-del-goal-settings').addEventListener('click', () => {
        deleteGoal(goal.id);
      });

      container.appendChild(row);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderSettingsChallengeForm() {
    if (!appState.challenge) {
      appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    }
    const ch = appState.challenge;
    const mode = parseInt(ch.mode, 10) || 100;
    const blockVal = ch.blockValue !== undefined ? ch.blockValue : 100;
    const targetTotal = ch.targetTotal !== undefined ? ch.targetTotal : (mode * blockVal);

    setInputValue('settingChallengeTargetTotal', targetTotal);
    setInputValue('settingChallengeCount', mode);
    setInputValue('settingChallengeBlockValue', blockVal);

    const badge = document.getElementById('badgeChallengeSummary');
    if (badge) badge.textContent = `${mode} blocos`;
  }

  function autoCalcChallengeBlockValue() {
    const totalInput = document.getElementById('settingChallengeTargetTotal');
    const countInput = document.getElementById('settingChallengeCount');
    const blockValInput = document.getElementById('settingChallengeBlockValue');

    const total = parseFloat(totalInput?.value) || 0;
    const count = parseInt(countInput?.value, 10) || 100;

    if (count <= 0) {
      showToast('A quantidade de quadradinhos deve ser maior que 0!', '⚠️');
      return;
    }
    if (total <= 0) {
      showToast('Informe o valor total da meta para calcular!', '⚠️');
      return;
    }

    const val = Math.round((total / count) * 100) / 100;
    if (blockValInput) blockValInput.value = val;
    triggerHaptic(15);
    showToast(`Valor calculado: ${formatBRL(val)} por quadradinho`, '🧮');
  }

  function saveChallengeSettingsFromTab() {
    const totalInput = document.getElementById('settingChallengeTargetTotal');
    const countInput = document.getElementById('settingChallengeCount');
    const blockValInput = document.getElementById('settingChallengeBlockValue');

    let total = parseFloat(totalInput?.value) || 0;
    let count = parseInt(countInput?.value, 10) || 100;
    let blockVal = parseFloat(blockValInput?.value) || 0;

    if (count < 1) count = 1;
    if (count > 1000) count = 1000;

    if (blockVal <= 0 && total > 0 && count > 0) {
      blockVal = Math.round((total / count) * 100) / 100;
      if (blockValInput) blockValInput.value = blockVal;
    }

    if (total <= 0 && blockVal > 0 && count > 0) {
      total = Math.round(count * blockVal * 100) / 100;
      if (totalInput) totalInput.value = total;
    }

    if (!appState.challenge) {
      appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    }

    appState.challenge.mode = count;
    appState.challenge.blockValue = blockVal;
    appState.challenge.targetTotal = total;
    appState.challenge.valueMode = 'fixed';

    saveState();
    renderChallengeGrid();
    renderSettingsChallengeForm();
    triggerHaptic(25);
    showToast(`Tabela do desafio atualizada: ${count} quadradinhos de ${formatBRL(blockVal)}!`, '🏆');
  }

  function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function saveSettings() {
    const turInput = document.getElementById('settingMetaTurnos');
    const tur = turInput ? parseInt(turInput.value, 10) || 26 : 26;

    if (!appState.settings) appState.settings = {};
    appState.settings.metaTurnos = tur;

    // Salvar metas editadas na lista de configurações
    const targetInputs = document.querySelectorAll('.setting-goal-target-input');
    const goals = getGoalsList();
    targetInputs.forEach((input) => {
      const gId = input.dataset.goalId;
      const targetVal = parseFloat(input.value);
      if (!isNaN(targetVal) && targetVal >= 0) {
        const goal = goals.find((g) => g.id === gId);
        if (goal && (!goal.isContas || goal.syncWithDebts === false)) {
          goal.target = targetVal;
          if (gId === 'exterior') appState.settings.metaExterior = targetVal;
          if (gId === 'reserva') appState.settings.metaReserva = targetVal;
          if (gId === 'oficina') appState.settings.metaOficina = targetVal;
          if (gId === 'contas') appState.settings.metaContas = targetVal;
        }
      }
    });

    saveState();
    renderAll();
    triggerHaptic(20);
    showToast('Metas e turnos atualizados com sucesso!', '⚙️');
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
      goals: [
        { id: 'contas', name: 'Minhas Contas', target: 1450, color: 'emerald', icon: 'receipt', isContas: true, syncWithDebts: true },
        { id: 'reserva', name: 'Minha Reserva', target: 400, color: 'purple', icon: 'shield', isPeakTarget: true },
        { id: 'exterior', name: 'Namorado', target: 500, color: 'cyan', icon: 'heart', isPeakTarget: true },
        { id: 'oficina', name: 'Oficina Bike', target: 250, color: 'amber', icon: 'wrench' },
      ],
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
    if (!confirm('ATENÇÃO: Deseja apagar todos os lançamentos do perfil atual? O perfil ficará totalmente zerado.')) return;
    const activeId = getActiveUserId();
    localStorage.removeItem(getStorageKeyForUser(activeId));
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    appState.goals = JSON.parse(JSON.stringify(DEFAULT_STATE.goals));
    appState.debts = [];
    appState.entries = [];
    appState.expenses = [];
    appState.turnCount = 0;
    appState.totalAccumulatedMonth = 0;
    appState.totalPeakExtra = 0;
    appState.challenge = { mode: 100, valueMode: 'fixed', blockValue: 100, targetTotal: 10000, customValues: {}, checked: {} };
    saveState();
    renderAll();
    showToast('Dados do usuário atual foram resetados (100% zerado).', '🧹');
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
        if (!appState.debts || appState.debts.length === 0) {
          const modalNewDebt = document.getElementById('modalNewDebt');
          if (modalNewDebt) {
            document.getElementById('newDebtTitle').value = '';
            document.getElementById('newDebtValue').value = '';
            modalNewDebt.classList.remove('hidden');
            return;
          }
        }
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

    // Colocar em Contas (Modal & Opções)
    const btnQuickAddConta = document.getElementById('btnQuickAddConta');
    const modalColocarMenu = document.getElementById('modalColocarMenu');
    const btnCloseColocarMenu = document.getElementById('btnCloseColocarMenu');
    const btnOptionAddDebt = document.getElementById('btnOptionAddDebt');
    const btnOptionAddBalance = document.getElementById('btnOptionAddBalance');

    if (btnQuickAddConta && modalColocarMenu) {
      btnQuickAddConta.addEventListener('click', () => {
        modalColocarMenu.classList.remove('hidden');
        triggerHaptic(15);
      });
    }
    if (btnCloseColocarMenu && modalColocarMenu) {
      btnCloseColocarMenu.addEventListener('click', () => modalColocarMenu.classList.add('hidden'));
    }

    // Modal Saldo Avulso em Contas
    const modalAddContasBalance = document.getElementById('modalAddContasBalance');
    const btnCancelAddBalance = document.getElementById('btnCancelAddBalance');
    const btnConfirmAddBalance = document.getElementById('btnConfirmAddBalance');

    if (btnOptionAddBalance && modalAddContasBalance) {
      btnOptionAddBalance.addEventListener('click', () => {
        if (modalColocarMenu) modalColocarMenu.classList.add('hidden');
        document.getElementById('addContasBalanceDesc').value = '';
        document.getElementById('addContasBalanceValue').value = '';
        modalAddContasBalance.classList.remove('hidden');
        triggerHaptic(15);
      });
    }
    if (btnCancelAddBalance && modalAddContasBalance) {
      btnCancelAddBalance.addEventListener('click', () => modalAddContasBalance.classList.add('hidden'));
    }
    if (btnConfirmAddBalance && modalAddContasBalance) {
      btnConfirmAddBalance.addEventListener('click', () => {
        const desc = document.getElementById('addContasBalanceDesc').value;
        const val = document.getElementById('addContasBalanceValue').value;
        registerContasDeposit(desc, val);
        modalAddContasBalance.classList.add('hidden');
      });
    }

    // Tirar de Contas (Modal & Opções)
    const btnQuickRemoveConta = document.getElementById('btnQuickRemoveConta');
    const modalTirarMenu = document.getElementById('modalTirarMenu');
    const btnCloseTirarMenu = document.getElementById('btnCloseTirarMenu');
    const btnOptionExpenseMoney = document.getElementById('btnOptionExpenseMoney');
    const btnOptionManageDebts = document.getElementById('btnOptionManageDebts');

    if (btnQuickRemoveConta && modalTirarMenu) {
      btnQuickRemoveConta.addEventListener('click', () => {
        modalTirarMenu.classList.remove('hidden');
        triggerHaptic(15);
      });
    }
    if (btnCloseTirarMenu && modalTirarMenu) {
      btnCloseTirarMenu.addEventListener('click', () => modalTirarMenu.classList.add('hidden'));
    }
    if (btnOptionManageDebts) {
      btnOptionManageDebts.addEventListener('click', () => {
        if (modalTirarMenu) modalTirarMenu.classList.add('hidden');
        switchTab('tab-dividas');
      });
    }

    const btnQuickExpense = document.getElementById('btnQuickExpense');
    const modalExpense = document.getElementById('modalExpense');
    const btnCancelExpense = document.getElementById('btnCancelExpense');
    const btnConfirmExpense = document.getElementById('btnConfirmExpense');

    if (btnOptionExpenseMoney && modalExpense) {
      btnOptionExpenseMoney.addEventListener('click', () => {
        if (modalTirarMenu) modalTirarMenu.classList.add('hidden');
        document.getElementById('expenseDesc').value = '';
        document.getElementById('expenseValue').value = '';
        modalExpense.classList.remove('hidden');
        triggerHaptic(15);
      });
    }

    if (btnQuickExpense && modalExpense) {
      btnQuickExpense.addEventListener('click', () => {
        document.getElementById('expenseDesc').value = '';
        document.getElementById('expenseValue').value = '';
        modalExpense.classList.remove('hidden');
        triggerHaptic(15);
      });
    }
    if (btnCancelExpense && modalExpense) {
      btnCancelExpense.addEventListener('click', () => modalExpense.classList.add('hidden'));
    }
    if (btnConfirmExpense && modalExpense) {
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

    // Modal Configurar Desafio
    const btnOpenChallengeSettings = document.getElementById('btnOpenChallengeSettings');
    const btnCustomChallengePill = document.getElementById('btnCustomChallengePill');
    const btnCloseChallengeSettings = document.getElementById('btnCloseChallengeSettings');
    const btnCancelChallengeSettings = document.getElementById('btnCancelChallengeSettings');
    const btnSaveChallengeSettings = document.getElementById('btnSaveChallengeSettings');
    const btnResetChallengeChecks = document.getElementById('btnResetChallengeChecks');

    if (btnOpenChallengeSettings) {
      btnOpenChallengeSettings.addEventListener('click', openChallengeSettingsModal);
    }
    if (btnCustomChallengePill) {
      btnCustomChallengePill.addEventListener('click', openChallengeSettingsModal);
    }
    if (btnCloseChallengeSettings) {
      btnCloseChallengeSettings.addEventListener('click', () => {
        const m = document.getElementById('modalChallengeSettings');
        if (m) m.classList.add('hidden');
      });
    }
    if (btnCancelChallengeSettings) {
      btnCancelChallengeSettings.addEventListener('click', () => {
        const m = document.getElementById('modalChallengeSettings');
        if (m) m.classList.add('hidden');
      });
    }
    if (btnSaveChallengeSettings) {
      btnSaveChallengeSettings.addEventListener('click', saveChallengeSettings);
    }
    if (btnResetChallengeChecks) {
      btnResetChallengeChecks.addEventListener('click', resetAllChallengeChecks);
    }

    // Modos de cálculo do desafio no modal
    const btnModeValFixed = document.getElementById('btnModeValFixed');
    const btnModeValTotal = document.getElementById('btnModeValTotal');
    const btnModeValProgressive = document.getElementById('btnModeValProgressive');

    if (btnModeValFixed) btnModeValFixed.addEventListener('click', () => setChallengeSettingsValueMode('fixed'));
    if (btnModeValTotal) btnModeValTotal.addEventListener('click', () => setChallengeSettingsValueMode('total'));
    if (btnModeValProgressive) btnModeValProgressive.addEventListener('click', () => setChallengeSettingsValueMode('progressive'));

    // Inputs com prévia em tempo real
    const inputChallengeCount = document.getElementById('inputChallengeCount');
    const inputChallengeBlockValue = document.getElementById('inputChallengeBlockValue');
    const inputChallengeTotalGoal = document.getElementById('inputChallengeTotalGoal');

    [inputChallengeCount, inputChallengeBlockValue, inputChallengeTotalGoal].forEach((inp) => {
      if (inp) inp.addEventListener('input', updateChallengeSettingsPreview);
    });

    // Atalhos de quantidade no modal
    document.querySelectorAll('.btn-preset-count').forEach((btn) => {
      btn.addEventListener('click', () => {
        const count = btn.dataset.count;
        if (inputChallengeCount) {
          inputChallengeCount.value = count;
          updateChallengeSettingsPreview();
          triggerHaptic(10);
        }
      });
    });

    // Atalhos de valor no modal
    document.querySelectorAll('.btn-preset-val').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val;
        if (inputChallengeBlockValue) {
          inputChallengeBlockValue.value = val;
          updateChallengeSettingsPreview();
          triggerHaptic(10);
        }
      });
    });

    // Modal de Depósito no Bloco (Gamificação do Desafio)
    const btnCloseBlockDeposit = document.getElementById('btnCloseBlockDepositModal');
    const btnConfirmBlockDeposit = document.getElementById('btnConfirmBlockDeposit');
    const btnUncheckBlockDeposit = document.getElementById('btnUncheckBlockDeposit');

    if (btnCloseBlockDeposit) btnCloseBlockDeposit.addEventListener('click', closeBlockDepositModal);
    if (btnConfirmBlockDeposit) btnConfirmBlockDeposit.addEventListener('click', confirmBlockDeposit);
    if (btnUncheckBlockDeposit) btnUncheckBlockDeposit.addEventListener('click', uncheckBlockDeposit);

    document.querySelectorAll('.btn-deposit-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = parseFloat(btn.dataset.val);
        if (v) {
          const inputVal = document.getElementById('inputBlockDepositValue');
          if (inputVal) inputVal.value = v;
          triggerHaptic(10);
        }
      });
    });

    // Desafio Edição na Aba Ajustes (Tab 5)
    const btnSaveChallengeTab = document.getElementById('btnSaveChallengeSettingsTab');
    const btnAutoCalcTab = document.getElementById('btnAutoCalcBlockValue');

    if (btnSaveChallengeTab) btnSaveChallengeTab.addEventListener('click', saveChallengeSettingsFromTab);
    if (btnAutoCalcTab) btnAutoCalcTab.addEventListener('click', autoCalcChallengeBlockValue);

    document.querySelectorAll('.btn-setting-challenge-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = parseInt(btn.dataset.count, 10);
        if (c) {
          const countInput = document.getElementById('settingChallengeCount');
          if (countInput) countInput.value = c;
          autoCalcChallengeBlockValue();
          triggerHaptic(15);
        }
      });
    });

    // Seletores rápidos na aba Desafio
    document.querySelectorAll('.challenge-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = parseInt(btn.dataset.mode, 10);
        if (!appState.challenge) appState.challenge = {};
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
        renderDashboardBento();
        triggerHaptic(15);
      });
    });

    // Gerenciador de Metas (Colocar / Tirar Metas)
    const btnOpenGoalsHome = document.getElementById('btnOpenManageGoalsHome');
    const btnOpenGoalsAjustes = document.getElementById('btnOpenManageGoalsAjustes');
    const btnCloseGoals = document.getElementById('btnCloseManageGoals');
    const btnSaveGoals = document.getElementById('btnSaveGoalsModal');
    const btnAddGoalConfirm = document.getElementById('btnAddGoalConfirm');

    if (btnOpenGoalsHome) btnOpenGoalsHome.addEventListener('click', openManageGoalsModal);
    if (btnOpenGoalsAjustes) btnOpenGoalsAjustes.addEventListener('click', openManageGoalsModal);
    if (btnCloseGoals) btnCloseGoals.addEventListener('click', closeManageGoalsModal);
    if (btnSaveGoals) btnSaveGoals.addEventListener('click', saveGoalsFromModal);
    if (btnAddGoalConfirm) btnAddGoalConfirm.addEventListener('click', addCustomGoal);

    // Seletor de Cores no Modal de Adicionar Meta
    document.querySelectorAll('.btn-color-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-color-pick').forEach((b) => {
          b.classList.remove('scale-110', 'border-white');
          b.classList.add('border-transparent');
        });
        btn.classList.add('scale-110', 'border-white');
        btn.classList.remove('border-transparent');
        selectedNewGoalColor = btn.dataset.color || 'cyan';
        triggerHaptic(10);
      });
    });

    const btnNewDebt = document.getElementById('btnNewDebtModal');
    const modalNewDebt = document.getElementById('modalNewDebt');
    const btnCancelNewDebt = document.getElementById('btnCancelNewDebt');
    const btnConfirmNewDebt = document.getElementById('btnConfirmNewDebt');
    const btnClearAllDebts = document.getElementById('btnClearAllDebts');

    if (btnOptionAddDebt && modalNewDebt) {
      btnOptionAddDebt.addEventListener('click', () => {
        if (modalColocarMenu) modalColocarMenu.classList.add('hidden');
        document.getElementById('newDebtTitle').value = '';
        document.getElementById('newDebtValue').value = '';
        modalNewDebt.classList.remove('hidden');
        triggerHaptic(15);
      });
    }

    if (btnClearAllDebts) {
      btnClearAllDebts.addEventListener('click', clearAllDebts);
    }

    if (btnNewDebt && modalNewDebt) {
      btnNewDebt.addEventListener('click', () => {
        document.getElementById('newDebtTitle').value = '';
        document.getElementById('newDebtValue').value = '';
        modalNewDebt.classList.remove('hidden');
        triggerHaptic(15);
      });
      btnCancelNewDebt.addEventListener('click', () => modalNewDebt.classList.add('hidden'));
      btnConfirmNewDebt.addEventListener('click', () => {
        const title = document.getElementById('newDebtTitle').value;
        const value = document.getElementById('newDebtValue').value;
        const months = [];
        MONTHS_LIST.forEach((m) => {
          const chk = document.getElementById(`chk${m.short}`);
          if (chk && chk.checked) months.push(m.key);
        });

        addNewDebt(title, value, months);
        modalNewDebt.classList.add('hidden');
      });

      const btnSelectAllDebtMonths = document.getElementById('btnSelectAllDebtMonths');
      const btnClearDebtMonths = document.getElementById('btnClearDebtMonths');
      if (btnSelectAllDebtMonths) {
        btnSelectAllDebtMonths.addEventListener('click', () => {
          document.querySelectorAll('.chk-debt-month').forEach((chk) => { chk.checked = true; });
        });
      }
      if (btnClearDebtMonths) {
        btnClearDebtMonths.addEventListener('click', () => {
          document.querySelectorAll('.chk-debt-month').forEach((chk) => { chk.checked = false; });
        });
      }
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
