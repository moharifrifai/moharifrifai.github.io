const projectsEl = document.getElementById('projects');
const USERNAME = 'moharifrifai'; // 🔥 GANTI DENGAN USERNAME GITHUB KAMU

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=updated`
  );
  const repos = await res.json();

  const filtered = repos.filter(repo => !repo.fork);

  renderRepos(filtered);
}

function renderRepos(repos) {
  projectsEl.innerHTML = '';

  repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'card';

    const demoUrl = repo.homepage
      ? repo.homepage
      : `https://${USERNAME}.github.io/${repo.name}/`;

    card.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description || 'No description provided.'}</p>

      <div class="links">
        <a href="${repo.html_url}" target="_blank">GitHub</a>
        <a href="${demoUrl}" target="_blank" class="secondary">Live Demo</a>
      </div>
    `;

    projectsEl.appendChild(card);
  });
}

fetchRepos();
