const API_BASE = "https://animeapi.skin";
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;

    const selectors = {
      trending: document.getElementById('trending-list'),
      searchList: document.getElementById('search-list'),
      animeList: document.getElementById('anime-list'),
      episodes: document.getElementById('episodes-container'),
      spinner: document.getElementById('loading-spinner'),
      searchInput: document.querySelector('.search'),
    };

    async function fetchJSON(endpoint, useProxyIfFail = true) {
      try {
        const res = await fetch(endpoint, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return normalize(json);
      } catch (err) {
        console.warn('Direct fetch failed for', endpoint, err.message);
        if (useProxyIfFail) {
          try {
            const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(endpoint);
            const res2 = await fetch(proxy);
            if (!res2.ok) throw new Error(`Proxy HTTP ${res2.status}`);
            const json2 = await res2.json();
            return normalize(json2);
          } catch (err2) {
            console.error('Proxy fetch also failed:', err2.message);
          }
        }
        throw err;
      }
    }

    function normalize(payload) {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.results)) return payload.results;
      if (Array.isArray(payload.anime)) return payload.anime;
      return [];
    }

    function clear(container) {
      container.innerHTML = '';
    }

    function showMessage(container, text) {
      container.innerHTML = `<div class="message">${text}</div>`;
    }

    function createAnimeCard(anime) {
      const card = document.createElement('div');
      card.className = 'anime-card';
      card.dataset.title = anime.title || anime.name || anime.title_en || '';

      const img = document.createElement('img');
      img.src = anime.image || anime.img || anime.thumbnail || anime.thumbnail_url || anime.poster || anime.coverImage || anime.image_url || 'https://via.placeholder.com/150x180/333/fff?text=No+Image';
      img.alt = anime.title || anime.name || 'anime';
      img.onerror = () => { img.src = 'https://via.placeholder.com/150x180/333/fff?text=No+Image'; };
      card.appendChild(img);

      const p = document.createElement('p');
      p.textContent = anime.title || anime.name || 'Untitled';
      card.appendChild(p);

      return card;
    }

    function updateFeaturedAnime(animeDetails) {
      const featuredImg = document.getElementById('featured-img');
      const featuredTitle = document.getElementById('featured-title');
      const featuredDescription = document.getElementById('featured-description');
      const featuredEpisodes = document.getElementById('featured-episodes');
      const featuredTags = document.getElementById('featured-tags');

      const animeImage = animeDetails.image || animeDetails.img || animeDetails.thumbnail || animeDetails.thumbnail_url || animeDetails.poster || animeDetails.coverImage || animeDetails.image_url || 'https://via.placeholder.com/280x350/333/fff?text=No+Image';
      featuredImg.src = animeImage;
      featuredImg.alt = animeDetails.title || animeDetails.name || 'Featured Anime';
      featuredImg.onerror = () => { featuredImg.src = 'https://via.placeholder.com/280x350/333/fff?text=No+Image'; };

      const animeTitle = animeDetails.title || animeDetails.name || animeDetails.title_english || animeDetails.title_romaji || 'Untitled Anime';
      featuredTitle.textContent = animeTitle;

      const animeDescription = animeDetails.description || animeDetails.synopsis || animeDetails.summary || animeDetails.plot || animeDetails.overview || `${animeTitle} - Complete anime series with episodes available for streaming. Watch now with subtitles and high definition quality.`;
      featuredDescription.textContent = animeDescription;

      let episodeText = '';
      const totalEps = animeDetails.episodes || animeDetails.totalEpisodes || animeDetails.episode_count || animeDetails.episodeCount;
      const duration = animeDetails.duration || animeDetails.episodeDuration || animeDetails.episode_duration || '24m';
      const status = animeDetails.status || animeDetails.airing_status || animeDetails.air_status;
      const year = animeDetails.year || animeDetails.releaseDate || animeDetails.aired?.from || animeDetails.release_date || '';

      if (totalEps) {
        episodeText = `EP ${totalEps}`;
      } else {
        episodeText = 'Episodes Available';
      }

      if (duration) {
        episodeText += ` · ${duration}`;
      }

      if (status) {
        episodeText += ` · ${status}`;
      }

      if (year) {
        const yearOnly = typeof year === 'string' ? year.substring(0, 4) : year.toString().substring(0, 4);
        episodeText += ` · ${yearOnly}`;
      }

      featuredEpisodes.textContent = episodeText;

      featuredTags.innerHTML = '';

      const subSpan = document.createElement('span');
      subSpan.textContent = 'SUB';
      featuredTags.appendChild(subSpan);

      const hdSpan = document.createElement('span');
      hdSpan.textContent = 'HD';
      featuredTags.appendChild(hdSpan);

      if (animeDetails.dub || animeDetails.hasDub || animeDetails.dubbed || animeDetails.dub_available) {
        const dubSpan = document.createElement('span');
        dubSpan.textContent = 'DUB';
        featuredTags.appendChild(dubSpan);
      }

      if (animeDetails.type || animeDetails.format || animeDetails.media_type) {
        const animeType = animeDetails.type || animeDetails.format || animeDetails.media_type;
        const typeSpan = document.createElement('span');
        typeSpan.textContent = animeType.toUpperCase();
        typeSpan.style.backgroundColor = '#444';
        typeSpan.style.color = '#00ff88';
        featuredTags.appendChild(typeSpan);
      }

      const genres = animeDetails.genres || animeDetails.genre || animeDetails.categories || [];
      if (Array.isArray(genres) && genres.length > 0) {
        genres.slice(0, 3).forEach(genre => {
          const genreSpan = document.createElement('span');
          const genreName = typeof genre === 'string' ? genre : (genre.name || genre.title || genre);
          genreSpan.textContent = genreName;
          genreSpan.style.backgroundColor = '#333';
          genreSpan.style.color = '#ffcc00';
          featuredTags.appendChild(genreSpan);
        });
      }

      if (animeDetails.rating || animeDetails.score || animeDetails.mal_score || animeDetails.imdb_rating) {
        const rating = animeDetails.rating || animeDetails.score || animeDetails.mal_score || animeDetails.imdb_rating;
        const ratingSpan = document.createElement('span');
        ratingSpan.textContent = `★${rating}`;
        ratingSpan.style.backgroundColor = '#ff6b35';
        ratingSpan.style.color = '#fff';
        featuredTags.appendChild(ratingSpan);
      }

      console.log('Featured section updated with:', {
        title: animeTitle,
        image: animeImage,
        description: animeDescription.substring(0, 100) + '...',
        episodes: totalEps,
        year: year
      });
    }

    async function getTrendingAnime() {
      return await fetchJSON(`${API_BASE}/trending`);
    }

    async function searchAnime(keyword, page = 1) {
      return await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(keyword)}&page=${page}`);
    }

    async function getAnimeByPage(page = 1) {
      return await fetchJSON(`${API_BASE}/new?page=${page}`);
    }

    async function getEpisodes(title) {
      return await fetchJSON(`${API_BASE}/episodes?title=${encodeURIComponent(title)}`);
    }

    async function getAnimeDetails(title) {
      return await fetchJSON(`${API_BASE}/info?title=${encodeURIComponent(title)}`);
    }

    async function loadEpisodes(title, fallbackAnimeData = null) {
      const container = selectors.episodes;

      try {
        showMessage(container, `Loading anime details for "${title}"...`);
        const animeDetails = await getAnimeDetails(title);

        if (animeDetails && (animeDetails.title || animeDetails.name)) {
          updateFeaturedAnime(animeDetails);
        } else if (fallbackAnimeData) {
          updateFeaturedAnime(fallbackAnimeData);
        }
      } catch (err) {
        console.warn('Failed to fetch anime details:', err);
        if (fallbackAnimeData) {
          updateFeaturedAnime(fallbackAnimeData);
        }
      }

      showMessage(container, `Loading episodes for "${title}"...`);
      try {
        const eps = await getEpisodes(title);
        clear(container);
        if (!eps.length) {
          showMessage(container, 'No episodes found.');
          return;
        }

        const episodesWrapper = document.createElement('div');
        episodesWrapper.className = 'episodes-wrapper';

        eps.forEach(ep => {
          const div = document.createElement('div');
          div.className = 'episode-card';

          const epImg = document.createElement('img');
          epImg.src = ep.image || ep.thumbnail || ep.thumbnail_url || ep.poster || 'https://via.placeholder.com/200x120/333/fff?text=Episode';
          epImg.alt = ep.title || ep.name || 'Episode';
          epImg.onerror = () => { epImg.src = 'https://via.placeholder.com/200x120/333/fff?text=Episode'; };

          const epInfo = document.createElement('div');
          epInfo.className = 'episode-info';
          epInfo.innerHTML = `
            <div class="episode-number">EP ${ep.number ?? ep.ep ?? ep.episode ?? '-'}</div>
            <div class="episode-title">${ep.title || ep.name || 'No title'}</div>
          `;

          div.appendChild(epImg);
          div.appendChild(epInfo);
          episodesWrapper.appendChild(div);
        });

        container.appendChild(episodesWrapper);
      } catch (err) {
        console.error('Episodes error:', err);
        showMessage(container, 'Failed to load episodes. Check console for details.');
      }
    }

    async function renderTrending() {
      const container = selectors.trending;
      showMessage(container, 'Loading trending anime...');
      try {
        const list = await getTrendingAnime();
        clear(container);
        if (!list.length) { showMessage(container, 'No trending anime found.'); return; }
        list.forEach(a => container.appendChild(createAnimeCard(a)));
      } catch (err) {
        console.error('Trending error:', err);
        showMessage(container, 'Failed to load trending. Check console for details.');
      }
    }

    async function doSearch(keyword) {
      const container = selectors.searchList;
      showMessage(container, `Searching for "${keyword}"...`);
      try {
        const list = await searchAnime(keyword);
        clear(container);
        if (!list.length) { showMessage(container, 'No results found.'); return; }
        list.forEach(a => container.appendChild(createAnimeCard(a)));
      } catch (err) {
        console.error('Search error:', err);
        showMessage(container, 'Search failed. Check console for details.');
      }
    }

    async function renderAnimeList(page = 1) {
      if (isLoading || !hasMore) return;
      isLoading = true;
      selectors.spinner.style.display = 'block';
      try {
        const list = await getAnimeByPage(page);
        if (!list.length) {
          hasMore = false;
          selectors.spinner.innerHTML = '<p>No more anime to load.</p>';
          return;
        }
        list.forEach(a => selectors.animeList.appendChild(createAnimeCard(a)));
      } catch (err) {
        console.error('All anime load error:', err);
        if (!document.querySelector('#anime-list .message')) {
          showMessage(selectors.animeList, 'Failed to load list. See console for error.');
        }
      } finally {
        selectors.spinner.style.display = hasMore ? 'none' : 'block';
        isLoading = false;
      }
    }

    document.addEventListener('click', (ev) => {
      const card = ev.target.closest('.anime-card');
      if (!card) return;
      const title = card.dataset.title;
      if (!title) return console.warn('Clicked card without title');

      const img = card.querySelector('img');
      const titleText = card.querySelector('p').textContent;

      const clickedAnimeData = {
        title: titleText,
        name: titleText,
        image: img.src.includes('placeholder') ? null : img.src,
        description: `Loading detailed information for ${titleText}. Please wait while we fetch the complete anime details including synopsis, episode count, release year, and more...`,
        type: 'Anime',
        status: 'Loading details...',
        year: 'Fetching...'
      };

      updateFeaturedAnime(clickedAnimeData);

      window.scrollTo({ top: 0, behavior: 'smooth' });

      loadEpisodes(title, clickedAnimeData);
    });

    selectors.searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (!q) return;
        doSearch(q);
      }
    });

    window.addEventListener('scroll', () => {
      const threshold = 150;
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - threshold)) {
        if (!isLoading && hasMore) {
          currentPage++;
          renderAnimeList(currentPage);
        }
      }
    });

    renderTrending();
    renderAnimeList(currentPage);