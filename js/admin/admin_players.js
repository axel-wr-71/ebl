import { renderPlayerProfile } from './admin_player_profile.js';

export async function renderAdminPlayers() {
    const container = document.getElementById('admin-players-table-container');
    if (!container) return;

    const { data: leagues } = await supabase
        .from('leagues')
        .select('country_name, league_name')
        .order('country_name', { ascending: true });

    window.allLeaguesData = leagues;

    container.innerHTML = `
        <div id="admin-main-view">
            <div class="admin-filters-card">
                <h4>Wyszukiwarka Zawodników</h4>
                <div class="filter-row">
                    <select id="filter-country" onchange="updateLeagueFilter(this.value)">
                        <option value="">Kraj...</option>
                        ${[...new Set(leagues.map(l => l.country_name))].map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                    <select id="filter-league"><option value="">Liga...</option></select>
                    <button class="btn" onclick="searchPlayers()">SZUKAJ</button>
                </div>
            </div>
            <div id="search-results-container"></div>
        </div>
        <div id="player-profile-view" style="display:none;"></div>
    `;
}

window.searchPlayers = async () => {
    const resultsContainer = document.getElementById('search-results-container');
    const country = document.getElementById('filter-country').value;
    const league = document.getElementById('filter-league').value;

    let query = supabase.from('players').select(`*, teams (team_name, league_name)`);
    if (country) query = query.eq('country', country);

    const { data: players } = await query;
    let filtered = league ? players.filter(p => p.teams?.league_name === league) : players;

    resultsContainer.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ZAWODNIK</th>
                    <th>KLUB</th>
                    <th class="txt-center">WIEK</th>
                    <th class="txt-center">POZ</th>
                    <th class="txt-center">JS</th><th class="txt-center">JR</th>
                    <th class="txt-center">OD</th><th class="txt-center">PA</th>
                    <th class="txt-center">AKCJA</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(p => `
                    <tr>
                        <td><strong>${p.first_name} ${p.last_name}</strong></td>
                        <td style="font-size: 0.85em;">${p.teams?.team_name || 'Wolny Agent'}</td>
                        <td class="txt-center">${p.age}</td>
                        <td class="txt-center" style="color: #f58426; font-weight: bold;">${p.position}</td>
                        <td class="txt-center">${p.jump_shot}</td>
                        <td class="txt-center">${p.jump_range}</td>
                        <td class="txt-center">${p.outside_defense}</td>
                        <td class="txt-center">${p.passing}</td>
                        <td class="txt-center">
                            <button class="btn-sm" onclick='showDetails(${JSON.stringify(p)})'>PROFIL</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
};

window.showDetails = (p) => renderPlayerProfile(p);
window.hidePlayerProfile = () => {
    document.getElementById('player-profile-view').style.display = 'none';
    document.getElementById('admin-main-view').style.display = 'block';
};
