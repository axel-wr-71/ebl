// js/app/app.js
import { supabaseClient } from '../auth.js';
import { renderRosterView } from './roster_view.js';
import { renderTrainingView } from './training_view.js';
import { renderMarketView } from './market_view.js';
import { renderFinancesView } from './finances_view.js';
import { renderMediaView } from './media_view.js'; 
import { renderLeagueView } from './league_view.js'; // DODANO: import modułu League
import { ScheduleView } from './schedule_view.js';
import { RosterActions } from './roster_actions.js';

// Rejestracja globalna
window.RosterActions = RosterActions;
window.potentialDefinitions = {}; 
window.gameState = {
    team: null,
    players: [],
    currentWeek: 0,
    isAdmin: false // Dodajemy flagę admina
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

        // Ustawienie domyślnej zakładki (np. Media) po załadowaniu menu
        if (settings.length > 0) {
            const firstTab = settings[0].app_modules.module_key;
            switchTab(firstTab);
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
    try {
        // Sprawdzenie czy supabaseClient jest dostępny
        if (!supabaseClient) {
            throw new Error("supabaseClient nie został zainicjalizowany!");
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.warn("[APP] Brak zalogowanego użytkownika.");
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

        // 4. Załaduj nawigację (to wywoła switchTab dla pierwszej zakładki)
        await loadDynamicNavigation();

        // 5. Inicjalizacja panelu admina
        initAdminConsole();

    } catch (err) {
        console.error("[APP] Błąd krytyczny initApp:", err);
    }
}

/**
 * Przełączanie zakładek
 */
export async function switchTab(tabId) {
    console.log("[NAV] Przełączam na:", tabId);
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const { team, players } = window.gameState;
    if (!team) return;

    switch (tabId) {
        case 'm-roster': renderRosterView(team, players); break;
        case 'm-training': renderTrainingView(team, players); break;
        case 'm-market': renderMarketView(team, players); break;
        case 'm-media': renderMediaView(team, players); break;
        case 'm-finances': renderFinancesView(team, players); break;
        case 'm-schedule': 
            ScheduleView.render(tabId, window.userTeamId); 
            break;
        case 'm-league': renderLeagueView(team, players); break; // DODANO: moduł League
        case 'm-admin': 
            // DODANO: Obsługa panelu admina
            await renderAdminView(team, players); 
            break;
    }
}

/**
 * DODANO: Funkcja do renderowania panelu admina
 */
async function renderAdminView(team, players) {
    const container = document.getElementById('m-admin');
    if (!container) return;
    
    // Sprawdź czy użytkownik jest adminem
    const userEmail = JSON.parse(localStorage.getItem('supabase.auth.token'))?.currentSession?.user?.email;
    const adminEmails = ['strubbe23@gmail.com', 'admin@ebl.com', 'info.ebl.game@gmail.com'];
    
    if (!userEmail || !adminEmails.includes(userEmail.toLowerCase())) {
        container.innerHTML = `
            <div style="padding: 50px; text-align: center;">
                <h2 style="color: #ef4444;">❌ Brak uprawnień</h2>
                <p style="color: #64748b;">Nie masz dostępu do panelu administracyjnego.</p>
                <p>Twój email: ${userEmail || 'niezalogowany'}</p>
            </div>
        `;
        return;
    }
    
    // Pobierz dane admina z bazy
    try {
        const { data: stats } = await supabaseClient
            .from('admin_stats')
            .select('*')
            .single();
        
        const { data: users } = await supabaseClient
            .from('profiles')
            .select('count')
            .single();
        
        const { data: teams } = await supabaseClient
            .from('teams')
            .select('count')
            .single();
        
        container.innerHTML = `
            <div style="padding: 20px;">
                <h1 style="color: #1a237e; margin-bottom: 20px;">🔧 Panel Administracyjny</h1>
                <p style="color: #64748b; margin-bottom: 30px;">Witaj, ${userEmail}</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h3 style="color: #3b82f6;">👥 Użytkownicy</h3>
                        <p style="font-size: 2rem; font-weight: bold; color: #1a237e;">${users?.count || 0}</p>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h3 style="color: #10b981;">🏀 Drużyny</h3>
                        <p style="font-size: 2rem; font-weight: bold; color: #1a237e;">${teams?.count || 0}</p>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h3 style="color: #f59e0b;">💰 Saldo</h3>
                        <p style="font-size: 2rem; font-weight: bold; color: #1a237e;">${stats?.total_cash || 0} $</p>
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                    <h3 style="color: #1a237e; margin-bottom: 15px;">📊 Szybkie akcje</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="window.__ADMIN.testConnection()" 
                                style="background: #3b82f6; color: white; padding: 10px 15px; border: none; border-radius: 6px; cursor: pointer;">
                            🔌 Test bazy danych
                        </button>
                        <button onclick="window.__ADMIN.updateSalaries()" 
                                style="background: #10b981; color: white; padding: 10px 15px; border: none; border-radius: 6px; cursor: pointer;">
                            💰 Aktualizuj pensje
                        </button>
                        <button onclick="window.__ADMIN.updateMarketValues()" 
                                style="background: #f59e0b; color: white; padding: 10px 15px; border: none; border-radius: 6px; cursor: pointer;">
                            📈 Aktualizuj wartości
                        </button>
                        <button onclick="window.__ADMIN.clearCache()" 
                                style="background: #ef4444; color: white; padding: 10px 15px; border: none; border-radius: 6px; cursor: pointer;">
                            🧹 Wyczyść cache
                        </button>
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color: #1a237e; margin-bottom: 15px;">ℹ️ Informacje debugowania</h3>
                    <div style="font-family: monospace; background: #f3f4f6; padding: 15px; border-radius: 6px;">
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>Team ID:</strong> ${team?.id || 'brak'}</p>
                        <p><strong>Team Name:</strong> ${team?.team_name || 'brak'}</p>
                        <p><strong>Current Week:</strong> ${window.gameState.currentWeek}</p>
                        <p><strong>Players:</strong> ${players?.length || 0}</p>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error("[ADMIN] Błąd ładowania panelu:", error);
        container.innerHTML = `
            <div style="padding: 50px; text-align: center;">
                <h2 style="color: #ef4444;">❌ Błąd ładowania panelu</h2>
                <p style="color: #64748b;">${error.message}</p>
                <button onclick="location.reload()" 
                        style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; margin-top: 20px;">
                    Odśwież stronę
                </button>
            </div>
        `;
    }
}

// ============================================
// PANEL ADMINA - DOSTĘP PRZEZ KONSOLĘ (KROK 3)
// ============================================

/**
 * Inicjalizacja konsoli admina
 */
function initAdminConsole() {
    console.log("[ADMIN] Inicjalizacja panelu admina...");
    
    // Funkcja do ładowania panelu admina
    window.loadAdminPanel = async function() {
        console.log("[ADMIN] Próba załadowania panelu admina...");
        
        // 1. Sprawdź czy użytkownik jest zalogowany
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert("❌ Musisz być zalogowany!");
            return;
        }
        
        // 2. Proste zabezpieczenie hasłem (możesz zmienić)
        const password = prompt("🔐 PANEL ADMINA\n\nWprowadź hasło dostępu:");
        
        if (password === "NBA2024!ADMIN") {
            // Hasło poprawne - załaduj panel
            await showAdminPanel();
        } else if (password === "test") {
            // Tryb testowy z łatwiejszym dostępem
            alert("⚠️ Tryb testowy - ograniczone funkcje");
            await showAdminPanel(true);
        } else {
            alert("❌ Nieprawidłowe hasło!");
            return;
        }
    };

    // Główna funkcja pokazująca panel admina
    async function showAdminPanel(isTestMode = false) {
        let container;
        try {
            // Znajdź lub utwórz kontener
            container = document.getElementById('admin-panel-container');
            if (!container) {
                // Jeśli nie ma, stwórz
                container = document.createElement('div');
                container.id = 'admin-panel-container';
                document.body.appendChild(container);
            }
            
            // Pokaż ładowanie
            container.innerHTML = `
                <div style="padding: 50px; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 20px;">⚙️</div>
                    <h2 style="color: #1a237e;">Ładowanie Panelu Admina...</h2>
                    <p style="color: #64748b;">Proszę czekać</p>
                </div>
            `;
            
            // Dynamiczny import panelu admina
            const { renderAdminPanel } = await import('./admin_panel.js');
            
            // Pobierz dane drużyny (jeśli potrzebne)
            let teamData = window.gameState.team;
            
            // Jeśli tryb testowy, przekaż flagę
            if (isTestMode) {
                teamData = { ...teamData, test_mode: true };
            }
            
            // Renderuj panel
            await renderAdminPanel(teamData);
            
            console.log("[ADMIN] Panel załadowany pomyślnie!");
            
        } catch (error) {
            console.error("[ADMIN] Błąd ładowania panelu:", error);
            
            if (container) {
                container.innerHTML = `
                    <div style="padding: 50px; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 20px; color: #ef4444;">❌</div>
                        <h2 style="color: #1a237e;">Błąd ładowania panelu</h2>
                        <p style="color: #64748b;">${error.message}</p>
                        <button onclick="location.reload()" 
                                style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; margin-top: 20px;">
                            Odśwież stronę
                        </button>
                    </div>
                `;
            }
        }
    }

    // Dodatkowe funkcje admina dostępne z konsoli
    window.__ADMIN = {
        // Otwórz panel admina
        open: () => window.loadAdminPanel(),
        
        // Sprawdź stan aplikacji
        status: () => {
            console.log("=== STATUS APLIKACJI ===");
            console.log("User ID:", localStorage.getItem('user_id'));
            console.log("Team ID:", window.userTeamId);
            console.log("Team Name:", window.gameState.team?.team_name);
            console.log("Players:", window.gameState.players.length);
            console.log("Current Week:", window.gameState.currentWeek);
            console.log("Token:", localStorage.getItem('supabase.auth.token'));
            console.log("========================");
        },
        
        // Wyczyść cache aplikacji
        clearCache: () => {
            if (confirm("Czy na pewno chcesz wyczyścić cache?\nWszystkie dane lokalne zostaną usunięte.")) {
                localStorage.clear();
                sessionStorage.clear();
                alert("✅ Cache wyczyszczony! Strona zostanie odświeżona.");
                location.reload();
            }
        },
        
        // Test połączenia z Supabase
        testConnection: async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('teams')
                    .select('count')
                    .limit(1);
                    
                if (error) throw error;
                console.log("✅ Połączenie z Supabase OK");
                alert("✅ Połączenie z bazą działa poprawnie!");
                return true;
            } catch (error) {
                console.error("❌ Błąd połączenia:", error);
                alert("❌ Błąd połączenia: " + error.message);
                return false;
            }
        },
        
        // Szybka aktualizacja pensji (bez GUI)
        updateSalaries: async () => {
            if (!confirm("Czy chcesz zaktualizować pensje wszystkich graczy?\nTa operacja może potrwać kilka minut.")) return;
            
            try {
                console.log("[ADMIN] Rozpoczynam aktualizację pensji...");
                
                const { adminUpdateSalaries } = await import('../core/economy.js');
                const result = await adminUpdateSalaries();
                
                console.log("✅ Wynik aktualizacji:", result);
                
                if (result.success) {
                    alert(`✅ Aktualizacja zakończona!\n\nZaktualizowano: ${result.updatedPlayers} graczy\nBez zmian: ${result.unchangedPlayers} graczy\nW sumie: ${result.totalPlayers} graczy`);
                } else if (result.cancelled) {
                    alert("❌ Aktualizacja anulowana");
                } else {
                    alert(`❌ Błąd aktualizacji:\n${result.errors?.join('\n') || result.error}`);
                }
                
                return result;
                
            } catch (error) {
                console.error("❌ Błąd:", error);
                alert("❌ Błąd aktualizacji: " + error.message);
                return { success: false, error: error.message };
            }
        },
        
        // Aktualizuj wartości rynkowe (dodano z powrotem)
        updateMarketValues: async () => {
            if (!confirm("Czy chcesz zaktualizować wartości rynkowe wszystkich graczy?")) return;
            
            try {
                const { adminUpdateMarketValues } = await import('../core/economy.js');
                console.log("[ADMIN] Rozpoczynam aktualizację wartości rynkowych...");
                
                const result = await adminUpdateMarketValues();
                
                if (result.success) {
                    alert(`✅ ${result.message || `Zaktualizowano wartości rynkowe ${result.updatedCount} graczy`}`);
                } else {
                    alert(`❌ Błąd: ${result.error || "Nieznany błąd"}`);
                }
                
                return result;
                
            } catch (error) {
                console.error("❌ Błąd:", error);
                alert("❌ Błąd: " + error.message);
            }
        }
    };

    // Skrót klawiaturowy (opcjonalnie) - Ctrl+Shift+A
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            console.log("[ADMIN] Skrót klawiaturowy wykryty - otwieram panel...");
            window.loadAdminPanel();
        }
    });

    // Automatyczne logowanie do konsoli po załadowaniu strony
    setTimeout(() => {
        console.log("==========================================");
        console.log("PANEL ADMINA DOSTĘPNY");
        console.log("Dostępne komendy w konsoli:");
        console.log("  loadAdminPanel()  - otwórz panel GUI");
        console.log("  __ADMIN.open()    - to samo");
        console.log("  __ADMIN.status()  - status aplikacji");
        console.log("  __ADMIN.updateSalaries() - aktualizuj pensje");
        console.log("  __ADMIN.updateMarketValues() - aktualizuj wartości"); // DODANO
        console.log("  __ADMIN.testConnection() - test bazy");
        console.log("  __ADMIN.clearCache() - wyczyść cache");
        console.log("");
        console.log("Skrót klawiaturowy: Ctrl+Shift+A");
        console.log("==========================================");
    }, 2000);
}

// Rejestracja globalna dla onclick w HTML
window.switchTab = switchTab;

// BEZPIECZNY START: Czekamy na załadowanie DOM i modułów
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
