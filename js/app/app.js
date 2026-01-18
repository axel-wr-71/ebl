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

// Pomocnicza funkcja czekająca na sesję (Safari Fix)
async function getAuthenticatedUser() {
    let { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        await new Promise(res => setTimeout(res, 300));
        const retry = await supabaseClient.auth.getUser();
        user = retry.data.user;
    }
    return user;
}

export async function initApp(forceRefresh = false) {
    if (!forceRefresh && cachedTeam && cachedPlayers && cachedProfile) {
        return { team: cachedTeam, players: cachedPlayers, profile: cachedProfile };
    }

    try {
        await checkLeagueEvents();
        
        const user = await getAuthenticatedUser();
        if (!user) {
            console.error("DEBUG: Sesja nie odnaleziona po 2 próbach.");
            throw new Error("Błąd autoryzacji - zaloguj się ponownie.");
        }

        // 1. Pobieranie profilu managera
        const { data: profile, error: pErr } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();
        if (pErr || !profile) throw new Error("Nie znaleziono profilu.");

        // 2. Pobieranie danych drużyny
        const { data: team, error: tErr } = await supabaseClient
            .from('teams').select('*').eq('id', profile.team_id).single();
        if (tErr || !team) throw new Error("Nie można załadować drużyny.");

        // 3. Pobieranie zawodników WRAZ z ich potencjałem z bazy danych (JOIN)
        // Pamiętam: potential_types to tabela słownikowa (label, color, icon)
        const { data: players, error: plErr } = await supabaseClient
            .from('players')
            .select(`
                *,
                potential_types (
                    label,
                    color,
                    icon,
                    max_value
                )
            `)
            .eq('team_id', team.id);

        if (plErr) {
            console.error("Błąd pobierania graczy z JOIN:", plErr);
            throw plErr;
        }

        cachedProfile = profile;
        cachedTeam = team;
        cachedPlayers = players;
        
        window.userTeamId = team.id;
        window.currentManager = profile;

        updateUIHeader(profile);
        return { team, players, profile };

    } catch (err) {
        console.error("[APP INIT ERROR]", err.message);
        return null;
    }
}

function updateUIHeader(profile) {
    const tName = document.getElementById('display-team-name');
    const lName = document.getElementById('display-league-name');
    if (tName) tName.innerText = profile.team_name || "Manager";
    if (lName) lName.innerText = profile.league_name || "EBL Professional";
}

function clearAllContainers() {
    const ids = ['roster-view-container', 'market-container', 'finances-container', 'training-container', 'app-main-view'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

// Funkcje wywoływane przez switchTab
window.showRoster = async (force = false) => {
    const data = await initApp(force);
    if (data) {
        clearAllContainers();
        if (typeof renderRosterView === 'function') {
            // Przekazujemy dane, gdzie players mają już w sobie obiekt potential_types
            renderRosterView(data.team, data.players);
        } else {
            console.error("Błąd: renderRosterView nie jest funkcją!");
        }
    }
};

window.showMarket = async () => {
    const data = await initApp(true);
    if (data) {
        clearAllContainers();
        renderMarketView(data.team);
    }
};

window.switchTab = async (tabName) => {
    console.log("[Safari] Przełączanie:", tabName);
    if (tabName.includes('roster')) await window.showRoster();
    if (tabName.includes('market')) await window.showMarket();
    if (tabName.includes('training')) {
        const data = await initApp();
        if(data) { clearAllContainers(); renderTrainingDashboard(data.team, data.players); }
    }
    if (tabName.includes('finances')) {
        const data = await initApp();
        if(data) { clearAllContainers(); renderFinancesView(data.team); }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.showRoster();
});
