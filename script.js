const API_BASE = "https://animeapi.skin";

async function getTrendingAnime() {
  const res = await fetch(`${API_BASE}/trending`);
  return res.json();
}

async function searchAnime(keyword, page = 1) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(keyword)}&page=${page}`);
  return res.json();
}

async function getEpisodes(title) {
  const res = await fetch(`${API_BASE}/episodes?title=${encodeURIComponent(title)}`);
  return res.json();
}

async function renderTrending() {
  const trending = await getTrendingAnime();
  const container = document.getElementById("trending-list");
  container.innerHTML = trending.map(anime => `
    <div class="anime-card" onclick="loadEpisodes('${anime.title}')">
      <img src="${anime.image}" alt="${anime.title}">
      <p>${anime.title}</p>
    </div>
  `).join("");
}

document.querySelector(".search").addEventListener("keyup", async (e) => {
  if (e.key === "Enter") {
    const keyword = e.target.value.trim();
    if (!keyword) return;

    const results = await searchAnime(keyword);
    const container = document.getElementById("search-list");
    container.innerHTML = results.map(anime => `
      <div class="anime-card" onclick="loadEpisodes('${anime.title}')">
        <img src="${anime.image}" alt="${anime.title}">
        <p>${anime.title}</p>
      </div>
    `).join("");
  }
});

async function loadEpisodes(title) {
  const eps = await getEpisodes(title);
  const container = document.getElementById("episodes-container");
  container.innerHTML = eps.map(ep => `
    <div>
      <p><strong>Episode ${ep.number}:</strong> ${ep.title}</p>
    </div>
  `).join("");
}

renderTrending();
