// Загрузка избранных фильмов из localStorage
function loadFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
  }
  
  // Сохранение избранных фильмов в localStorage
  function saveFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
  
  // Удаление фильма из избранного
  function removeFromFavorites(id) {
    let favorites = loadFavorites();
    favorites = favorites.filter(movieId => movieId !== id);
    saveFavorites(favorites);
    showFavorites(favoritesPage);
    closeModal(); // Закрыть модальное окно после удаления фильма
  }
  
  // Получение класса по рейтингу фильма
  function getClassByRate(vote) {
    if (vote >= 7) {
      return "green";
    } else if (vote > 5) {
      return "orange";
    } else {
      return "red";
    }
  }
  
  let favoritesPage = 1;
  const moviesPerPage = 12;
  
  // Функция для отображения избранных фильмов
  function showFavorites(page = 1) {
    const moviesEl = document.querySelector(".movies");
    const favorites = loadFavorites();
    const totalPages = Math.ceil(favorites.length / moviesPerPage);
    moviesEl.innerHTML = "";
  
    // Обновляем состояние пагинации
    updatePaginationButtons(totalPages);
  
    if (favorites.length === 0) {
      moviesEl.innerHTML = `<p class="no-favorites-message">Нет добавленных фильмов</p>`;
      document.querySelector('.pagination').classList.add('hidden');
    } else {
      document.querySelector('.pagination').classList.remove('hidden');
      
      // Ограничиваем текущую страницу, если она превышает доступное количество страниц
      if (page > totalPages) {
        favoritesPage = totalPages;
      }
  
      const startIndex = (favoritesPage - 1) * moviesPerPage;
      const endIndex = startIndex + moviesPerPage;
      const moviesToShow = favorites.slice(startIndex, endIndex);
  
      moviesToShow.forEach(async (movieId) => {
        const movieDetails = await fetchMovieDetails(movieId);
        if (movieDetails) {
          const movieEl = document.createElement("div");
          movieEl.classList.add("movie");
          movieEl.innerHTML = `
            <div class="movie__cover-inner">
              <img
                src="${movieDetails.posterUrlPreview}"
                class="movie__cover"
                alt="${movieDetails.nameRu}"
              />
              <div class="movie__cover--darkened"></div>
            </div>
            <div class="movie__info">
              <div class="movie__title">${movieDetails.nameRu}</div>
              <div class="movie__category">${movieDetails.genres.map(genre => genre.genre).join(', ')}</div>
              ${movieDetails.rating ? `<div class="movie__average movie__average--${getClassByRate(movieDetails.rating)}">${movieDetails.rating}</div>` : ''}
            </div>
          `;
          movieEl.addEventListener("click", () => openModal(movieDetails.kinopoiskId));
          moviesEl.appendChild(movieEl);
        }
      });
  
      document.querySelector('.pagination__info').textContent = `Страница ${favoritesPage} из ${totalPages}`;
    }
  }
  
  // Функция для обновления видимости кнопок пагинации
  function updatePaginationButtons(totalPages) {
    const paginationEl = document.querySelector('.pagination');
    if (totalPages <= 1) {
      paginationEl.classList.add('hidden');
    } else {
      paginationEl.classList.remove('hidden');
    }
  }
  
  // Функция для получения информации о фильме по ID
  async function fetchMovieDetails(id) {
    const API_KEY = "8c8e1a50-6322-4135-8875-5d40a5420d86";
    const API_URL_MOVIE_DETAILS = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`;
    const resp = await fetch(API_URL_MOVIE_DETAILS, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
    });
    const respData = await resp.json();
    return respData;
  }
  
  // Функция для открытия модального окна
  async function openModal(id) {
    const movieDetails = await fetchMovieDetails(id);
    if (!movieDetails) return;
  
    const modalEl = document.querySelector(".modal");
    modalEl.classList.add("modal--show");
    document.body.classList.add("stop-scrolling");
  
    modalEl.innerHTML = `
      <div class="modal__card">
        <img class="modal__movie-backdrop" src="${movieDetails.posterUrl}" alt="">
        <h2>
          <span class="modal__movie-title">${movieDetails.nameRu}</span>
          <span class="modal__movie-release-year"> - ${movieDetails.year}</span>
        </h2>
        <ul class="modal__movie-info">
          <li class="modal__movie-genre">Жанр - ${movieDetails.genres.map(genre => `<span>${genre.genre}</span>`).join(', ')}</li>
          ${movieDetails.filmLength ? `<li class="modal__movie-runtime">Время - ${movieDetails.filmLength} минут</li>` : ''}
          <li>Сайт: <a class="modal__movie-site" href="${movieDetails.webUrl}">${movieDetails.webUrl}</a></li>
          <li class="modal__movie-overview">Описание - ${movieDetails.description}</li>
        </ul>
        <button type="button" class="favorite-btn" onclick="removeFromFavorites(${movieDetails.kinopoiskId})">Удалить из избранного</button>
        <button type="button" class="modal__button-close">Закрыть</button>
      </div>
    `;
  
    const btnClose = document.querySelector(".modal__button-close");
    btnClose.addEventListener("click", () => closeModal());
  }
  
  // Функция для закрытия модального окна
  function closeModal() {
    const modalEl = document.querySelector(".modal");
    modalEl.classList.remove("modal--show");
    document.body.classList.remove("stop-scrolling");
  }
  
  // Обработчики событий для закрытия модального окна
  window.addEventListener("click", (e) => {
    const modalEl = document.querySelector(".modal");
    if (e.target === modalEl) {
      closeModal();
    }
  });
  
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
  
  // Обработчики событий для кнопок пагинации
  document.querySelector('.pagination__next').addEventListener('click', () => {
    const favorites = loadFavorites();
    const totalPages = Math.ceil(favorites.length / moviesPerPage);
    if (favoritesPage < totalPages) {
      favoritesPage++;
      showFavorites(favoritesPage);
    }
  });
  
  document.querySelector('.pagination__prev').addEventListener('click', () => {
    if (favoritesPage > 1) {
      favoritesPage--;
      showFavorites(favoritesPage);
    }
  });
  
  // Инициализация страницы с избранными фильмами
  showFavorites(favoritesPage);
  