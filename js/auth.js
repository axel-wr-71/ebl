// js/auth.js
const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
export const supabaseClient = _supabase;
window.supabase = _supabase;

// Importujemy inicjalizację aplikacji dla Managera
import { initApp } from './app/app.js';

window.POTENTIAL_MAP = [];

/**
 * Pobiera definicje potencjałów (np. GOAT, Elite) z bazy
 */
async function fetchPotentialDefinitions() {
    try {
        const { data, error } = await _supabase
            .from('potential_definitions')
            .select('*')
            .order('min_value', { ascending: false });
        if (error) throw error;
        window.POTENTIAL_MAP = data || [];
    } catch (err) {
        console.error("Błąd potencjałów:", err);
        window.POTENTIAL_MAP = [{ min_value: 0, label: 'Player', color_hex: '#94a3b8', emoji: '👤' }];
    }
}

/**
 * Zwraca sformatowane dane potencjału dla zawodnika
 */
window.getPotentialData = (val) => {
    const p = parseInt(val) || 0;
    const map = window.POTENTIAL_MAP || [];
    const def = map.find(d => p >= d.min_value);
    return def ? { label: def.label, color: def.color_hex, icon: def.emoji || '🏀' } : { label: 'Prospect', color: '#94a3b8', icon: '👤' };
};

/**
 * Funkcja ustawiająca interfejs zależnie od roli
 */
window.setupUI = async (role) => {
    console.log("[AUTH] Konfiguracja UI dla roli:", role);
    
    const landingPage = document.getElementById('landing-page');
    const gameApp = document.getElementById('game-app');
    const adminNav = document.getElementById('admin-nav');
    const managerNav = document.getElementById('manager-nav');

    if (landingPage) landingPage.style.display = 'none';
    if (gameApp) gameApp.style.display = 'block';

    if (role === 'admin' || role === 'moderator') {
        if (adminNav) adminNav.style.display = 'flex';
        if (managerNav) managerNav.style.display = 'none';
        // Domyślna zakładka dla admina
        if (window.showAdminTab) window.showAdminTab('admin-tab-gen');
    } else {
        // ROLA: MANAGER
        if (adminNav) adminNav.style.display = 'none';
        if (managerNav) managerNav.style.display = 'flex';
        
        // URUCHOMIENIE NOWEGO SILNIKA APP (Kragujevac Hoops)
        await initApp();
    }
};

async function signIn() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    if (!e || !p) return alert("Wypełnij pola!");
    
    const { error } = await _supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) alert("Błąd logowania: " + error.message);
    else window.checkUser();
}

async function signUp() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    if (!e || !p) return alert("Wypełnij pola!");
    
    const { error } = await _supabase.auth.signUp({ email: e, password: p });
    if (error) alert(error.message);
    else alert("Konto stworzone! Sprawdź pocztę (również spam).");
}

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (user) {
        // Pobieranie profilu i roli
        let { data: profile, error } = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Jeśli użytkownik istnieje w Auth, ale nie ma rekordu w Profiles (np. błąd przy rejestracji)
        if (error || !profile) {
            console.warn("Profil nie istnieje, tworzę domyślny...");
            const { data: newProfile } = await _supabase
                .from('profiles')
                .insert([{ id: user.id, email: user.email, role: 'manager' }])
                .select()
                .single();
            profile = newProfile;
        }

        await fetchPotentialDefinitions();
        
        // Ustawiamy UI na podstawie roli z profilu
        const userRole = profile?.role || 'manager';
        window.setupUI(userRole);

    } else {
        if (document.getElementById('landing-page')) document.getElementById('landing-page').style.display = 'block';
        if (document.getElementById('game-app')) document.getElementById('game-app').style.display = 'none';
    }
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// Ekspozycja funkcji do okna globalnego (dla przycisków HTML)
window.signIn = signIn;
window.signUp = signUp;
window.logout = logout;
window.checkUser = checkUser;

document.addEventListener('DOMContentLoaded', () => {
    window.checkUser();
});
