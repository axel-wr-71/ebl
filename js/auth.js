// js/auth.js
const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
export const supabaseClient = _supabase;
window.supabase = _supabase;

import { initApp, switchTab } from './app/app.js';

window.POTENTIAL_MAP = [];

/**
 * FUNKCJA NAPRAWIAJĄCA NAZWĘ DRUŻYNY W PRAWYM GÓRNYM ROGU
 * Poprawiona pod strukturę: Profiles (team_id) -> Teams (id)
 */
async function fetchManagerTeam(userId) {
    try {
        // 1. Najpierw pobieramy team_id z profilu użytkownika
        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('team_id')
            .eq('id', userId)
            .single();

        if (profileError || !profile?.team_id) {
            console.warn("[AUTH] Użytkownik nie ma przypisanego team_id w profilu.");
            return;
        }

        // 2. Pobieramy dane drużyny używając pobranego team_id
        const { data: team, error: teamError } = await _supabase
            .from('teams')
            .select('team_name, league_name')
            .eq('id', profile.team_id)
            .single();

        if (teamError) throw teamError;

        if (team) {
            // Szukamy kontenerów w prawym górnym rogu (Safari/MacBook)
            const headerTeamName = document.querySelector('.team-info b, header b');
            const headerLeagueName = document.querySelector('.team-info span[style*="color: #ff4500"], #global-league-name');

            if (headerTeamName) headerTeamName.textContent = team.team_name;
            if (headerLeagueName) headerLeagueName.textContent = team.league_name;
            
            console.log("[AUTH] Nagłówek zaktualizowany pomyślnie:", team.team_name);
        }
    } catch (err) {
        console.warn("[AUTH] Błąd podczas pobierania danych do nagłówka:", err.message);
    }
}

async function fetchPotentialDefinitions() {
    try {
        const { data, error } = await _supabase
            .from('potential_definitions')
            .select('*')
            .order('min_value', { ascending: false });
        if (error) throw error;
        window.POTENTIAL_MAP = data || [];
        console.log("[AUTH] Potencjały załadowane:", window.POTENTIAL_MAP.length);
    } catch (err) {
        console.error("Błąd potencjałów:", err);
        window.POTENTIAL_MAP = [{ min_value: 0, label: 'Player', color_hex: '#94a3b8', emoji: '👤' }];
    }
}

export const setupUI = async (role) => {
    console.log("[AUTH] setupUI dla roli:", role);
    const landingPage = document.getElementById('landing-page');
    const gameApp = document.getElementById('game-app');
    const managerNav = document.getElementById('manager-nav');

    if (landingPage) landingPage.style.display = 'none';
    if (gameApp) gameApp.style.display = 'block';

    if (role === 'manager') {
        if (managerNav) managerNav.style.display = 'flex';
        // Inicjalizacja danych aplikacji (zawodnicy, bazy itp.)
        await initApp();
        // Przełączenie na pierwszą zakładkę
        await switchTab('m-roster');
    }
};
window.setupUI = setupUI;

export async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (user) {
        // Ładujemy mapę potencjałów
        await fetchPotentialDefinitions();
        
        // Pobieramy profil, aby sprawdzić rolę i dane
        let { data: profile } = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            const { data: newProfile } = await _supabase
                .from('profiles')
                .insert([{ id: user.id, email: user.email, role: 'manager' }])
                .select().single();
            profile = newProfile;
        }

        // Aktualizacja nagłówka górnego po upewnieniu się, że mamy profil
        await fetchManagerTeam(user.id);

        await setupUI(profile?.role || 'manager');
    } else {
        if (document.getElementById('landing-page')) document.getElementById('landing-page').style.display = 'block';
        if (document.getElementById('game-app')) document.getElementById('game-app').style.display = 'none';
    }
}
window.checkUser = checkUser;

export const signIn = async () => {
    const e = document.getElementById('email')?.value;
    const p = document.getElementById('password')?.value;
    console.log("[AUTH] Próba logowania...");
    const { error } = await _supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) {
        alert("Błąd: " + error.message);
    } else {
        await checkUser();
    }
};
window.signIn = signIn;

export const signUp = async () => {
    const e = document.getElementById('email')?.value;
    const p = document.getElementById('password')?.value;
    const { error } = await _supabase.auth.signUp({ email: e, password: p });
    if (error) alert("Błąd rejestracji: " + error.message);
    else alert("Konto założone! Możesz się zalogować.");
};
window.signUp = signUp;

export const logout = async () => { 
    await _supabase.auth.signOut(); 
    location.reload(); 
};
window.logout = logout;

// Start przy ładowaniu strony
document.addEventListener('DOMContentLoaded', () => checkUser());
