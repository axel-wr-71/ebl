// js/admin/admin_players.js

export async function renderAdminPlayers() {
    const container = document.getElementById('admin-players-table-container');
    if (!container) return;

    const { data: leagues } = await supabase
        .from('leagues')
        .select('country_name, league_name')
        .order('country_name', { ascending: true });

    const uniqueCountries = [...new Set(leagues.map(l => l.country_name))];
    window.allLeaguesData = leagues;

    container.innerHTML = `
        <div id="admin-main-view">
            <div class="admin-filters-card">
                <h4 style="margin-top:0;">Filtrowanie Bazy (ADMIN)</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
                    <div>
                        <label class="admin-label">NARODOWOŚĆ:</label>
                        <select id="filter-country" class="admin-input" onchange="updateLeagueFilter(this.value)">
                            <option value="">Wszystkie kraje</option>
                            ${uniqueCountries.map(c => `<option value="${c}">${getFlagEmoji(c)} ${c}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="admin-label">LIGA:</label>
                        <select id="filter-league" class="admin-input">
                            <option value="">Wybierz kraj najpierw</option>
                        </select>
                    </div>
                    <button class="btn" onclick="searchPlayers()" style="width: auto;">SZUKAJ</button>
                </div>
            </div>
            <div id="search-results-container"></div>
        </div>
        <div id="player-profile-view" style="display:none;"></div>
    `;
}

// Globalne funkcje pomocnicze przypisujemy do window, aby przyciski HTML (onclick) je widziały
window.updateLeagueFilter = (selectedCountry) => {
    const leagueSelect = document.getElementById('filter-league');
    const filtered = window.allLeaguesData.filter(l => l.country_name === selectedCountry);
    leagueSelect.innerHTML = `<option value="">Wszystkie ligi</option>` + 
        filtered.map(l => `<option value="${l.league_name}">${l.league_name}</option>`).join('');
};

window.searchPlayers = async () => {
    const resultsContainer = document.getElementById('search-results-container');
    const country = document.getElementById('filter-country').value;
    const league = document.getElementById('filter-league').value;

    resultsContainer.innerHTML = "<div class='loading'>Pobieranie...</div>";

    let query = supabase.from('players').select(`*, teams (team_name, league_name)`);
    if (country) query = query.eq('country', country);

    const { data: players } = await query;
    let filtered = league ? players.filter(p => p.teams?.league_name === league) : players;

    let html = `
        <table class="admin-table player-list-table">
            <thead>
                <tr>
                    <th style="text-align:left;">Zawodnik</th>
                    <th>Poz</th>
                    <th>JS</th><th>JR</th><th>OD</th><th>HA</th><th>DR</th><th>PA</th>
                    <th>IS</th><th>ID</th><th>RE</th><th>BL</th><th>ST</th><th>FT</th>
                    <th>Akcja</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(p => `
                    <tr>
                        <td style="text-align:left;"><strong>${p.first_name || ''} ${p.last_name || ''}</strong></td>
                        <td style="font-weight:bold; color: #00471b;">${p.position || '??'}</td>
                        ${[p.jump_shot, p.jump_range, p.outside_defense, p.handling, p.driving, p.passing, 
                           p.inside_shot, p.inside_defense, p.rebounding, p.shot_blocking, p.stamina, p.free_throw]
                           .map(val => `<td class="skill-cell">${val}</td>`).join('')}
                        <td><button class="btn show-btn" onclick='showPlayerProfile(${JSON.stringify(p)})'>POKAŻ</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    resultsContainer.innerHTML = html;
};

window.showPlayerProfile = (p) => {
    document.getElementById('admin-main-view').style.display = 'none';
    const profile = document.getElementById('player-profile-view');
    profile.style.display = 'block';
    profile.innerHTML = `
        <button class="btn" onclick="hidePlayerProfile()" style="width:auto; background:#666;">← POWRÓT</button>
        <div class="bb-profile-card" style="margin-top:20px; background:white; padding:20px; border-radius:8px; border:1px solid #ccc;">
            <h2>${getFlagEmoji(p.country)} ${p.first_name} ${p.last_name}</h2>
            <p>Pozycja: <strong>${p.position}</strong> | Wiek: ${p.age}</p>
            </div>
    `;
};

window.hidePlayerProfile = () => {
    document.getElementById('player-profile-view').style.display = 'none';
    document.getElementById('admin-main-view').style.display = 'block';
};

function getFlagEmoji(country) {
    const flags = { "Poland": "🇵🇱", "Spain": "🇪🇸", "France": "🇫🇷", "USA": "🇺🇸" };
    return flags[country] || "🏳️";
}
