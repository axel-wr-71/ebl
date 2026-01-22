// js/app/app.js
import { supabaseClient } from '../auth.js';
import { renderRosterView } from './roster_view.js';
import { renderTrainingView } from './training_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';
import { renderMediaView } from './media_view.js'; 
import { ScheduleView } from './schedule_view.js';

// KRYTYCZNY IMPORT DLA PRZYCISKÓW
import { RosterActions } from './roster_actions.js';

// Rejestracja globalna
window.RosterActions = RosterActions;
window.potentialDefinitions = {}; 
window.gameState = {
    team: null,
    players: [],
    currentWeek: 0
};

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
                    onclick="switchTab('${s.app_modules.module_key}')">
                <span class="tab-icon">${s.app_modules.icon || ''}</span>
                <span class="tab-label">${s.app_modules.display_name}</span>
            </button>
        `).join('');

        initSidebarSortable(navContainer, user.id);

        // Ustawienie domyślnej zakładki po załadowaniu menu
        if (settings.length > 0) {
            const firstTab = settings[0].app_modules.module_key;
            switchTab(firstTab);
        }

    } catch (err) {
        console.error("[APP] Błąd menu:", err);
    }
}

function initSidebarSortable(container, userId) {
    if (typeof Sortable === 'undefined') return;
    Sortable.create(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: async () => {
            const buttons = Array.from(container.querySelectorAll('.btn-tab'));
            for (const [index, btn] of buttons.entries()) {
                const moduleKey = btn.getAttribute('data-tab');
                const { data: mod } = await supabaseClient.from('app_modules').select('id').eq('module_key', moduleKey).single();
                await supabaseClient.from('user_dashboard_settings').upsert({ 
                    user_id: userId, 
                    module_id: mod.id, 
                    order_index: index 
                }, { onConflict: 'user_id, module_id' });
            }
        }
    });
}

/**
 * Inicjalizacja danych gry - Wywoływana raz przy starcie
 */
export async function initApp() {
    console.log("[APP] Inicjalizacja danych globalnych...");
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        // 1. Pobierz profil i tydzień gry
        const [profileRes, configRes] = await Promise.all([
            supabaseClient.from('profiles').select('team_id').eq('id', user.id).single(),
            supabaseClient.from('game_config').select('value').eq('key', 'current_week').single()
        ]);

        const teamId = profileRes.data?.team_id;
        if (!teamId) return;

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

        // UI Updates
        const teamName = window.gameState.team?.team_name || "Twoja Drużyna";
        document.querySelectorAll('.team-info b, #display-team-name').forEach(el => el.innerText = teamName);

        // 4. Załaduj nawigację
        await loadDynamicNavigation();

    } catch (err) {
        console.error("[APP] Błąd initApp:", err);
    }
}

/**
 * Przełączanie zakładek
 */
export async function switchTab(tabId) {
    console.log("[NAV] Przełączam na:", tabId);
    
    // UI: Aktywacja przycisku i sekcji
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Renderowanie widoków z użyciem danych z window.gameState
    const { team, players } = window.gameState;
    if (!team) return;

    switch (tabId) {
        case 'm-roster': renderRosterView(team, players); break;
        case 'm-training': renderTrainingView(team, players); break;
        case 'm-market': renderMarketView(team, players); break;
        case 'm-media': renderMediaView(team, players); break;
        case 'm-finances': renderFinancesView(team, players); break;
        case 'm-schedule': 
            // Przekazujemy ID kontenera zakładki i ID zespołu
            ScheduleView.render(tabId, window.userTeamId); 
            break;
    }
}

window.switchTab = switchTab;
// Autostart
initApp();
