'use strict';

// ── Config ────────────────────────────────────────────────────────
const DATA_URL      = './data.json';
const RELOAD_MS     = 5 * 60 * 1000; // client re-fetches data.json every 5 min

// Brasileirão Serie A classification zones (20 teams)
const ZONES = [
  { from: 1,  to: 4,  cls: 'zone-libertadores',  label: 'Libertadores (fase de grupos)' },
  { from: 5,  to: 6,  cls: 'zone-pre-lib',        label: 'Libertadores (pré-fase)'       },
  { from: 7,  to: 12, cls: 'zone-sulamericana',   label: 'Sul-Americana'                 },
  { from: 17, to: 20, cls: 'zone-relega',         label: 'Rebaixamento'                  },
];

// ── State ─────────────────────────────────────────────────────────
let activeTab  = 'points';
let teams      = [];
let fetchedAt  = null;

// ── Data loading ──────────────────────────────────────────────────
async function loadData() {
  try {
    const res  = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw  = await res.json();

    fetchedAt  = raw.fetched_at || null;
    teams      = parseStandings(raw);
    render();
  } catch (err) {
    if (teams.length === 0) showError(err.message);
    console.warn('[brasileirao] fetch failed:', err.message);
  }
}

function parseStandings(raw) {
  try {
    const list = raw.response.standing;
    return list.map(t => {
      const [goalsFor, goalsAgainst] = (t.scoresStr || '0-0').split('-').map(Number);
      return {
        rank:         t.idx,
        name:         t.name,
        logo:         `https://images.fotmob.com/image_resources/logo/teamlogo/${t.id}.png`,
        played:       t.played,
        win:          t.wins,
        draw:         t.draws,
        lose:         t.losses,
        goalsFor,
        goalsAgainst,
        goalsDiff:    t.goalConDiff,
        points:       t.pts,
        qualColor:    t.qualColor || null,
        // Derived
        pointsDisputed: t.played * 3,
        pointsLost:     (t.played * 3) - t.pts,
        performance:    t.played > 0
          ? ((t.pts / (t.played * 3)) * 100).toFixed(1)
          : '—',
      };
    });
  } catch {
    return [];
  }
}

// ── Render ────────────────────────────────────────────────────────
function render() {
  updateStatusBar();
  renderTable();
}

function updateStatusBar() {
  const el = document.getElementById('last-updated');
  if (!el) return;
  if (fetchedAt) {
    const d = new Date(fetchedAt);
    el.textContent = d.toLocaleString('pt-BR', {
      day:    '2-digit', month: '2-digit', year: 'numeric',
      hour:   '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  } else {
    el.textContent = 'dados locais';
  }
}

function renderTable() {
  const wrap = document.getElementById('table-wrap');
  if (!wrap) return;

  if (teams.length === 0) {
    wrap.innerHTML = `
      <div class="state-msg">
        <div class="icon">⏳</div>
        <p>Aguardando dados da temporada 2026…</p>
        <p style="margin-top:8px;font-size:12px;">Os dados serão atualizados automaticamente a cada 30 minutos.</p>
      </div>`;
    return;
  }

  const sorted = getSortedTeams();
  const headers = getHeaders();
  const rows    = sorted.map((t, i) => buildRow(t, i + 1)).join('');

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function getSortedTeams() {
  const copy = [...teams];
  if (activeTab === 'points') {
    return copy.sort((a, b) => b.points - a.points || b.goalsDiff - a.goalsDiff
      || b.win - a.win || a.name.localeCompare(b.name));
  }
  if (activeTab === 'lost') {
    return copy.sort((a, b) => a.pointsLost - b.pointsLost || a.name.localeCompare(b.name));
  }
  // performance
  return copy.sort((a, b) =>
    parseFloat(b.performance) - parseFloat(a.performance)
    || b.points - a.points || a.name.localeCompare(b.name));
}

function getHeaders() {
  const common = `
    <th>#</th>
    <th>Clube</th>
    <th title="Jogos">J</th>
    <th title="Vitórias">V</th>
    <th title="Empates">E</th>
    <th title="Derrotas">D</th>
    <th title="Gols Pró">GP</th>
    <th title="Gols Contra">GC</th>
    <th title="Saldo de Gols">SG</th>`;

  if (activeTab === 'points') return common + `<th title="Pontos">Pts</th>`;
  if (activeTab === 'lost')   return common + `<th title="Pontos Perdidos">P.Perd</th>`;
  return common + `<th title="Pontos Disputados">P.Disp</th><th title="Aproveitamento">Aprov.</th>`;
}

function buildRow(t, displayRank) {
  const zoneCls = getZoneClass(displayRank);
  const logo    = t.logo
    ? `<img class="club-logo" src="${t.logo}" alt="${t.name}" loading="lazy" onerror="this.replaceWith(makePlaceholder())">`
    : `<div class="club-logo-placeholder"></div>`;

  const diff = t.goalsDiff >= 0 ? `+${t.goalsDiff}` : `${t.goalsDiff}`;

  let extraCols = '';
  if (activeTab === 'points') {
    extraCols = `<td class="highlight">${t.points}</td>`;
  } else if (activeTab === 'lost') {
    extraCols = `<td class="pts-lost">${t.pointsLost}</td>`;
  } else {
    extraCols = `<td>${t.pointsDisputed}</td><td class="aprov">${t.performance}%</td>`;
  }

  return `
    <tr class="${zoneCls}">
      <td class="pos">${displayRank}</td>
      <td>
        <div class="club-cell">
          ${logo}
          <span class="club-name">${t.name}</span>
        </div>
      </td>
      <td>${t.played}</td>
      <td>${t.win}</td>
      <td>${t.draw}</td>
      <td>${t.lose}</td>
      <td>${t.goalsFor}</td>
      <td>${t.goalsAgainst}</td>
      <td>${diff}</td>
      ${extraCols}
    </tr>`;
}

function getZoneClass(rank) {
  for (const z of ZONES) {
    if (rank >= z.from && rank <= z.to) return z.cls;
  }
  return '';
}

function showError(msg) {
  const wrap = document.getElementById('table-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="state-msg">
      <div class="icon">⚠️</div>
      <p>Não foi possível carregar os dados.</p>
      <p style="margin-top:8px;font-size:12px;color:#6b7280">${msg}</p>
    </div>`;
}

// ── Tabs ──────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTable();
    });
  });
}

// ── Refresh button ────────────────────────────────────────────────
function initRefreshBtn() {
  const btn = document.getElementById('refresh-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.textContent = '↻ Atualizando…';
    btn.disabled = true;
    await loadData();
    btn.textContent = '↻ Atualizar';
    btn.disabled = false;
  });
}

// ── Placeholder helper (used inline in onerror) ───────────────────
window.makePlaceholder = function () {
  const d = document.createElement('div');
  d.className = 'club-logo-placeholder';
  return d;
};

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initRefreshBtn();
  loadData();
  setInterval(loadData, RELOAD_MS);
});
