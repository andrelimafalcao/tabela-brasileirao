# Brasileirão 2026 — Classificação ao Vivo

Tabela de classificação do Brasileirão Série A 2026, atualizada automaticamente a cada 30 minutos.

**Três visualizações:**
- Por Pontos Ganhos (tabela padrão)
- Por Pontos Perdidos — `(jogos × 3) − pontos`
- Por Aproveitamento — `(pontos / (jogos × 3)) × 100%`

---

## Setup (one-time)

### 1. Create the GitHub repository

```bash
gh repo create brasileirao-2026 --public
git remote add origin https://github.com/<your-username>/brasileirao-2026.git
git push -u origin main
```

### 2. Get a free API-Football key

1. Sign up at [rapidapi.com](https://rapidapi.com/api-sports/api/api-football)
2. Subscribe to the **Basic (free)** plan — 100 requests/day
3. Copy your `X-RapidAPI-Key`

### 3. Add the API key as a GitHub Secret

In your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `API_FOOTBALL_KEY` | your RapidAPI key |

### 4. Enable GitHub Pages

In your repo → **Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)`
- Save

Your page will be live at: `https://<your-username>.github.io/brasileirao-2026/`

### 5. Trigger the first data fetch

In your repo → **Actions → Fetch Brasileirão Standings → Run workflow**

This fetches live data immediately without waiting for the 30-minute schedule.

---

## How it works

```
GitHub Actions (every 30 min)
  └─ Fetches /standings?league=71&season=2026 from API-Football
  └─ Validates response structure
  └─ Injects fetched_at timestamp
  └─ Commits updated data.json to main [skip ci]

Browser (on page load + every 5 min)
  └─ Fetches data.json from GitHub Pages CDN
  └─ Renders the active table
  └─ Shows last-updated timestamp
```

The API key is stored in GitHub Secrets and never exposed to the browser.

---

## Data source

- **API:** [API-Football v3](https://www.api-football.com/documentation-v3)
- **League ID:** 71 (Brazil Serie A)
- **Season:** 2026
- **Free tier:** 100 requests/day (≈ 48 fetches at 30-min intervals + headroom)
