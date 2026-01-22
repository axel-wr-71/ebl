// js/app/app.js
import { supabaseClient } from '../auth.js';
import { renderRosterView } from './roster_view.js';
import { renderTrainingView } from './training_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';
import { renderMediaView } from './media_view.js'; 
import { ScheduleView } from './schedule_view.js';
import { RosterActions } from './roster_actions.js';

// Rejestracja globalna
window.RosterActions = RosterActions;
window.potentialDefinitions = {}; 
window.gameState = {
    team: null,
    players: [],
    currentWeek: 0,
    currentTab: 'm-roster' // Dodajemy przechowywanie aktualnej zakładki
};

// Zmienna do śledzenia, czy inicjalizacja jest w toku
let isInitializing = false;

/**
 * Pobiera definicje potencjału
 */
async function fetchPotentialDefinitions() {
    try {
        const { data, error } = await supabaseClient
            .from('potential_definitions')
            .select('*');
        
        if (error) throw error;

        window.potentialDefinitions = data.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});
        
        window.getPotentialData = (id) => {
            const d = window.potentialDefinitions[id];
            return d ? { label: d.label, icon: d.emoji || '', color: d.color || '#3b82f6' } : { label: 'Prospect', icon: '', color: '#94a3b8' };
        };
    } catch (err) {
        console.error("[APP] Błąd potencjałów:", err);
    }
}

/**
 * DYNAMICZNE MENU
 */
async function loadDynamicNavigation() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        let { data: settings } = await supabaseClient
            .from('user_dashboard_settings')
            .select('*, app_modules(*)')
            .eq('user_id', user.id)
            .order('order_index', { ascending: true });

        if (!settings || settings.length === 0) {
            const { data: defaults } = await supabaseClient
                .from('app_modules')
                .select('*')
                .eq('is_active', true);
            
            settings = (defaults || []).map((m, idx) => ({ app_modules: m, order_index: idx }));
        }

        const navContainer = document.getElementById('main-nav-container'); 
        if (!navContainer) return;

        navContainer.innerHTML = settings.map(s => `
            <button class="btn-tab" 
                    data-tab="${s.app_modules.module_key}" 
                    onclick="app.switchTab('${s.app_modules.module_key}')">
                <span class="tab-icon">${s.app_modules.icon || ''}</span>
                <span class="tab-label">${s.app_modules.display_name}</span>
            </button>
        `).join('');

        // Ustaw aktywną zakładkę na podstawie hash lub domyślną
        const hash = window.location.hash.substring(1);
        const defaultTab = settings.length > 0 ? settings[0].app_modules.module_key : 'm-roster';
        
        if (hash && settings.some(s => s.app_modules.module_key === hash)) {
            window.gameState.currentTab = hash;
            await switchTab(hash, true); // true = bez zmiany hash
        } else {
            window.gameState.currentTab = defaultTab;
            await switchTab(defaultTab, true);
        }

    } catch (err) {
        console.error("[APP] Błąd menu:", err);
    }
}

/**
 * Inicjalizacja danych gry
 */
export async function initApp() {
    console.log("[APP] Start inicjalizacji...");
    
    if (isInitializing) {
        console.log("[APP] Inicjalizacja już w toku, pomijam...");
        return;
    }
    
    isInitializing = true;
    
    try {
        // Sprawdzenie czy supabaseClient jest dostępny
        if (!supabaseClient) {
            throw new Error("supabaseClient nie został zainicjalizowany!");
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.warn("[APP] Brak zalogowanego użytkownika.");
            isInitializing = false;
            return;
        }

        // 1. Pobierz dane podstawowe
        const [profileRes, configRes] = await Promise.all([
            supabaseClient.from('profiles').select('team_id').eq('id', user.id).single(),
            supabaseClient.from('game_config').select('value').eq('key', 'current_week').single()
        ]);

        const teamId = profileRes.data?.team_id;
        if (!teamId) {
            console.error("[APP] Brak przypisanej drużyny!");
            isInitializing = false;
            return;
        }

        window.userTeamId = teamId;
        window.gameState.currentWeek = configRes.data ? parseInt(configRes.data.value) : 1;

        // 2. Pobierz definicje potencjałów
        await fetchPotentialDefinitions();

        // 3. Pobierz dane drużyny i zawodników
        const [teamRes, playersRes] = await Promise.all([
            supabaseClient.from('teams').select('*').eq('id', teamId).single(),
            supabaseClient.from('players').select('*').eq('team_id', teamId)
        ]);

        window.gameState.team = teamRes.data;
        window.gameState.players = (playersRes.data || []).map(p => ({
            ...p,
            potential_definitions: window.getPotentialData(p.potential)
        }));

        // UI Updates dla nagłówka
        const teamName = window.gameState.team?.team_name || "Twoja Drużyna";
        document.querySelectorAll('.team-info b, #display-team-name').forEach(el => el.innerText = teamName);

        // 4. Załaduj nawigację
        await loadDynamicNavigation();

    } catch (err) {
        console.error("[APP] Błąd krytyczny initApp:", err);
    } finally {
        isInitializing = false;
    }
}

