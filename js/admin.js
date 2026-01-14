// js/admin.js
import { renderAdminPlayers } from './admin/admin_players.js';
import { renderLeagueSettings } from './admin/admin_leagues.js';

/**
 * Główny przełącznik widoków w panelu Admina
 */
window.switchAdminTab = function(tabName) {
    // Ukrywamy profile zawodników jeśli były otwarte przy zmianie zakładki
    const profileView = document.getElementById('player-profile-view');
    if (profileView) profileView.style.display = 'none';

    switch(tabName) {
        case 'players':
            renderAdminPlayers();
            break;
        case 'leagues':
            renderLeagueSettings();
            break;
        case 'dashboard':
            // renderAdminDashboard(); // Tu dodasz funkcję w przyszłości
            break;
        default:
            console.warn("Nieznana zakładka:", tabName);
    }
}
