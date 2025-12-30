# Copilot Instructions for moharifrifai.github.io

## Project Overview
This is a personal portfolio/project showcase website that dynamically fetches and displays GitHub repositories. It's a GitHub Pages site using vanilla JavaScript, HTML, and CSS with **zero external dependencies**.

**Key Architecture:**
- `index.html`: Minimal semantic structure with single `#projects` container for dynamic content
- `app.js`: GitHub API client that fetches, filters, and renders repositories
- `style.css`: Responsive grid layout (mobile-first approach)

## Data Flow
1. Page loads → `fetchRepos()` executes automatically (no event listeners required)
2. Fetches user repos from GitHub API (`/users/${USERNAME}/repos?sort=updated`)
3. Filters out forks and the portfolio site itself
4. Normalizes tech tags → renders project cards with badges

## Critical Customization Points
When someone forks or adapts this code:
- **Line 2 in app.js**: `USERNAME = 'moharifrifai'` - **MUST change** to their GitHub username (marked with `// 🔥 GANTI`)
- Preview images source: `main/preview.png` from each repo (respects GitHub-expected naming)
- Live demo fallback: auto-generates `github.io/{repo-name}/` if no homepage set

## Code Patterns & Conventions

### Tech Tag Normalization
The `normalizeTech()` function maps raw GitHub language/topic names to display-friendly names. **Before adding repos:** check if new tech stacks need adding to the mapping object (lines 85-97 in app.js). Example:
```javascript
const map = {
  javascript: 'JavaScript',
  react: 'React',
  // Add new mappings here to match repo topics
};
```

### Error Handling
- Missing preview images: Falls back to `placeholder.png` via HTML `onerror` attribute
- No description: Renders fallback text "No description provided."
- Failed API calls: Currently silent (no error UI) - assumes GitHub API is available

### CSS Grid & Responsive Design
- Responsive grid: `repeat(auto-fill, minmax(260px, 1fr))` adapts card count based on viewport
- Mobile breakpoint: `@media (max-width: 600px)` adjusts hero title size only
- Font: Google Fonts 'Inter' (fallback: system sans-serif)

## GitHub API Integration
- **Endpoint**: `https://api.github.com/users/{username}/repos?sort=updated`
- **Headers**: Include `Accept: 'application/vnd.github+json'` for proper response format
- **Rate limit**: Unauthenticated requests = 60/hour per IP (adequate for client-side portfolio)
- **Data filtering**: 
  - Excludes: `repo.fork === true` AND `repo.name === '{username}.github.io'`
  - Includes: Only repo name, description, language, topics, homepage, html_url

## Development & Deployment
- No build process or local server required
- CSS has duplicate rule block (lines 1-5 repeated at end) - safe to remove, no functional impact
- GitHub Pages auto-deploys on commit to default branch
- All paths are relative or absolute URLs (no bundling needed)

## Common Tasks
**Add new repository to showcase**: Ensure repo has:
1. `description` field (or fallback text displays)
2. `topics` field with relevant tech tags (auto-normalizes)
3. `preview.png` in repo root, branch `main`
4. Optional `homepage` field (else uses `/repo-name/` as live demo link)

**Customize styling**: All colors use Tailwind-like hex values (`#2563eb`, `#3b82f6`, etc.). Card shadows and border-radius are consistent across the design.
