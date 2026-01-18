// js/auth.js
const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
export const supabaseClient = _supabase;
window.supabase = _supabase;

import { initApp } from './app/app.js';

window.POTENTIAL_MAP = [];

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

window.setupUI = async (role) => {
    const landingPage = document.getElementById('landing-page');
    const gameApp = document.getElementById('game-app');
    const adminNav = document.getElementById('admin-nav');
    const managerNav = document.getElementById('manager-nav');

    if (landingPage) landingPage.style.display = 'none';
    if (gameApp) gameApp.style.display = 'block';

    if (role === 'admin' || role === 'moderator') {
        if (adminNav) adminNav.style.display = 'flex';
        if (managerNav) managerNav.style.display = 'none';
        if (typeof window.switchTab === 'function') window.switchTab('admin-tab-gen');
    } else {
        if (adminNav) adminNav.style.display = 'none';
        if (managerNav) managerNav.style.display = 'flex';
        
        await initApp();
        if (typeof window.switchTab === 'function') window.switchTab('m-roster');
    }
};

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (user) {
        // Najpierw potencjały, potem UI
        await fetchPotentialDefinitions();
        
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

        await window.setupUI(profile?.role || 'manager');
    } else {
        if (document.getElementById('landing-page')) document.getElementById('landing-page').style.display = 'block';
        if (document.getElementById('game-app')) document.getElementById('game-app').style.display = 'none';
    }
}

// Globalne funkcje logowania
window.signIn = async () => {
    const e = document.getElementById('email')?.value;
    const p = document.getElementById('password')?.value;
    const { error } = await _supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) alert("Błąd: " + error.message);
    else await checkUser();
};
window.logout = async () => { await _supabase.auth.signOut(); location.reload(); };
window.checkUser = checkUser;

document.addEventListener('DOMContentLoaded', () => checkUser());
