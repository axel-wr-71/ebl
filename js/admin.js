// js/admin.js
import { supabaseClient } from './auth.js'; // Import klienta, by utrzymać sesję
import { renderAdminPlayers } from './admin/admin_players.js';
import { renderLeagueSettings } from './admin/admin_leagues.js';
import { renderMediaSettings } from './admin/admin_media.js';

window.switchAdminTab = async function(tabName) {
    console.log("Przełączanie na zakładkę:", tabName);

    const profileView = document.getElementById('player-profile-view');
    if (profileView) profileView.style.display = 'none';

    try {
        switch(tabName) {
            case 'players':
                await renderAdminPlayers();
                break;
            case 'leagues':
                await renderLeagueSettings();
                break;
            case 'media':
                await renderMediaSettings();
                break;
            case 'dashboard':
                console.log("Dashboard w budowie...");
                break;
            default:
                console.warn("Nieznana zakładka:", tabName);
        }
    } catch (error) {
        console.error(`Błąd podczas ładowania zakładki ${tabName}:`, error);
        
        const containers = {
            'players': 'admin-players-table-container',
            'leagues': 'admin-league-config-container',
            'media': 'admin-media-manager-container'
        };
        const contId = containers[tabName];
        if (contId) {
            document.getElementById(contId).innerHTML = 
                `<p style="color:red;">Błąd ładowania sekcji: ${error.message}</p>`;
        }
    }
}
