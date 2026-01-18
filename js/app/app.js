// js/app/app.js
import { supabaseClient } from '../auth.js';
import { checkLeagueEvents } from '../core/league_clock.js';
import { renderTrainingDashboard } from './training_view.js';
import { renderRosterView } from './roster_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';

/**
 * Pobiera usera bez wyrzucania błędów blokujących UI
 */
async function getUserSilent() {
    try {
        const { data } = await supabaseClient.auth.getUser();
        if (data?.user) return data.user;
        
        // Druga próba po krótkiej pauzie (specyfika Safari)
        await new Promise(r => setTimeout(r, 800));
        const retry = await supabaseClient.auth.getSession();
        return retry.data?.session?.user || null;
    } catch (e) { return null; }
}

export async function initApp() {
    try {
        const user = await getUserSilent();
        if (!user) {
            console.log("[APP] Oczekiwanie na stabilizację sesji...");
            return null;
        }

        // Pobieramy profil
        const { data: profile } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();

        if (!profile?.team_id) return null;

        // Pobieramy drużynę i zawodników w jednym kroku (oszczędność czasu)
        const [teamRes, playersRes] = await Promise.all([
            supabaseClient.from('teams').select('*').eq('id', profile.team_id).single(),
            supabaseClient.from('players').select(`
                *,
                potential_definitions!fk_potential_definition (*)
            `).eq('team_id', profile.team_id)
        ]);

        const team = teamRes.data;
        const players = playersRes.data || [];

        // Globalne dane
        window.userTeamId = team?.id;
        window.currentManager = profile;

        updateUIHeader(profile);
        return { team, players, profile };

    } catch (err) {
        console.warn("[APP] Cichy błąd inicjalizacji:", err.message);
        return null;
    }
}

function updateUIHeader(profile) {
    const tName = document.getElementById('display-team-name');
    const lName = document.getElementById('display-league-name');
    if (tName) tName.innerText = profile.team_name || "Manager";
    if (lName) lName.innerText = profile.league_name || "Serbia Super League";
}

window.showRoster = async () => {
    const data = await initApp();
    if (data && data.players && data.players.length > 0) {
        renderRosterView(data.team, data.players);
    } else {
        // Jeśli pusto, spróbuj jeszcze raz za sekundę (autostart)
        setTimeout(() => window.showRoster(), 1000);
    }
};

window.switchTab = async (tabName) => {
    const data = await initApp();
    if (!data) return;
    
    // Czyścimy widok przed zmianą (standard UX)
    const container = document.getElementById('roster-view-container');
    if (container) container.innerHTML = '<div class="p-8 text-center text-slate-400">Ładowanie...</div>';

    if (tabName.includes('roster')) renderRosterView(data.team, data.players);
    else if (tabName.includes('market')) renderMarketView(data.team, data.players);
    else if (tabName.includes('finances')) renderFinancesView(data.team, data.players);
    else if (tabName.includes('training')) renderTrainingDashboard(data.players);
};

// Start aplikacji bez blokowania
document.addEventListener('DOMContentLoaded', () => window.showRoster());
