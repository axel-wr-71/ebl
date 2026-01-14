// js/admin.js

/**
 * Główna funkcja renderująca sekcję filtrów
 */
async function renderAdminPlayers() {
    const container = document.getElementById('admin-players-table-container');
    if (!container) return;

    const { data: leagues, error } = await supabase
        .from('leagues')
        .select('country_name, league_name')
        .order('country_name', { ascending: true });

    if (error) {
        console.error("Błąd pobierania lig:", error);
        return;
    }

    const uniqueCountries = [...new Set(leagues.map(l => l.country_name))];
    window.allLeaguesData = leagues;

    container.innerHTML = `
        <div class="admin-filters-card">
            <h4 style="margin-top:0;">Filtrowanie Bazy Zawodników</h4>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end;">
                
                <div>
                    <label class="admin-label">SEZON:</label>
                    <select id="filter-season" class="admin-input" style="min-width: 120px;">
                        <option value="">Wszystkie</option>
                        <option value="2026">2026</option>
                    </select>
                </div>

                <div>
                    <label class="admin-label">NARODOWOŚĆ:</label>
                    <select id="filter-country" class="admin-input" onchange="updateLeagueFilter(this.value)" style="min-width: 180px;">
                        <option value="">Wszystkie kraje</option>
                        ${uniqueCountries.map(c => `<option value="${c}">${getFlagEmoji(c)} ${c}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label class="admin-label">LIGA:</label>
                    <select id="filter-league" class="admin-input" style="min-width: 200px;">
                        <option value="">Wybierz kraj najpierw</option>
                    </select>
                </div>

                <button class="btn" onclick="searchPlayers()" style="width: auto; padding: 10px 30px;">
                    SZUKAJ
                </button>
            </div>
        </div>
        <div id="search-results-container">
            <div style="text-align: center; color: #6c757d; padding: 50px; border: 2px dashed #dee2e6; border-radius: 8px;">
                <p>Ustaw filtry i kliknij <strong>SZUKAJ</strong>.</p>
            </div>
        </div>
    `;
}

function updateLeagueFilter(selectedCountry) {
    const leagueSelect = document.getElementById('filter-league');
    if (!selectedCountry) {
        leagueSelect.innerHTML = '<option value="">Wybierz kraj najpierw</option>';
        return;
    }
    const filteredLeagues = window.allLeaguesData.filter(l => l.country_name === selectedCountry);
    leagueSelect.innerHTML = `
        <option value="">Wszystkie ligi (${selectedCountry})</option>
        ${filteredLeagues.map(l => `<option value="${l.league_name}">${l.league_name}</option>`).join('')}
    `;
}

async function searchPlayers() {
    const resultsContainer = document.getElementById('search-results-container');
    const country = document.getElementById('filter-country').value;
    const league = document.getElementById('filter-league').value;

    resultsContainer.innerHTML = "<div class='loading'>Wyszukiwanie...</div>";

    // POBIERAMY WSZYSTKIE KOLUMNY (*), aby sprawdzić co jest w środku
    let query = supabase
        .from('players')
        .select(`
            *,
            teams (
                team_name,
                country,
                league_name
            )
        `);

    if (country) {
        query = query.eq('country', country);
    }

    const { data: players, error } = await query;

    if (error) {
        resultsContainer.innerHTML = `<div style="color:red; padding:20px;">
            <strong>Błąd bazy:</strong> ${error.message}
        </div>`;
        return;
    }

    // Filtracja ligi po stronie klienta
    let filteredPlayers = players;
    if (league) {
        filteredPlayers = players.filter(p => p.teams && p.teams.league_name === league);
    }

    if (filteredPlayers.length === 0) {
        resultsContainer.innerHTML = "<p style='text-align:center; padding:20px;'>Brak wyników.</p>";
        return;
    }

    let html = `
        <div style="margin-bottom:10px;">Znaleziono: ${filteredPlayers.length}</div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Zawodnik</th>
                    <th>Wiek</th>
                    <th>Poz</th>
                    <th>Kraj</th>
                    <th>Klub</th>
                </tr>
            </thead>
            <tbody>
                ${filteredPlayers.map(p => {
                    const t = p.teams || {};
                    // Zabezpieczenie: jeśli first_name i last_name nie istnieją, szukamy kolumny 'name'
                    const displayName = (p.first_name && p.last_name) 
                        ? `${p.first_name} ${p.last_name}` 
                        : (p.name || "Nieznany zawodnik");

                    return `
                    <tr>
                        <td><strong>${displayName}</strong></td>
                        <td>${p.age || '-'}</td>
                        <td>${p.position || '-'}</td>
                        <td>${getFlagEmoji(p.country)} ${p.country || '-'}</td>
                        <td style="color: ${t.team_name ? 'black' : 'red'}">
                            ${t.team_name || 'WOLNY AGENT'}
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
    resultsContainer.innerHTML = html;
}

function getFlagEmoji(country) {
    const flags = {
        "Poland": "🇵🇱", "Spain": "🇪🇸", "France": "🇫🇷", "Italy": "🇮🇹", 
        "Germany": "🇩🇪", "Greece": "🇬🇷", "Turkey": "🇹🇷", "Serbia": "🇷🇸", 
        "Lithuania": "🇱🇹", "USA": "🇺🇸", "Polska": "🇵🇱"
    };
    return flags[country] || "🏳️";
}
