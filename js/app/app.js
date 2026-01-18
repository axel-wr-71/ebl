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
 * EKSPERCKIE POBIERANIE SESJI (Safari Fix)
 * Jeśli getUser() zawodzi, próbujemy getSession(), co w Safari wymusza odczyt cookie.
 */
async function getAuthenticatedUser() {
    // Próba 1: Bezpośredni użytkownik
    let { data: { user } } = await supabaseClient.auth.getUser();
    if (user) return user;

    // Próba 2: Sprawdzenie sesji (Safari często tu trzyma dane)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) return session.user;

    // Próba 3: Krótki polling (czekamy na asynchroniczne załadowanie SDK)
    for (let i = 0; i < 5; i++) {
        await new Promise(res => setTimeout(res, 400));
        const retry = await supabaseClient.auth.getUser();
        if (retry.data.user) return retry.data.user;
    }
    
    return null;
}

/**
 * GŁÓWNA INICJALIZACJA
 */
export async function initApp(force = false) {
    if (!force && cachedTeam && cachedPlayers && cachedProfile) {
        return { team: cachedTeam, players: cachedPlayers, profile: cachedProfile };
    }

    try {
        console.log("[SYSTEM] Inicjalizacja komponentów...");
        await checkLeagueEvents();

        const user = await getAuthenticatedUser();
        
        if (!user) {
            console.error("[CRITICAL] Brak autoryzacji. Spróbuj zalogować się ponownie.");
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

        // 3. Pobieranie zawodników z relacją potencjału
        // Używamy JAWNEGO aliasu relacji fk_potential_definition
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
            console.warn("[DB] Relacja potencjału niedostępna, ładuję dane podstawowe.");
            const { data: fallback } = await supabaseClient
                .from('players').select('*').eq('team_id', team.id);
            cachedPlayers = fallback || [];
        } else {
            cachedPlayers = players;
        }

        cachedProfile = profile; 
        cachedTeam = team; 

        window.userTeamId = team.id;
        window.currentManager = profile;

        updateUIHeader(profile);
        console.log("[SYSTEM] Dane załadowane: " + cachedPlayers.length + " zawodników.");
        return { team, players: cachedPlayers, profile };

    } catch (err) {
        console.error("[SYSTEM ERROR]", err.message);
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