/**
 * Przełączanie zakładek
 */
export async function switchTab(tabId, skipHashUpdate = false) {
    console.log("[NAV] Przełączam na:", tabId, "obecna:", window.gameState.currentTab);
    
    // Jeśli już jesteśmy na tej zakładce, nic nie rób
    if (window.gameState.currentTab === tabId) {
        console.log("[NAV] Już na tej zakładce, pomijam...");
        return;
    }
    
    // Ukryj wszystkie zakładki
    document.querySelectorAll('.tab-content').forEach(t => {
        t.style.display = 'none';
        t.classList.remove('active');
    });
    
    // Usuń aktywność ze wszystkich przycisków
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    
    // Pokaż i aktywuj wybraną zakładkę
    const targetTab = document.getElementById(tabId);
    if (!targetTab) {
        console.error("[NAV] Nie znaleziono zakładki:", tabId);
        // Fallback do roster
        if (tabId !== 'm-roster') {
            return await switchTab('m-roster', skipHashUpdate);
        }
        return;
    }
    
    targetTab.style.display = 'block';
    targetTab.classList.add('active');
    
    // Aktywuj przycisk
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Zapamiętaj aktualną zakładkę
    window.gameState.currentTab = tabId;
    
    // Aktualizuj hash w URL (opcjonalnie)
    if (!skipHashUpdate) {
        window.location.hash = tabId;
    }

    const { team, players } = window.gameState;
    if (!team) {
        console.warn("[NAV] Brak danych drużyny, czekam...");
        // Spróbuj ponownie za 500ms
        setTimeout(() => switchTab(tabId, skipHashUpdate), 500);
        return;
    }

    try {
        switch (tabId) {
            case 'm-roster': 
                await renderRosterView(team, players); 
                break;
            case 'm-training': 
                await renderTrainingView(team, players); 
                break;
            case 'm-market': 
                await renderMarketView(team, players); 
                break;
            case 'm-media': 
                await renderMediaView(team, players); 
                break;
            case 'm-finances': 
                await renderFinancesView(team, players); 
                break;
            case 'm-schedule': 
                await ScheduleView.render(tabId, window.userTeamId); 
                break;
            default:
                console.warn("[NAV] Nieznana zakładka:", tabId);
                // Fallback do roster
                await switchTab('m-roster', skipHashUpdate);
        }
    } catch (error) {
        console.error("[NAV] Błąd renderowania zakładki:", tabId, error);
        // W przypadku błędu nie przechodź automatycznie do innej zakładki
        // Pozostań na obecnej i wyświetl komunikat
        targetTab.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h3>Błąd ładowania zakładki</h3>
                <p>${error.message}</p>
                <button onclick="app.switchTab('m-roster')" class="btn-primary">
                    Wróć do zawodników
                </button>
            </div>
        `;
    }
}

/**
 * Obsługa zmian hash w URL
 */
function setupHashChangeListener() {
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash && hash !== window.gameState.currentTab) {
            console.log("[HASH] Zmiana hash:", hash);
            switchTab(hash, true);
        }
    });
}

/**
 * Obsługa przycisków wstecz/dalej przeglądarki
 */
function setupPopStateListener() {
    window.addEventListener('popstate', (event) => {
        console.log("[POPSTATE] Zmiana stanu:", event.state);
        if (event.state && event.state.tab) {
            switchTab(event.state.tab, true);
        }
    });
}

/**
 * Rejestracja globalna
 */
window.app = {
    switchTab: switchTab,
    initApp: initApp,
    gameState: window.gameState
};

// BEZPIECZNY START: Czekamy na załadowanie DOM i modułów
document.addEventListener('DOMContentLoaded', () => {
    console.log("[APP] DOM załadowany, inicjuję aplikację...");
    
    // Ustaw nasłuchiwacze na zdarzenia
    setupHashChangeListener();
    setupPopStateListener();
    
    // Rozpocznij inicjalizację
    initApp();
});

// Obsługa błędów globalnych
window.addEventListener('error', function(event) {
    console.error('[APP] Globalny błąd:', event.error);
});

// Obsługa odrzuconych promise'ów
window.addEventListener('unhandledrejection', function(event) {
    console.error('[APP] Nieobsłużony Promise:', event.reason);
});
