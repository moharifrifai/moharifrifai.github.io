const projectsEl = document.getElementById('projects');
const themeToggleBtn = document.getElementById('theme-toggle');
const cvBtn = document.getElementById('cv-btn');
const cvModal = document.getElementById('cv-modal');
// stats element (summary header)
const statsEl = document.createElement('div');
statsEl.id = 'stats';
statsEl.className = 'stats';
projectsEl.parentNode.insertBefore(statsEl, projectsEl);

// status element (loading / error messages)
const statusEl = document.createElement('div');
statusEl.id = 'status';
projectsEl.parentNode.insertBefore(statusEl, projectsEl);
// preview modal container
const previewModal = document.createElement('div');
previewModal.id = 'preview-modal';
previewModal.className = 'preview-modal';
previewModal.innerHTML = `
  <div class="preview-backdrop" id="preview-backdrop"></div>
  <div class="preview-dialog" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="preview-header">
      <div class="preview-title">Live Preview</div>
      <div class="preview-controls">
        <button id="preview-open-tab" class="preview-action">Open in new tab</button>
        <button id="preview-close" class="preview-action">Close</button>
      </div>
    </div>
    <div class="preview-body" id="preview-body"></div>
  </div>
`;
document.body.appendChild(previewModal);

// modal helpers
function openPreviewModal(url) {
  const body = previewModal.querySelector('#preview-body');
  body.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.className = 'live-iframe';
  iframe.src = url;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.sandbox = 'allow-forms allow-popups allow-scripts allow-same-origin';
  body.appendChild(iframe);

  previewModal.querySelector('.preview-dialog').setAttribute('aria-hidden', 'false');
  previewModal.classList.add('open');

  // wire open-in-tab and close
  const openBtn = previewModal.querySelector('#preview-open-tab');
  const closeBtn = previewModal.querySelector('#preview-close');
  openBtn.onclick = () => window.open(url, '_blank');
  closeBtn.onclick = closePreviewModal;

  // close when clicking backdrop
  previewModal.querySelector('#preview-backdrop').onclick = closePreviewModal;
  // ESC to close
  document.addEventListener('keydown', escListener);
}

function closePreviewModal() {
  const body = previewModal.querySelector('#preview-body');
  if (body) body.innerHTML = '';
  previewModal.querySelector('.preview-dialog').setAttribute('aria-hidden', 'true');
  previewModal.classList.remove('open');
  document.removeEventListener('keydown', escListener);
}

function escListener(e) { if (e.key === 'Escape') closePreviewModal(); }

// CV Modal helpers
function openCVModal() {
  cvModal.querySelector('.cv-dialog').setAttribute('aria-hidden', 'false');
  cvModal.classList.add('open');
  document.addEventListener('keydown', cvEscListener);
}

function closeCVModal() {
  cvModal.querySelector('.cv-dialog').setAttribute('aria-hidden', 'true');
  cvModal.classList.remove('open');
  document.removeEventListener('keydown', cvEscListener);
}

function cvEscListener(e) { if (e.key === 'Escape') closeCVModal(); }

// Wire CV button and modal
if (cvBtn) {
  cvBtn.addEventListener('click', openCVModal);
}

if (cvModal) {
  const cvBackdrop = cvModal.querySelector('#cv-backdrop');
  const cvCloseBtn = cvModal.querySelector('#cv-close');
  if (cvBackdrop) cvBackdrop.addEventListener('click', closeCVModal);
  if (cvCloseBtn) cvCloseBtn.addEventListener('click', closeCVModal);
}
const USERNAME = 'moharifrifai'; // 🔥 GANTI

// Initialize dark mode from localStorage
function initDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️';
  }
}

// Toggle dark mode and save preference
themeToggleBtn.addEventListener('click', () => {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
});

let allRepos = [];
const selectedFilters = new Set();
// filter mode: 'any' (OR) or 'all' (AND)
let filterMode = localStorage.getItem('filterMode') || 'any';
// commits computation guard
let commitsComputationInProgress = false;
// performance metrics
let performanceMetrics = null;

