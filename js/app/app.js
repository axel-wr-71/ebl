// js/app/app.js
import { supabaseClient } from '../auth.js';
import { checkLeagueEvents } from '../core/league_clock.js';
import { renderTrainingDashboard } from './training_view.js';
import { renderRosterView } from './roster_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';

// Cache na dane
let cachedTeam = null;
let cachedPlayers = null;

/**
 * Główna funkcja inicjująca dane.
 */
export async function initApp(forceRefresh = false) {
    if (!forceRefresh && cachedTeam && cachedPlayers) {
        return { team: cachedTeam, players: cachedPlayers };
    }

    try {
        await checkLeagueEvents();
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Błąd autoryzacji");

        const { data: team, error: teamError } = await supabaseClient
            .from('teams')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (teamError) throw teamError;
        if (!team) throw new Error("Brak przypisanej drużyny.");

        const { data: players, error: playersError } = await supabaseClient
            .from('players')
            .select('*')
            .eq('team_id', team.id);

        if (playersError) throw playersError;

        cachedTeam = team;
        cachedPlayers = players;
        window.userTeamId = team.id;

        return { team, players };
    } catch (err) {
        renderError(err.message);
        return null;
    }
}

function clearAllContainers() {
    const containers = ['roster-view-container', 'app-main-view', 'market-container', 'finances-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

// Funkcje widoków
export async function showRoster(forceRefresh = false) {
    const data = await initApp(forceRefresh);
    if (data) {
        clearAllContainers();
        renderRosterView(data.team, data.players);
    }
}

export async function showTraining(forceRefresh = false) {
    const data = await initApp(forceRefresh);
    if (data) {
        clearAllContainers();
        renderTrainingDashboard(data.team, data.players);
    }
}

export async function showMarket() {
    const data = await initApp(true);
    if (data) {
        clearAllContainers();
        renderMarketView(data.team);
    }
}

export async function showFinances() {
    const data = await initApp(true);
    if (data) {
        clearAllContainers();
        renderFinancesView(data.team);
    }
}

/**
 * Switcher zakładek - dodany i domknięty poprawnie
 */
window.switchTab = async (tabName) => {
    console.log("Przełączanie na:", tabName);
    switch(tabName) {
        case 'roster': await showRoster(); break;
        case 'training': await showTraining(); break;
        case 'market': await showMarket(); break;
        case 'finances': await showFinances(); break;
        default: console.warn("Nieznana zakładka:", tabName);
    }
};

function renderError(message) {
    const container = document.getElementById('app-main-view') || document.body;
    container.innerHTML = `
        <div style="color: #ff4444; padding: 20px; text-align: center; background: #fff; border-radius: 15px; border: 1px solid #ddd; margin: 20px;">
            <h3>Błąd modułu</h3>
            <p>${message}</p>
        </div>
    `;
}

window.refreshCurrentView = (viewName) => {
    if (viewName === 'roster') showRoster(true);
    if (viewName === 'training') showTraining(true);
};
