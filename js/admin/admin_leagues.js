// js/admin/admin_leagues.js
import { supabaseClient } from '../auth.js';

export async function renderLeagueSettings() {
    // Celujemy w kontener dla lig, a nie zawodników
    const container = document.getElementById('admin-league-config-container');
    if (!container) return;

    container.innerHTML = "<div class='loading'>Ładowanie struktur ligowych...</div>";

    const { data: leagues, error } = await supabaseClient
        .from('leagues')
        .select('*')
        .order('country_name', { ascending: true });

    if (error) {
        container.innerHTML = `<p style="color:red">Błąd: ${error.message}</p>`;
        return;
    }

    container.innerHTML = `
        <h3>Struktura Ligowa</h3>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Kraj</th>
                    <th>Liga</th>
                    <th>Poziom (Tier)</th>
                </tr>
            </thead>
            <tbody>
                ${leagues.map(l => `
                    <tr>
                        <td>${l.country_name}</td>
                        <td><strong>${l.league_name}</strong></td>
                        <td>Poziom ${l.tier}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
