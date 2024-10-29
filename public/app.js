require('dotenv').config();

// Securely access the API key
const API_KEY = process.env.API_KEY || 'default_key_if_not_provided';

const image_path = 'https://image.tmdb.org/t/p/w1280';
console.log("Your API key is:", API_KEY); // Test if it's working



const input = document.querySelector('.search input');
const btn = document.querySelector('.search button');
const main_grid_title = document.querySelector('.favorites h1');
const main_grid = document.querySelector('.favorites .movies-grid');

const trending_el = document.querySelector('.trending .movies-grid');
const popular_movies_el = document.querySelector('.popular-movies .movies-grid');
const popular_series_el = document.querySelector('.popular-series .movies-grid');
const top_rated_movies_el = document.querySelector('.top-rated-movies .movies-grid');
const top_rated_series_el = document.querySelector('.top-rated-series .movies-grid');

const popup_container = document.querySelector('.popup-container');

// Add click effect to card
function add_click_effect_to_card(cards) {
    cards.forEach(card => {
        card.addEventListener('click', () => show_popup(card));
    });
}

// SEARCH MOVIES
async function get_movie_by_search(search_term) {
    const resp = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${search_term}`);
    const respData = await resp.json();
    return respData.results;
}

btn.addEventListener('click', add_searched_movies_to_dom);

async function add_searched_movies_to_dom() {
    const data = await get_movie_by_search(input.value);
    main_grid_title.innerText = `Search Results...`;
    main_grid.innerHTML = data.map(e => {
        return `
            <div class="card" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.title}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.release_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// POPUP
async function get_movie_by_id(id) {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
    const respData = await resp.json();
    return respData;
}

async function get_series_by_id(id) {
    const resp = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`);
    const respData = await resp.json();
    return respData;
}

async function get_movie_trailer(id) {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`);
    const respData = await resp.json();
    return respData.results[0]?.key; // Check if the trailer exists
}

async function get_series_trailer(id) {
    const resp = await fetch(`https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}`);
    const respData = await resp.json();
    return respData.results[0]?.key; // Check if the trailer exists
}

async function get_cast_by_id(id) {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`);
    const respData = await resp.json();
    return respData.cast.slice(0, 5); // Get only the first 5 cast members
}

async function get_series_cast_by_id(id) {
    const resp = await fetch(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${API_KEY}`);
    const respData = await resp.json();
    return respData.cast.slice(0, 5); // Get only the first 5 cast members
}


