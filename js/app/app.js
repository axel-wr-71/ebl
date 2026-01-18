// js/app/app.js
import { supabaseClient } from '../auth.js';
import { renderRosterView } from './roster_view.js';
import { renderTrainingDashboard } from './training_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';

// KRYTYCZNY IMPORT DLA PRZYCISKÓW
import { RosterActions } from './roster_actions.js';

// Rejestracja globalna natychmiast po załadowaniu
window.RosterActions = RosterActions;

export async function initApp() {
    console.log("[APP] Pobieranie danych drużyny...");
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();

        if (!profile?.team_id) {
            console.warn("[APP] Manager nie ma przypisanej drużyny!");
            return null;
        }

        const [teamRes, playersRes] = await Promise.all([
            supabaseClient.from('teams').select('*').eq('id', profile.team_id).single(),
            supabaseClient.from('players').select('*').eq('team_id', profile.team_id)
        ]);

        const team = teamRes.data;
        const players = (playersRes.data || []).map(p => {
            // Używamy globalnej funkcji z roster_actions.js do mapowania potencjału
            const potDef = window.getPotentialData ? window.getPotentialData(p.potential) : { label: 'Prospect', color: '#94a3b8' };
            return { ...p, potential_definitions: potDef };
        });

        const teamName = team?.team_name || team?.name || "Twoja Drużyna";
        const leagueName = team?.league_name || "Super League";

        const tName = document.getElementById('display-team-name');
        const lName = document.getElementById('display-league-name');
        if (tName) tName.innerText = teamName;
        if (lName) lName.innerText = leagueName;

        const globalTeamDisplay = document.querySelector('.team-info b');
        const globalLeagueDisplay = document.querySelector('.team-info span[style*="color: #ff4500"], #global-league-name');
        
        if (globalTeamDisplay) globalTeamDisplay.innerText = teamName;
        if (globalLeagueDisplay) globalLeagueDisplay.innerText = leagueName;

        return { team, players };
    } catch (err) {
        console.error("[APP] Błąd krytyczny initApp:", err);
        return null;
    }
}

export async function switchTab(tabId) {
    console.log("[NAV] Przełączam na:", tabId);
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const data = await initApp();
    if (!data) return;

    if (tabId === 'm-roster') renderRosterView(data.team, data.players);
    else if (tabId === 'm-training') renderTrainingDashboard(data.players);
    else if (tabId === 'm-market') renderMarketView(data.team, data.players);
    else if (tabId === 'm-finances') renderFinancesView(data.team, data.players);
}

window.switchTab = switchTab;