// measure page load time and core web vitals
function measurePerformance() {
  if (!window.PerformanceObserver) return null;

  const metrics = {
    pageLoadTime: null,
    lcp: null, // Largest Contentful Paint
    fid: null, // First Input Delay (deprecated, use INP)
    inp: null, // Interaction to Next Paint
    cls: null  // Cumulative Layout Shift
  };

  // page load time
  if (window.performance && window.performance.timing) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    if (pageLoadTime > 0) metrics.pageLoadTime = pageLoadTime;
  }

  // observe LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.debug('LCP observer not supported', e);
  }

  // observe INP (Interaction to Next Paint)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const maxDuration = Math.max(...entries.map(e => e.duration));
      metrics.inp = Math.round(maxDuration);
    });
    inpObserver.observe({ entryTypes: ['event'] });
  } catch (e) {
    console.debug('INP observer not supported', e);
  }

  // observe CLS (Cumulative Layout Shift)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          metrics.cls = parseFloat(clsValue.toFixed(3));
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.debug('CLS observer not supported', e);
  }

  return metrics;
}

// get performance grade badge
function getPerformanceBadge(metrics) {
  if (!metrics || !metrics.pageLoadTime) return { grade: 'N/A', color: '#666' };

  const loadTimeMs = metrics.pageLoadTime;
  // very fast: < 1s, fast: 1-2s, good: 2-3s, slow: > 3s
  let grade, color;
  if (loadTimeMs < 1000) { grade = '⚡ Fast'; color = '#22c55e'; }
  else if (loadTimeMs < 2000) { grade = '✓ Good'; color = '#3b82f6'; }
  else if (loadTimeMs < 3000) { grade = '⚠ Fair'; color = '#f59e0b'; }
  else { grade = '✗ Slow'; color = '#ef4444'; }

  return { grade, color, time: `${loadTimeMs}ms` };
}

const filterBar = document.getElementById('filter-bar');

function renderFilterBar(repos) {
  if (!filterBar) return;
  filterBar.innerHTML = '';

  const techSet = new Set();
  repos.forEach(r => {
    if (r.language) techSet.add(normalizeTech(r.language));
    if (Array.isArray(r.topics)) r.topics.forEach(t => techSet.add(normalizeTech(t)));
  });

  const techs = [...techSet].filter(Boolean).sort();

  techs.forEach(t => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-chip';
    chip.textContent = t;
    chip.addEventListener('click', () => {
      if (selectedFilters.has(t)) selectedFilters.delete(t);
      else selectedFilters.add(t);
      updateFilterChips();
      applyFilters();
    });
    filterBar.appendChild(chip);
  });

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'filter-clear';
  clear.textContent = 'Clear';
  clear.addEventListener('click', () => {
    selectedFilters.clear();
    updateFilterChips();
    applyFilters();
  });
  filterBar.appendChild(clear);

  const modeBtn = document.createElement('button');
  modeBtn.type = 'button';
  modeBtn.className = 'filter-mode';
  modeBtn.textContent = filterMode === 'all' ? 'Match: All' : 'Match: Any';
  modeBtn.title = 'Toggle filter match mode (Any = OR, All = AND)';
  modeBtn.addEventListener('click', () => {
    filterMode = filterMode === 'any' ? 'all' : 'any';
    localStorage.setItem('filterMode', filterMode);
    modeBtn.textContent = filterMode === 'all' ? 'Match: All' : 'Match: Any';
    applyFilters();
  });
  filterBar.appendChild(modeBtn);
}

