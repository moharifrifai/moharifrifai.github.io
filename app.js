const projectsEl = document.getElementById('projects');
const USERNAME = 'moharifrifai'; // 🔥 GANTI

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=updated`,
    {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    }
  );

  const repos = await res.json();

  const filtered = repos.filter(repo =>
    !repo.fork &&
    repo.name !== `${USERNAME}.github.io`
  );

  renderRepos(filtered);
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
        </div>
      </div>
    `;

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

fetchRepos();
