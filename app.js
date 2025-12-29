const projectsEl = document.getElementById('projects');
const USERNAME = 'moharifrifai'; // 🔥 GANTI

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=updated`
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

    const previewImage = `
https://raw.githubusercontent.com/${USERNAME}/${repo.name}/main/preview.png
`;

    card.innerHTML = `
      <img
        src="${previewImage}"
        class="preview"
        onerror="this.src='placeholder.png'"
      />

      <div class="card-body">
        <h3>${repo.name}</h3>
        <p>${repo.description || 'No description provided.'}</p>

        <div class="links">
          <a href="${repo.html_url}" target="_blank">GitHub</a>
          <a href="${liveDemo}" target="_blank" class="secondary">Live Demo</a>
        </div>
      </div>
    `;

    projectsEl.appendChild(card);
  });
}

fetchRepos();