async function show_popup(card) {
    popup_container.classList.add('show-popup');

    const movie_id = card.getAttribute('data-id');
    const isMovie = card.classList.contains('movie');
    const movie = isMovie ? await get_movie_by_id(movie_id) : await get_series_by_id(movie_id);
    const movie_trailer = isMovie ? await get_movie_trailer(movie_id) : await get_series_trailer(movie_id);
    
    // Fetch cast members
    const cast = isMovie ? await get_cast_by_id(movie_id) : await get_series_cast_by_id(movie_id);
    
    popup_container.style.background = `linear-gradient(rgba(0, 0, 0, .8), rgba(0, 0, 0, 1)), url(${image_path + movie.poster_path})`;

    popup_container.innerHTML = `
        <span class="x-icon">&#10006;</span>
        <div class="content">
            <div class="left">
                <div class="poster-img">
                    <img src="${image_path + movie.poster_path}" alt="">
                </div>
                <div class="single-info">
                    <span>Add to favorites:</span>
                    <span class="heart-icon">&#9829;</span>
                </div>
            </div>
            <div class="right">
                <h1>${movie.title || movie.name}</h1>
                <h3>${movie.tagline || ''}</h3>
                <div class="single-info-container">
                    <div class="single-info">
                        <span>Language:</span>
                        <span>${(movie.spoken_languages && movie.spoken_languages[0]?.name) || (movie.original_language)}</span>
                    </div>
                    <div class="single-info">
                        <span>Length:</span>
                        <span>${movie.runtime || movie.episode_run_time[0]} minutes</span>
                    </div>
                    <div class="single-info">
                        <span>Rate:</span>
                        <span>${movie.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Budget:</span>
                        <span>$ ${movie.budget || 'N/A'}</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date:</span>
                        <span>${movie.release_date || movie.first_air_date}</span>
                    </div>
                </div>
                <div class="genres">
                    <h2>Genres</h2>
                    <ul>
                        ${(movie.genres || []).map(e => `<li>${e.name}</li>`).join('')}
                    </ul>
                </div>
                <div class="overview">
                    <h2>Overview</h2>
                    <p>${movie.overview}</p>
                </div>
                <div class="trailer">
                    <h2>Trailer</h2>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/${movie_trailer}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="cast">
                    <h2>Cast</h2>
                    <div class="cast-images">
                        ${cast.map(member => `
                            <div class="cast-member">
                                <img src="${image_path + member.profile_path}" alt="${member.name}">
                                <span>${member.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    const x_icon = document.querySelector('.x-icon');
    x_icon.addEventListener('click', () => popup_container.classList.remove('show-popup'));

    const heart_icon = popup_container.querySelector('.heart-icon');
    const movie_ids = get_LS();
    for (let i = 0; i <= movie_ids.length; i++) {
        if (movie_ids[i] == movie_id) heart_icon.classList.add('change-color');
    }

    heart_icon.addEventListener('click', () => {
        if (heart_icon.classList.contains('change-color')) {
            remove_LS(movie_id);
            heart_icon.classList.remove('change-color');
        } else {
            add_to_LS(movie_id);
            heart_icon.classList.add('change-color');
        }
        fetch_favorite_movies();
    });
}

// Local Storage
function get_LS() {
    const movie_ids = JSON.parse(localStorage.getItem('movie-id'));
    return movie_ids === null ? [] : movie_ids;
}

function add_to_LS(id) {
    const movie_ids = get_LS();
    localStorage.setItem('movie-id', JSON.stringify([...movie_ids, id]));
}

function remove_LS(id) {
    const movie_ids = get_LS();
    localStorage.setItem('movie-id', JSON.stringify(movie_ids.filter(e => e !== id)));
}

// Favorite Movies
fetch_favorite_movies();

async function fetch_favorite_movies() {
    main_grid.innerHTML = '';

    const movies_LS = await get_LS();
    const movies = [];
    for (let i = 0; i <= movies_LS.length - 1; i++) {
        const movie = await get_movie_by_id(movies_LS[i]);
        movies.push(movie);
    }
    
    main_grid_title.innerText = `Your Favorites`;
    main_grid.innerHTML = movies.map(e => {
        return `
            <div class="card movie" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.title}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.release_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// Fetch and display trending movies
async function fetch_trending_movies() {
    const resp = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
    const respData = await resp.json();
    const movies = respData.results;
    trending_el.innerHTML = movies.map(e => {
        return `
            <div class="card movie" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.title}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.release_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// Fetch and display popular movies
async function fetch_popular_movies() {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
    const respData = await resp.json();
    const movies = respData.results;
    popular_movies_el.innerHTML = movies.map(e => {
        return `
            <div class="card movie" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.title}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.release_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// Fetch and display popular series
async function fetch_popular_series() {
    const resp = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`);
    const respData = await resp.json();
    const series = respData.results;
    popular_series_el.innerHTML = series.map(e => {
        return `
            <div class="card series" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.name}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.first_air_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// Fetch and display top-rated movies
async function fetch_top_rated_movies() {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`);
    const respData = await resp.json();
    const movies = respData.results;
    top_rated_movies_el.innerHTML = movies.map(e => {
        return `
            <div class="card movie" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.title}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.release_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// Fetch and display top-rated series
async function fetch_top_rated_series() {
    const resp = await fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`);
    const respData = await resp.json();
    const series = respData.results;
    top_rated_series_el.innerHTML = series.map(e => {
        return `
            <div class="card series" data-id="${e.id}">
                <div class="img">
                    <img src="${image_path + e.poster_path}">
                </div>
                <div class="info">
                    <h2>${e.name}</h2>
                    <div class="single-info">
                        <span>Rate: </span>
                        <span>${e.vote_average} / 10</span>
                    </div>
                    <div class="single-info">
                        <span>Release Date: </span>
                        <span>${e.first_air_date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    const cards = document.querySelectorAll('.card');
    add_click_effect_to_card(cards);
}

// Call functions to fetch data on load
fetch_trending_movies();
fetch_popular_movies();
fetch_popular_series();
fetch_top_rated_movies();
fetch_top_rated_series();