async function fetchRepos() {
  showLoading();
  try {
    const res = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?sort=updated`,
      {
        headers: {
          Accept: 'application/vnd.github+json'
        }
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const repos = await res.json();

    const filtered = repos.filter(repo =>
      !repo.fork &&
      repo.name !== `${USERNAME}.github.io`
    );

    allRepos = filtered;
    renderFilterBar(allRepos);
    renderRepos(allRepos);
    renderStats(allRepos);
    hideStatus();
  } catch (err) {
    console.error('fetchRepos error:', err);
    showError('Unable to load repositories. ' + (err.message || ''));
  }
}

function updateFilterChips() {
  if (!filterBar) return;
  const chips = filterBar.querySelectorAll('.filter-chip');
  chips.forEach(c => {
    if (selectedFilters.has(c.textContent)) c.classList.add('active');
    else c.classList.remove('active');
  });
}

function applyFilters() {
  if (selectedFilters.size === 0) {
    renderRepos(allRepos);
    renderStats(allRepos);
    return;
  }

  let filtered;
  if (filterMode === 'any') {
    // OR semantics: include repo if it has any selected tech
    filtered = allRepos.filter(r => {
      const techs = new Set();
      if (r.language) techs.add(normalizeTech(r.language));
      if (Array.isArray(r.topics)) r.topics.forEach(t => techs.add(normalizeTech(t)));
      for (const f of selectedFilters) if (techs.has(f)) return true;
      return false;
    });
  } else {
    // AND semantics: include repo only if it has all selected techs
    filtered = allRepos.filter(r => {
      const techs = new Set();
      if (r.language) techs.add(normalizeTech(r.language));
      if (Array.isArray(r.topics)) r.topics.forEach(t => techs.add(normalizeTech(t)));
      for (const f of selectedFilters) {
        if (!techs.has(f)) return false;
      }
      return true;
    });
  }

  renderRepos(filtered);
  renderStats(filtered);
}

function showLoading(message = 'Loading projects...') {
  statusEl.className = 'status loading';
  statusEl.textContent = message;
}

function hideStatus() {
  statusEl.className = '';
  statusEl.textContent = '';
}

function showError(message) {
  statusEl.className = 'status error';
  statusEl.innerHTML = '';
  const msg = document.createElement('div');
  msg.className = 'error-msg';
  msg.textContent = message;
  const retry = document.createElement('button');
  retry.className = 'retry-btn';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => {
    hideStatus();
    fetchRepos();
  });
  statusEl.appendChild(msg);
  statusEl.appendChild(retry);
}

// Render statistics header: total repos, top languages, top topics
function renderStats(repos) {
  if (!Array.isArray(repos)) return;

  const total = repos.length;

  // total stars
  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

  const langCounts = {};
  const topicCounts = {};

  repos.forEach(r => {
    if (r.language) {
      const k = normalizeTech(r.language);
      langCounts[k] = (langCounts[k] || 0) + 1;
    }
    if (Array.isArray(r.topics)) {
      r.topics.forEach(t => {
        const k = normalizeTech(t);
        topicCounts[k] = (topicCounts[k] || 0) + 1;
      });
    }
  });

  const sortAndTake = (obj, n = 5) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);

  const topLangs = sortAndTake(langCounts, 5);
  const topTopics = sortAndTake(topicCounts, 8);

  const langsHTML = topLangs.length
    ? topLangs.map(([k, c]) => `<span class="badge">${k} (${c})</span>`).join('')
    : '<span class="muted">None</span>';

  const topicsHTML = topTopics.length
    ? topTopics.map(([k, c]) => `<span class="badge">${k} (${c})</span>`).join('')
    : '<span class="muted">None</span>';

  // performance badge for portfolio site
  const perf = performanceMetrics || measurePerformance();
  const perfBadge = getPerformanceBadge(perf);

  // commits UI (auto-run but capped to avoid rate limits)
  const MAX_COMMIT_REPOS = 30;

  statsEl.innerHTML = `
    <div class="stat-row">
      <div class="stat-item">
        <div class="stat-title">Total Projects</div>
        <div class="stat-value">${total}</div>
      </div>

      <div class="stat-item">
        <div class="stat-title">Total Stars</div>
        <div class="stat-value">${totalStars}</div>
      </div>

      <div class="stat-item">
        <div class="stat-title">Commits This Year</div>
        <div class="stat-value" id="commits-value">—</div>
        <div id="commits-progress" class="commits-progress" aria-hidden="true"></div>
      </div>

      <div class="stat-item">
        <div class="stat-title">Portfolio Performance</div>
        <div class="stat-row-inline">
          <div class="stat-badges"><span class="badge" style="background: ${perfBadge.color}; color: white;">${perfBadge.grade}</span></div>
          <div class="stat-note">${perf && perf.pageLoadTime ? `Load: ${perf.pageLoadTime}ms` : 'Measuring...'}</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-title">Top Languages</div>
        <div class="stat-badges">${langsHTML}</div>
      </div>
    </div>
  `;

  // auto-trigger commits computation (but avoid overlapping runs)
  const commitsValue = statsEl.querySelector('#commits-value');
  const progressEl = statsEl.querySelector('#commits-progress');

  if (commitsComputationInProgress) return;

  if (repos.length === 0) {
    if (commitsValue) commitsValue.textContent = '0';
    return;
  }

  commitsComputationInProgress = true;
  const reposToCount = repos.slice(0, MAX_COMMIT_REPOS);
  if (progressEl) {
    progressEl.setAttribute('aria-hidden', 'false');
    progressEl.textContent = `Counting commits for ${reposToCount.length} repos...`;
  }
  if (commitsValue) commitsValue.textContent = 'Counting...';

  computeCommitsThisYear(reposToCount, (done, total, currentRepo) => {
    if (progressEl) progressEl.textContent = `Counting: ${done}/${total} — ${currentRepo}`;
  }).then(totalCommits => {
    if (commitsValue) commitsValue.textContent = totalCommits;
    if (progressEl) progressEl.textContent = '';
  }).catch(err => {
    console.error('compute commits error', err);
    if (progressEl) progressEl.textContent = 'Error computing commits';
    if (commitsValue) commitsValue.textContent = '—';
  }).finally(() => {
    commitsComputationInProgress = false;
    setTimeout(() => {
      if (progressEl) progressEl.setAttribute('aria-hidden', 'true');
    }, 3000);
  });
}

// Compute commits since start of current year for an array of repos.
// repos: array of repo objects
// onProgress(done, total, currentRepoName)
async function computeCommitsThisYear(repos, onProgress) {
  const since = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const concurrency = 4;
  let index = 0;
  let done = 0;
  let totalCommits = 0;

  const workers = new Array(concurrency).fill(null).map(async () => {
    while (index < repos.length) {
      const i = index++;
      const repo = repos[i];
      const owner = (repo.owner && repo.owner.login) || USERNAME;
      const repoName = repo.name;
      const currentLabel = `${owner}/${repoName}`;

      try {
        const url = `https://api.github.com/repos/${owner}/${repoName}/commits?since=${encodeURIComponent(since)}&per_page=1`;
        const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
        if (!res.ok) {
          // if rate limited, throw to stop
          throw new Error(`GitHub API ${res.status} ${res.statusText}`);
        }

        const link = res.headers.get('link');
        let count = 0;
        if (link) {
          // parse last page from Link header
          const m = link.match(/&?page=(\d+)>; rel="last"/);
          if (m && m[1]) count = parseInt(m[1], 10);
          else count = 1; // fallback
        } else {
          const arr = await res.json();
          count = Array.isArray(arr) ? arr.length : 0;
        }

        totalCommits += count;
      } catch (err) {
        // bubble up the error to abort the whole operation
        throw err;
      } finally {
        done += 1;
        if (typeof onProgress === 'function') onProgress(done, repos.length, currentLabel);
      }
    }
  });

  await Promise.all(workers);
  return totalCommits;
}

