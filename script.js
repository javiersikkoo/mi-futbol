// El Motor Dinámico y Autosuficiente de GoalHub
let matches = [];

const matchGrid = document.getElementById('match-grid');
const mainVideo = document.getElementById('main-video');
const currentMatchTitle = document.getElementById('current-match-title');
const scoreDisplay = document.getElementById('live-score');
const timeDisplay = document.getElementById('live-time');
const streamSelector = document.getElementById('stream-selector');
const cinemaContainer = document.getElementById('cinema-container');

// 1. Carga de datos desde el Host (Partidos del día)
async function initApp() {
    try {
        // Traemos los partidos del día automáticamente
        const response = await fetch('matches_today.json');
        const data = await response.json();

        // Filtramos las ligas que te importan y asignamos sus IDs específicos
        matches = data.leagues.flatMap(league => 
            league.matches.map(m => ({
                ...m,
                leagueName: league.name // Aseguramos que cada partido sepa a qué liga pertenece
            }))
        );

        renderAllLeagues();
    } catch (error) {
        console.error("Error cargando los partidos:", error);
        matchGrid.innerHTML = "<p>No se pudieron cargar los partidos.</p>";
    }
}

// 2. Renderiza todos los partidos en la cuadrícula
function renderAllLeagues() {
    matchGrid.innerHTML = '';
    
    const allFilter = document.getElementById('filter-all');
    const liveFilter = document.getElementById('filter-live');
    const favFilter = document.getElementById('filter-favorites');

    let matchesToShow = [];
    if (liveFilter.classList.contains('active')) {
        matchesToShow = matches.filter(m => m.isLive);
    } else if (favFilter.classList.contains('active')) {
        matchesToShow = matches.filter(m => m.isFavorite);
    } else {
        matchesToShow = matches;
    }

    // Agrupamos por liga para mantener el orden visual
    const groupedMatches = {};
    matchesToShow.forEach(match => {
        if (!groupedMatches[match.leagueName]) {
            groupedMatches[match.leagueName] = [];
        }
        groupedMatches[match.leagueName].push(match);
    });

    for (const leagueName in groupedMatches) {
        const leagueTitle = document.createElement('h3');
        leagueTitle.className = 'league-title';
        leagueTitle.textContent = leagueName;
        matchGrid.appendChild(leagueTitle);

        const matchesRow = document.createElement('div');
        matchesRow.className = 'matches-row';

        groupedMatches[leagueName].forEach(match => {
            const card = document.createElement('div');
            card.className = `match-card ${match.isFavorite ? 'is-favorite' : ''}`;
            card.innerHTML = `
                <span class="favorite-star">${match.isFavorite ? '★' : '☆'}</span>
                <p class="team-name">${match.homeTeam}</p>
                <p class="match-time">${match.score} | ${match.time}</p>
                <p class="team-name">${match.awayTeam}</p>
            `;
            
            card.onclick = () => selectMatch(match);
            matchesRow.appendChild(card);
        });

        matchGrid.appendChild(matchesRow);
    }
}

// 3. Seleccionar un partido y activar el Modo Cine
async function selectMatch(match) {
    currentMatchTitle.textContent = `${match.homeTeam} vs ${match.awayTeam}`;
    scoreDisplay.textContent = match.score;
    timeDisplay.textContent = match.time;
    
    // Cargamos las fuentes desde nuestro nuevo archivo de biblioteca (sources.json)
    streamSelector.innerHTML = '';
    const sourcesData = await fetch('sources.json').then(r => r.json());
    
    // Buscamos las fuentes disponibles para la liga de este partido
    const leagueSources = sourcesData[match.leagueName] || {};
    
    // Creamos las opciones en el selector
    Object.keys(leagueSources).forEach(family => {
        const option = document.createElement('option');
        option.value = family;
        option.textContent = family.charAt(0).toUpperCase() + family.slice(1); // Ej: "Fctv33"
        streamSelector.appendChild(option);
    });

    cinemaContainer.classList.add('active');
    updateVideoSource(match.id, Object.keys(leagueSources)[0]);
}

// 4. Cambiar la fuente del video usando nuestra Biblioteca de Fuentes
async function updateVideoSource(matchId, family) {
    const sourcesData = await fetch('sources.json').then(r => r.json());
    const leagueSources = sourcesData[match.leagueName] || {}; // Nota: Aquí usamos el nombre de la liga para encontrar las fuentes
    
    // Buscamos la URL específica combinando el ID del partido y la familia elegida
    // Usamos una estructura inteligente: "liga-partido" (ej: LaLiga-RealMadrid)
    const baseName = match.homeTeam.replace(' ', '-');
    const url = leagueSources[family].replace('league', baseName); // Ajuste dinámico de la URL

    // Si el nombre no encaja perfectamente, usamos una construcción más robusta:
    const finalUrl = `https://live-stream.com/${family}-${baseName}`;

    mainVideo.src = finalUrl;
    mainVideo.load();
    mainVideo.play().catch(e => console.log("Autoplay iniciado"));
}

// 5. Manejo de Filtros y Botones
document.getElementById('filter-all').onclick = () => renderAllLeagues(matches);
document.getElementById('filter-live').onclick = () => {
    const liveMatches = matches.filter(m => m.isLive);
    renderAllLeagues(liveMatches);
};
document.getElementById('filter-favorites').onclick = () => {
    const favMatches = matches.filter(m => m.isFavorite);
    renderAllLeagues(favMatches);
};

// Botón para cerrar el Modo Cine (X)
document.getElementById('btn-close-cinema').onclick = () => {
    cinemaContainer.classList.remove('active');
};

// Iniciar la aplicación al cargar la página
window.onload = initApp;
