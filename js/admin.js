// js/admin.js

/**
 * Widok bazy wszystkich zawodników dla Admina
 */
async function renderAdminPlayers() {
    const container = document.getElementById('admin-players-table-container');
    if (!container) return;

    container.innerHTML = "<div class='loading'>Ładowanie bazy danych zawodników...</div>";

    const { data: players, error } = await supabase
        .from('players')
        .select(`
            *,
            teams (
                team_name,
                country,
                league_name
            )
        `)
        .order('overall_rating', { ascending: false });

    if (error) {
        container.innerHTML = `<div class='error'>Błąd: ${error.message}</div>`;
        return;
    }

    let html = `
        <div class="admin-controls">
            <p>Łącznie zawodników w systemie: <strong>${players.length}</strong></p>
        </div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>OVR</th>
                    <th>Zawodnik</th>
                    <th>Wiek</th>
                    <th>Poz</th>
                    <th>Kraj</th>
                    <th>Liga</th>
                    <th>Klub</th>
                    <th>Potencjał</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(p => {
                    const teamInfo = p.teams || {};
                    return `
                    <tr>
                        <td class="ovr-badge">${p.overall_rating}</td>
                        <td><strong>${p.first_name} ${p.last_name}</strong></td>
                        <td>${p.age}</td>
                        <td>${p.position}</td>
                        <td>${p.country}</td>
                        <td>${teamInfo.league_name || 'Free Agent'}</td>
                        <td style="color: ${teamInfo.team_name ? 'black' : 'red'}">
                            ${teamInfo.team_name || 'Brak klubu'}
                        </td>
                        <td>Tier ${p.potential_id}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

/**
 * Widok Ustawień Ligi - pokazuje kraje i ich strukturę
 */
async function renderLeagueSettings() {
    const container = document.getElementById('admin-league-config-container');
    if (!container) return;

    container.innerHTML = "<p>Pobieranie struktur...</p>";

    const { data: leagues, error } = await supabase
        .from('leagues')
        .select('*')
        .order('country_name', { ascending: true })
        .order('tier', { ascending: true });

    if (error) {
        container.innerHTML = `<p class="error">${error.message}</p>`;
        return;
    }

    let html = `
        <div class="league-grid">
            ${leagues.map(l => `
                <div class="league-card">
                    <h4>${l.country_name} - ${l.league_name}</h4>
                    <p>Poziom: ${l.tier} | Grupa: ${l.sub_tier}</p>
                </div>
            `).join('')}
        </div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Kraj</th>
                    <th>Nazwa Ligi</th>
                    <th>Poziom</th>
                    <th>Podgrupa</th>
                </tr>
            </thead>
            <tbody>
                ${leagues.map(l => `
                    <tr>
                        <td>${l.country_name}</td>
                        <td><strong>${l.league_name}</strong></td>
                        <td>${l.tier === 1 ? '⭐ Super Liga' : 'Poziom ' + l.tier}</td>
                        <td>${l.sub_tier}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}
