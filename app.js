const API_KEY = "8c8e1a50-6322-4135-8875-5d40a5420d86";
const API_URL_POPULAR = "https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS";
const API_URL_SEARCH = "https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=";
const API_URL_MOVIE_DETAILS = "https://kinopoiskapiunofficial.tech/api/v2.2/films/";

let currentPage = 1;
const totalPages = 20; // Задайте максимальное количество страниц, если известно

// Функция для обновления информации о текущей странице в пагинации
function updatePaginationInfo() {
  document.querySelector('.pagination__info').textContent = `Страница ${currentPage}`;
}

// Функция для получения фильмов с API
async function getMovies(url, page = 1) {
  const pageUrl = `${url}&page=${page}`;
  const resp = await fetch(pageUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    },
  });

  if (resp.ok) {
    const respData = await resp.json();
    showMovies(respData);
    updatePaginationInfo();
  } else {
    console.error("Ошибка при загрузке фильмов:", resp.status);
  }
}

// Функция для установки класса по рейтингу фильма
function getClassByRate(vote) {
  if (vote >= 7) {
    return "green";
  } else if (vote > 5) {
    return "orange";
  } else {
    return "red";
  }
}

// Функции для работы с избранными фильмами
function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorite(filmId) {
  const favorites = getFavorites();
  return favorites.includes(filmId);
}

function toggleFavorite(filmId, button) {
  let favorites = getFavorites();
  if (favorites.includes(filmId)) {
    favorites = favorites.filter(id => id !== filmId);
    button.textContent = "Добавить в избранное";
  } else {
    favorites.push(filmId);
    button.textContent = "Удалить из избранного";
  }
  saveFavorites(favorites);
}

// Функция для отображения фильмов на странице
function showMovies(data) {
  const moviesEl = document.querySelector(".movies");

  // Очищаем предыдущие фильмы
  moviesEl.innerHTML = "";

  if (!data || !data.films || data.films.length === 0) {
    moviesEl.innerHTML = "<p>Фильмы не найдены.</p>";
    return;
  }

  data.films.forEach((movie) => {
    const movieEl = document.createElement("div");
    movieEl.classList.add("movie");

    movieEl.innerHTML = `
      <div class="movie__cover-inner">
        <img
          src="${movie.posterUrlPreview}"
          class="movie__cover"
          alt="${movie.nameRu}"
        />
        <div class="movie__cover--darkened"></div>
      </div>
      <div class="movie__info">
        <div class="movie__title">${movie.nameRu}</div>
        <div class="movie__category">${movie.genres.map(
          (genre) => ` ${genre.genre}`
        )}</div>
        ${
          movie.rating &&
          `
        <div class="movie__average movie__average--${getClassByRate(
          movie.rating
        )}">${movie.rating}</div>
        `
        }
      </div>
    `;

    // Открытие модального окна при клике на фильм
    movieEl.addEventListener("click", () => openModal(movie.filmId));
    moviesEl.appendChild(movieEl);
  });
}

// Обработчик для формы поиска
const form = document.querySelector("form");
const search = document.querySelector(".header__search");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const apiSearchUrl = `${API_URL_SEARCH}${encodeURIComponent(search.value)}`;
  if (search.value.trim()) {
    getMovies(apiSearchUrl);
    search.value = "";
  }
});

// Modal
const modalEl = document.querySelector(".modal");

async function openModal(id) {
  const resp = await fetch(API_URL_MOVIE_DETAILS + id, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    },
  });
  const respData = await resp.json();

  const favoriteText = isFavorite(respData.kinopoiskId) ? "Удалить из избранного" : "Добавить в избранное";

  modalEl.classList.add("modal--show");
  document.body.classList.add("stop-scrolling");

  modalEl.innerHTML = `
    <div class="modal__card">
      <img class="modal__movie-backdrop" src="${respData.posterUrl}" alt="">
      <h2>
        <span class="modal__movie-title">${respData.nameRu}</span>
        <span class="modal__movie-release-year"> - ${respData.year}</span>
      </h2>
      <ul class="modal__movie-info">
        <li class="modal__movie-genre">Жанр - ${respData.genres.map((el) => `<span>${el.genre}</span>`).join(', ')}</li>
        ${respData.filmLength ? `<li class="modal__movie-runtime">Время - ${respData.filmLength} минут</li>` : ''}
        <li>Сайт: <a class="modal__movie-site" href="${respData.webUrl}" target="_blank">${respData.webUrl}</a></li>
        <li class="modal__movie-overview">Описание - ${respData.description}</li>
      </ul>
      <button class="favorite-btn">${favoriteText}</button>
      <button type="button" class="modal__button-close">Закрыть</button>
    </div>
  `;

  // Добавление обработчика для кнопки избранного в модальном окне
  modalEl.querySelector(".favorite-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(respData.kinopoiskId, e.target);
  });

  const btnClose = modalEl.querySelector(".modal__button-close");
  btnClose.addEventListener("click", () => closeModal());
}

function closeModal() {
  modalEl.classList.remove("modal--show");
  document.body.classList.remove("stop-scrolling");
}

window.addEventListener("click", (e) => {
  if (e.target === modalEl) {
    closeModal();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

// Pagination
document.querySelector('.pagination__next').addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    getMovies(API_URL_POPULAR, currentPage);
  }
});

document.querySelector('.pagination__prev').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    getMovies(API_URL_POPULAR, currentPage);
  }
});

// Инициализация первой страницы
document.addEventListener("DOMContentLoaded", () => {
  getMovies(API_URL_POPULAR, currentPage);
});
