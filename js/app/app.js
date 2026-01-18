// js/app/app.js
import { supabaseClient } from '../auth.js';
import { checkLeagueEvents } from '../core/league_clock.js';
import { renderTrainingDashboard } from './training_view.js';
import { renderRosterView } from './roster_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';

let cachedTeam = null;
let cachedPlayers = null;
let cachedProfile = null;

/**
 * Pobiera użytkownika z obsługą specyfiki Safari na MacBooku.
 */
async function getAuthenticatedUser() {
    let { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        // Czekamy na stabilizację sesji w Safari
        await new Promise(res => setTimeout(res, 500));
        const retry = await supabaseClient.auth.getUser();
        user = retry.data.user;
    }
    return user;
}

/**
 * GŁÓWNA FUNKCJA INICJALIZUJĄCA
 */
export async function initApp(force = false) {
    if (!force && cachedTeam && cachedPlayers && cachedProfile) {
        return { team: cachedTeam, players: cachedPlayers, profile: cachedProfile };
    }

    try {
        console.log("[APP] Start inicjalizacji...");
        await checkLeagueEvents();
        const user = await getAuthenticatedUser();
        
        if (!user) {
            console.error("[APP] Błąd: Brak zalogowanego użytkownika.");
            return null;
        }

        // 1. Pobieranie profilu
        const { data: profile, error: profErr } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();
        if (profErr) throw profErr;

        // 2. Pobieranie drużyny
        const { data: team, error: teamErr } = await supabaseClient
            .from('teams').select('*').eq('id', profile.team_id).single();
        if (teamErr) throw teamErr;

        // 3. Pobieranie zawodników z jawnym powiązaniem klucza integer
        console.log("[APP] Pobieranie zawodników dla zespołu:", team.name);
        const { data: players, error: playersError } = await supabaseClient
            .from('players')
            .select(`
                *,
                potential_definitions!fk_potential_definition (
                    id, label, color_hex, emoji, min_value
                )
            `)
            .eq('team_id', team.id);

        if (playersError) {
            console.error("[DB ERROR] Szczegóły relacji:", playersError.message);
            // Fallback: pobieramy zawodników bez relacji, by nie blokować aplikacji
            const { data: fallbackPlayers } = await supabaseClient
                .from('players').select('*').eq('team_id', team.id);
            cachedPlayers = fallbackPlayers;
        } else {
            cachedPlayers = players;
        }

        cachedProfile = profile; 
        cachedTeam = team; 

        window.userTeamId = team.id;
        window.currentManager = profile;

        updateUIHeader(profile);
        return { team, players: cachedPlayers, profile };

    } catch (err) {
        console.error("[CRITICAL ERROR]", err.message);
        return null;
    }
}

function updateUIHeader(profile) {
    const tName = document.getElementById('display-team-name');
    const lName = document.getElementById('display-league-name');
    if (tName) tName.innerText = profile.team_name || "Manager";
    if (lName) lName.innerText = profile.league_name || "Serbian Super League";
}

function clearAllContainers() {
    const ids = ['roster-view-container', 'market-container', 'finances-container', 'training-container', 'app-main-view'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

window.showRoster = async (force = false) => {
    const data = await initApp(force);
    if (data && data.players) {
        console.log("[UI] Renderowanie rostera. Liczba graczy:", data.players.length);
        clearAllContainers();
        renderRosterView(data.team, data.players);
    }
};

window.switchTab = async (tabName) => {
    const data = await initApp();
    if (!data) return;
    clearAllContainers();
    if (tabName.includes('roster')) renderRosterView(data.team, data.players);
    else if (tabName.includes('market')) renderMarketView(data.team, data.players);
    else if (tabName.includes('finances')) renderFinancesView(data.team, data.players);
    else if (tabName.includes('training')) renderTrainingDashboard(data.players);
};

document.addEventListener('DOMContentLoaded', () => window.showRoster());
