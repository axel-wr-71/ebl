// js/app/app.js
import { supabaseClient } from '../auth.js';
import { renderRosterView } from './roster_view.js';
import { renderTrainingView } from './training_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';
import { renderMediaView } from './media_view.js'; 

import { RosterActions } from './roster_actions.js';

window.RosterActions = RosterActions;
window.potentialDefinitions = {};

async function fetchPotentialDefinitions() {
    try {
        const { data, error } = await supabaseClient.from('potential_definitions').select('*');
        if (error) throw error;
        window.potentialDefinitions = data.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});
        
        window.getPotentialData = (id) => {
            const d = window.potentialDefinitions[id];
            return d ? { 
                label: d.label, 
                emoji: d.emoji || '', 
                color_hex: d.color_hex || '#3b82f6',
                min_value: d.min_value || 0
            } : { label: 'Prospect', emoji: '👤', color_hex: '#94a3b8', min_value: 0 };
        };
    } catch (err) {
        console.error("[APP] Błąd słownika potencjału:", err);
    }
}

export async function initApp() {
    try {
        if (!window.potentialDefinitions || Object.keys(window.potentialDefinitions).length === 0) {
            await fetchPotentialDefinitions();
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
        if (!profile?.team_id) return null;

        window.userTeamId = profile.team_id;

        const [teamRes, playersRes] = await Promise.all([
            supabaseClient.from('teams').select('*').eq('id', profile.team_id).single(),
            supabaseClient.from('players').select('*').eq('team_id', profile.team_id)
        ]);

        const team = teamRes.data;
        const players = (playersRes.data || []).map(p => {
            const potDef = window.getPotentialData(p.potential);
            return { ...p, potential_definitions: potDef };
        });

        return { team, players };
    } catch (err) {
        console.error("[APP] initApp Error:", err);
        return null;
    }
}

export async function switchTab(tabId) {
    console.log("[NAV] Przełączam na:", tabId);
    
    // 1. Natychmiastowa reakcja wizualna (przyciski)
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // 2. Pobierz dane
    const data = await initApp();
    
    // 3. Obsługa błędów danych
    if (!data) {
        console.error("[APP] Nie udało się załadować danych dla zakładki:", tabId);
        return;
    }

    // 4. Przełącz widoczność kontenerów
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
    }

    // 5. Renderowanie (z domyślnymi wartościami dla bezpieczeństwa)
    try {
        if (tabId === 'm-roster') {
            renderRosterView(data.team, data.players);
        } else if (tabId === 'm-training') {
            // Dodajemy bezpieczne pobieranie tygodnia, jeśli nie istnieje w obiekcie team
            const week = data.team?.current_week || 1; 
            renderTrainingView(data.team, data.players, week);
        } else if (tabId === 'm-market') {
            renderMarketView(data.team, data.players);
        } else if (tabId === 'm-media') {
            renderMediaView(data.team, data.players);
        } else if (tabId === 'm-finances') {
            renderFinancesView(data.team, data.players);
        }
    } catch (renderError) {
        console.error("[APP] Błąd podczas renderowania widoku:", renderError);
    }
}

window.switchTab = switchTab;
