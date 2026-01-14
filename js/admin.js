// js/admin.js

/**
 * Widok bazy wszystkich zawodników dla Admina - POPRAWIONY
 */
async function renderAdminPlayers() {
    const container = document.getElementById('admin-players-table-container');
    if (!container) return;

    container.innerHTML = "<div class='loading'>Ładowanie bazy danych zawodników...</div>";

    // POPRAWKA: teams(country) zamiast teams(country_name)
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
        // Jeśli nadal jest błąd, wyświetlimy go precyzyjnie
        container.innerHTML = `<div style="color:red; padding:20px;">
            <strong>Błąd bazy danych:</strong> ${error.message}<br>
            <small>Upewnij się, że kolumny w tabeli teams to: team_name, country, league_name</small>
        </div>`;
        return;
    }

    let html = `
        <div style="margin-bottom: 15px;">
            <span>Łącznie w bazie: <strong>${players.length}</strong> zawodników</span>
        </div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>OVR</th>
                    <th>Zawodnik</th>
                    <th>Wiek</th>
                    <th>Poz</th>
                    <th>Kraj (Klubu)</th>
                    <th>Liga</th>
                    <th>Klub</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(p => {
                    const t = p.teams || {}; // Jeśli zawodnik nie ma klubu, t będzie pustym obiektem
                    return `
                    <tr>
                        <td style="font-weight:bold; text-align:center; background:#eee;">${p.overall_rating}</td>
                        <td>${p.first_name} ${p.last_name}</td>
                        <td>${p.age}</td>
                        <td>${p.position}</td>
                        <td>${t.country || '-'}</td>
                        <td>${t.league_name || '-'}</td>
                        <td style="color: ${t.team_name ? 'black' : 'red'}">
                            ${t.team_name || 'WOLNY AGENT'}
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}