function renderRepos(repos) {
  projectsEl.innerHTML = '';

  repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'card';

    const liveDemo =
      repo.homepage ||
      `https://${USERNAME}.github.io/${repo.name}/`;

    const previewImage =
      `https://raw.githubusercontent.com/${USERNAME}/${repo.name}/main/preview.png`;

    const techs = new Set();

    if (repo.language) techs.add(normalizeTech(repo.language));
    if (repo.topics) repo.topics.forEach(t => techs.add(normalizeTech(t)));

    const badgesHTML = [...techs]
      .filter(Boolean)
      .slice(0, 6)
      .map(t => `<span class="badge">${t}</span>`)
      .join('');

    card.innerHTML = `
      <img
        src="${previewImage}"
        class="preview"
        onerror="this.src='placeholder.png'"
      />

      <div class="card-body">
        <h3>${repo.name}</h3>
        <p>${repo.description || 'No description provided.'}</p>

        <div class="badges">
          ${badgesHTML}
        </div>

        <div class="links">
          <a href="${repo.html_url}" target="_blank">GitHub</a>
          <a href="${liveDemo}" target="_blank" class="secondary">Live Demo</a>
          <button type="button" class="preview-btn">Preview</button>
        </div>
        <div class="iframe-wrap" aria-hidden="true"></div>
      </div>
    `;

    // attach preview toggle behavior (opens modal)

    const previewBtn = card.querySelector('.preview-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => openPreviewModal(liveDemo));
    }

    // finally append the card to the container
    projectsEl.appendChild(card);
  });
}

function normalizeTech(name) {
  if (!name) return null;

  const map = {
    javascript: 'JavaScript',
    html: 'HTML',
    css: 'CSS',
    react: 'React',
    vue: 'Vue',
    node: 'Node.js',
    api: 'API',
    leaflet: 'Leaflet',
    chartjs: 'Chart.js',
    dotnet: '.NET',
    csharp: 'C#'
  };

  const key = name.toLowerCase();
  return map[key] || name;
}

initDarkMode();
fetchRepos();

// measure performance after page fully loads
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMetrics = measurePerformance();
    // re-render stats to show measured performance
    renderStats(selectedFilters.size === 0 ? allRepos : applyFilters());
  }, 100);
});
