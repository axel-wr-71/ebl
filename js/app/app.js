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
 * EKSPERCKA FUNKCJA SESJI (Safari Optimized)
 * Czeka do 3 sekund na zainicjowanie sesji, sprawdzając ją co 200ms.
 */
async function waitForSession() {
    for (let i = 0; i < 15; i++) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) return session.user;
        await new Promise(res => setTimeout(res, 200));
    }
    return null;
}

/**
 * GŁÓWNA INICJALIZACJA APLIKACJI
 */
export async function initApp(force = false) {
    if (!force && cachedTeam && cachedPlayers && cachedProfile) {
        return { team: cachedTeam, players: cachedPlayers, profile: cachedProfile };
    }

    try {
        console.log("[SYSTEM] Inicjalizacja danych...");
        await checkLeagueEvents();

        // Kluczowa zmiana: czekamy na stabilną sesję
        const user = await waitForSession();
        
        if (!user) {
            console.error("[AUTH ERROR] Nie udało się uzyskać sesji po 3s prób.");
            return null;
        }

        // 1. Pobieranie profilu i team_id
        const { data: profile, error: profErr } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();
        if (profErr) throw profErr;

        // 2. Pobieranie danych drużyny
        const { data: team, error: teamErr } = await supabaseClient
            .from('teams').select('*').eq('id', profile.team_id).single();
        if (teamErr) throw teamErr;

        // 3. Pobieranie zawodników z relacją potencjału (jawny FK)
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
            console.warn("[DB WARNING] Relacja FK zawiodła, stosuję fallback:", playersError.message);
            // Fallback: pobieramy tylko graczy bez definicji, żeby nie blokować UI
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
        console.log("[SYSTEM] Dane załadowane pomyślnie.");
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

// Start aplikacji
document.addEventListener('DOMContentLoaded', () => {
    window.showRoster();
});
