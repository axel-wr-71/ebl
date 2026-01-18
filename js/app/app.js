// js/app/app.js
import { supabaseClient } from '../auth.js';
import { checkLeagueEvents } from '../core/league_clock.js';
import { renderTrainingDashboard } from './training_view.js';
import { renderRosterView } from './roster_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';

async function getUserSilent() {
    try {
        const { data } = await supabaseClient.auth.getUser();
        if (data?.user) return data.user;
        
        await new Promise(r => setTimeout(r, 1000));
        const { data: sessionData } = await supabaseClient.auth.getSession();
        return sessionData?.session?.user || null;
    } catch (e) { return null; }
}

export async function initApp() {
    console.log("[APP] Inicjalizacja danych...");
    try {
        const user = await getUserSilent();
        if (!user) {
            console.warn("[APP] Brak aktywnej sesji użytkownika.");
            return null;
        }

        const { data: profile, error: profErr } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();

        if (profErr || !profile?.team_id) {
            console.error("[APP] Nie znaleziono profilu lub team_id");
            return null;
        }

        // Pobieramy drużynę i zawodników (uproszczone zapytanie bez błędnych relacji)
        const [teamRes, playersRes] = await Promise.all([
            supabaseClient.from('teams').select('*').eq('id', profile.team_id).single(),
            supabaseClient.from('players').select('*').eq('team_id', profile.team_id)
        ]);

        if (playersRes.error) {
            console.error("[APP] Błąd pobierania graczy:", playersRes.error);
        }

        const team = teamRes.data;
        const rawPlayers = playersRes.data || [];

        // RĘCZNE MAPOWANIE POTENCJAŁÓW (Naprawia błąd relacji)
        const players = rawPlayers.map(p => {
            const potDef = (window.POTENTIAL_MAP || []).find(d => p.potential >= d.min_value) || {
                label: 'Prospect', color_hex: '#94a3b8', emoji: '👤', min_value: 100
            };
            return { ...p, potential_definitions: potDef };
        });

        window.userTeamId = team?.id;
        window.currentManager = profile;

        updateUIHeader(profile);
        console.log(`[APP] System gotowy. Liczba zawodników: ${players.length}`);
        return { team, players, profile };

    } catch (err) {
        console.error("[APP] Krytyczny błąd inicjalizacji:", err);
        return null;
    }
}

function updateUIHeader(profile) {
    const tName = document.getElementById('display-team-name');
    const lName = document.getElementById('display-league-name');
    if (tName) tName.innerText = profile.team_name || "Manager";
    if (lName) lName.innerText = profile.league_name || "Serbia Super League";
}

window.showRoster = async () => {
    const data = await initApp();
    if (data && data.players && data.players.length > 0) {
        renderRosterView(data.team, data.players);
    } else {
        console.log("[UI] Brak danych do wyświetlenia rostera.");
    }
};

window.switchTab = async (tabName) => {
    const data = await initApp();
    if (!data) return;
    
    const container = document.getElementById('roster-view-container');
    if (container && tabName.includes('roster')) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400">Ładowanie...</div>';
    }

    if (tabName.includes('roster')) renderRosterView(data.team, data.players);
    else if (tabName.includes('market')) renderMarketView(data.team, data.players);
    else if (tabName.includes('finances')) renderFinancesView(data.team, data.players);
    else if (tabName.includes('training')) renderTrainingDashboard(data.players);
};
