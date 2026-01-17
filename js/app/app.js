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
 * Wywoływana przy wejściu do panelu lub ręcznym odświeżaniu.
 */
export async function initApp(forceRefresh = false) {
    // Jeśli mamy dane w cache i nie wymuszamy odświeżenia, zwracamy cache
    if (!forceRefresh && cachedTeam && cachedPlayers) {
        return { team: cachedTeam, players: cachedPlayers };
    }

    console.log("[APP] Pobieranie świeżych danych z bazy...");

    try {
        await checkLeagueEvents();

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Błąd autoryzacji użytkownika");

        // Pobieramy dane drużyny
        const { data: team, error: teamError } = await supabaseClient
            .from('teams')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (teamError) throw teamError;
        if (!team) throw new Error("Musisz posiadać drużynę, aby zarządzać klubem.");

        // Pobieramy zawodników (zawsze 12 zgodnie z Twoją strukturą)
        const { data: players, error: playersError } = await supabaseClient
            .from('players')
            .select('*')
            .eq('team_id', team.id);

        if (playersError) throw new Error("Błąd podczas pobierania zawodników");

        // Aktualizujemy cache
        cachedTeam = team;
        cachedPlayers = players;
        window.userTeamId = team.id;

        return { team, players };

    } catch (err) {
        renderError(err.message);
        return null;
    }
}

/**
 * Czyści kontenery, aby uniknąć nakładania się widoków
 */
function clearAllContainers() {
    const containers = [
        'roster-view-container',
        'app-main-view',      // Trening
        'market-container',
        'finances-container'
    ];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

/**
 * Wyświetla widok zawodników (Roster)
 */
export async function showRoster(forceRefresh = false) {
    const data = await initApp(forceRefresh);
    if (!data) return;

    clearAllContainers();
    renderRosterView(data.team, data.players);
}

/**
 * Wyświetla widok treningu
 */
export async function showTraining(forceRefresh = false) {
    const data = await initApp(forceRefresh);
    if (!data) return;

    clearAllContainers();
    renderTrainingDashboard(data.team, data.players);
}

/**
 * Wyświetla widok rynku transferowego
 */
export async function showMarket() {
    // Rynek zazwyczaj wymaga świeżych danych o balansie konta
    const data = await initApp(true);
    if (!data) return;

    clearAllContainers();
    renderMarketView(data.team);
}

/**
 * Wyświetla widok finansów
 */
export async function showFinances() {
    const data = await initApp(true);
    if (!data) return;

    clearAllContainers();
    renderFinancesView(data.team);
}

/**
 * Funkcja pomocnicza do błędów
 */
function renderError(message) {
    console.error("[APP ERROR]", message);
    const container = document.getElementById('app-main-view') || document.body;
    container.innerHTML = `
        <div style="color: #ff4444; padding: 40px; text-align: center; background: #fff; border-radius: 20px; border: 1px solid #ddd; margin: 20px;">
            <h3 style="margin-top:0;">Operacja nie powiodła się</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="background:#1a237e; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">Odśwież stronę</button>
        </div>
    `;
}

// Globalny dostęp do odświeżania widoków (przydatne przy akcjach w RosterActions)
window.refreshCurrentView = (viewName) => {
    if (viewName === 'roster') showRoster(true);
    if (viewName === 'training') showTraining(true);
};
