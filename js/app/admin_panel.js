// js/app/admin_panel.js
import { checkAdminPermissions } from '../auth.js';

// Bezpośrednio pobierz supabaseClient z window, bo w auth.js jest globalnie wystawiony
const supabaseClient = window.supabase;

import { 
    adminUpdateSalaries,
    adminUpdateMarketValues,
    calculatePlayerDynamicWage
} from '../core/economy.js';

// Zmienne globalne dla panelu
let adminLogEntries = [];
let systemStats = null;
let currentModal = null;

// Główna funkcja renderująca panel admina
export async function renderAdminPanel(teamData) {
    console.log("[ADMIN] Renderowanie panelu admina...");
    
    // Sprawdź czy supabaseClient jest dostępny
    if (!supabaseClient) {
        console.error("[ADMIN] supabaseClient nie jest dostępny");
        return `
            <div style="padding: 50px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #ef4444;">❌</div>
                <h2 style="color: #1a237e;">Błąd systemu</h2>
                <p style="color: #64748b;">Brak połączenia z bazą danych. Spróbuj odświeżyć stronę.</p>
                <button onclick="location.reload()" 
                        style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; margin-top: 20px;">
                    Odśwież stronę
                </button>
            </div>
        `;
    }
    
    // Sprawdź uprawnienia admina - TYLKO przez bazę danych
    const { hasAccess, reason, profile } = await checkAdminPermissions();
    
    if (!hasAccess) {
        console.warn(`[ADMIN] Brak dostępu: ${reason}`);
        
        // Pokaż komunikat użytkownikowi
        let message = "Nie masz uprawnień do panelu administracyjnego.";
        
        switch(reason) {
            case "not_logged_in":
                message = "Musisz być zalogowany aby uzyskać dostęp do panelu admina.";
                break;
            case "insufficient_permissions":
                const details = profile?.details || {};
                if (!details.isAdminRole && !details.hasNoTeam) {
                    message = "Twoje konto nie ma uprawnień administratora i jest przypisane do drużynie.";
                } else if (!details.isAdminRole) {
                    message = "Twoje konto nie ma uprawnień administratora (role ≠ 'admin').";
                } else {
                    message = "Twoje konto jest przypisane do drużyny (team_id ≠ NULL).";
                }
                break;
            case "profile_error":
                message = "Błąd podczas weryfikacji Twojego konta.";
                break;
        }
        
        return `
            <div style="padding: 50px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #ef4444;">❌</div>
                <h2 style="color: #1a237e;">Brak uprawnień</h2>
                <p style="color: #64748b;">${message}</p>
                <button onclick="location.reload()" 
                        style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; margin-top: 20px;">
                    Odśwież stronę
                </button>
            </div>
        `;
    }
    
    // Jeśli ma uprawnienia, renderuj panel
    console.log("[ADMIN] Użytkownik ma uprawnienia admina - renderuję panel");
    return await renderAdminPanelContent(teamData);
}

/**
 * Główna funkcja renderująca zawartość panelu admina
 */
async function renderAdminPanelContent(teamData) {
    // Pobierz kontener
    const container = document.getElementById('m-admin');
    if (!container) {
        console.error("[ADMIN] Nie znaleziono kontenera m-admin");
        return null;
    }
    
    // Wyczyść poprzednie logi
    adminLogEntries = [];
    
    // Renderuj cały panel admina
    container.innerHTML = `
        <div class="admin-modern-wrapper" style="min-height: 100vh; background: #f8fafc;">
            <!-- NAGŁÓWEK -->
            <div class="admin-header" style="padding: 25px 30px; background: linear-gradient(135deg, #1a237e, #283593); color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin:0; font-weight:900; text-transform:uppercase; font-family: 'Inter', sans-serif; font-size: 2rem; letter-spacing: 1px;">
                            ADMIN <span style="color:#ff9800">PANEL</span>
                        </h1>
                        <p style="margin:10px 0 0 0; color:#bbdefb; font-size: 0.95rem;">
                            Narzędzia administracyjne NBA Manager | ${new Date().toLocaleString()}
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div style="background:rgba(255,255,255,0.2); color:white; padding:10px 20px; border-radius:8px; font-weight:700; font-size:0.85rem; display:flex; align-items:center; gap:8px; border: 1px solid rgba(255,255,255,0.3);">
                            <span>⚙️</span> ADMIN MODE
                        </div>
                    </div>
                </div>
            </div>

            <!-- KARTY STATYSTYK (KLIKALNE!) -->
            <div style="padding: 25px 30px 10px 30px; background: white;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <button class="admin-stat-card clickable-card" data-card-action="management" style="border:none; cursor:pointer; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 25px; border-radius: 12px; text-align: center; transition: transform 0.2s, box-shadow 0.2s;">
                        <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 15px;">👥</div>
                        <div class="stat-title" style="font-size: 1.3rem; font-weight: 800; margin-bottom: 5px;">Zarządzanie</div>
                        <div class="stat-subtitle" style="font-size: 0.9rem; opacity: 0.9;">Gracze i drużyny</div>
                    </button>
                    
                    <button class="admin-stat-card clickable-card" data-card-action="economy" style="border:none; cursor:pointer; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 12px; text-align: center; transition: transform 0.2s, box-shadow 0.2s;">
                        <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 15px;">💰</div>
                        <div class="stat-title" style="font-size: 1.3rem; font-weight: 800; margin-bottom: 5px;">Ekonomia</div>
                        <div class="stat-subtitle" style="font-size: 0.9rem; opacity: 0.9;">Pensje i finanse</div>
                    </button>
                    
                    <button class="admin-stat-card clickable-card" data-card-action="statistics" style="border:none; cursor:pointer; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 25px; border-radius: 12px; text-align: center; transition: transform 0.2s, box-shadow 0.2s;">
                        <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 15px;">📊</div>
                        <div class="stat-title" style="font-size: 1.3rem; font-weight: 800; margin-bottom: 5px;">Statystyki</div>
                        <div class="stat-subtitle" style="font-size: 0.9rem; opacity: 0.9;">Dane systemowe</div>
                    </button>
                    
                    <button class="admin-stat-card clickable-card" data-card-action="system" style="border:none; cursor:pointer; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 25px; border-radius: 12px; text-align: center; transition: transform 0.2s, box-shadow 0.2s;">
                        <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 15px;">⚙️</div>
                        <div class="stat-title" style="font-size: 1.3rem; font-weight: 800; margin-bottom: 5px;">System</div>
                        <div class="stat-subtitle" style="font-size: 0.9rem; opacity: 0.9;">Konfiguracja</div>
                    </button>
                </div>
            </div>

            <!-- SEKCJA EKONOMII -->
            <div class="admin-section" style="padding: 25px 30px;">
                <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                        <span>💰</span> Aktualizacja Pensji i Wartości
                    </h3>
                    <p style="color:#64748b; font-size:0.9rem; margin-bottom:20px;">
                        Uruchom masową aktualizację pensji i wartości rynkowych wszystkich graczy.
                    </p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <button id="btn-admin-update-salaries" 
                                style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 15px; border-radius: 8px; 
                                       font-weight: 700; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            🔄 Zaktualizuj WSZYSTKIE pensje
                        </button>
                        
                        <button id="btn-admin-update-values" 
                                style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 15px; border-radius: 8px; 
                                       font-weight: 700; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            💰 Aktualizuj wartości rynkowe
                        </button>
                        
                        <button id="btn-admin-advanced-salary" 
                                style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; padding: 15px; border-radius: 8px; 
                                       font-weight: 700; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            ⚙️ Zaawansowane algorytmy
                        </button>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <button id="btn-admin-single-team" 
                                style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 15px; border-radius: 8px; 
                                       font-weight: 700; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%;">
                            🏀 Aktualizuj tylko moją drużynę
                        </button>
                        <p style="color:#64748b; font-size:0.8rem; margin-top:8px; text-align:center;">
                            Drużyna: ${teamData?.team_name || 'System Admin'} | ID: ${teamData?.id || 'admin'}
                        </p>
                    </div>
                    
                    <div id="salary-update-result" style="margin-top: 20px; display: none;"></div>
                </div>
            </div>

            <!-- SZYBKIE AKCJE -->
            <div class="admin-section" style="padding: 0 30px 25px 30px;">
                <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                        <span>⚡</span> Szybkie akcje
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <button class="admin-quick-btn" data-action="clear-cache" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; text-align: center;">
                            🗑️ Wyczyść cache
                        </button>
                        <button class="admin-quick-btn" data-action="recalculate-stats" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; text-align: center;">
                            📊 Przelicz statystyki
                        </button>
                        <button class="admin-quick-btn" data-action="fix-players" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; text-align: center;">
                            🏀 Napraw graczy
                        </button>
                        <button class="admin-quick-btn" data-action="check-db" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; text-align: center;">
                            🔍 Sprawdź bazę
                        </button>
                        <button class="admin-quick-btn" data-action="refresh-stats" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; text-align: center;">
                            🔄 Odśwież statystyki
                        </button>
                    </div>
                </div>
            </div>

            <!-- STATYSTYKI SYSTEMU -->
            <div class="admin-section" style="padding: 0 30px 25px 30px;">
                <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                        <span>📈</span> Statystyki systemu
                    </h3>
                    
                    <div id="system-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                        <!-- Dynamicznie ładowane -->
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Ładowanie...</div>
                            <div style="font-size: 1.2rem; font-weight: 800; color: #1a237e;">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- KONSOLA LOGÓW -->
            <div class="admin-section" style="padding: 0 30px 25px 30px;">
                <div class="admin-log" style="padding: 20px; background: #1a237e; color: white; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div style="font-weight: 700; font-size: 1rem;">KONSOLA ADMINA</div>
                        <div style="display: flex; gap: 10px;">
                            <button id="btn-clear-log" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                🗑️ Wyczyść
                            </button>
                            <button id="btn-export-log" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                📥 Export log
                            </button>
                        </div>
                    </div>
                    <div id="admin-console-log" style="height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-family: 'Monaco', 'Courier New', monospace;">
                        <div>> System: Panel administracyjny załadowany [${new Date().toLocaleTimeString()}]</div>
                        <div>> System: Inicjalizacja modułów...</div>
                    </div>
                </div>
            </div>

            <!-- STOPKA -->
            <div style="padding: 20px 30px; background: #1a237e; color: white; border-top: 1px solid #2d3a8c;">
                <div style="text-align: center;">
                    <p style="margin:0; font-size:0.8rem;">© 2024 NBA Manager | Panel Administracyjny v2.0 | Użytkownik: ${teamData?.team_name || 'System Admin'}</p>
                    <p style="margin:5px 0 0 0; font-size: 0.7rem; color: #94a3b8;">Ostatnie odświeżenie: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;

    // Inicjalizacja event listenerów
    initAdminEventListeners();
    
    // Załaduj statystyki systemu
    await loadSystemStats();
    
    // Dodaj początkowy log
    addAdminLog('Panel administracyjny gotowy do użycia', 'info');
    addAdminLog('Sesja admina zweryfikowana przez bazę danych', 'success');
    
    // Dodaj styl CSS
    injectAdminStyles();
    
    return container.innerHTML;
}

function initAdminEventListeners() {
    console.log("[ADMIN] Inicjalizacja listenerów...");
    
    // ===== KLIKALNE KARTY STATYSTYK =====
    document.querySelectorAll('.admin-stat-card.clickable-card').forEach(card => {
        card.addEventListener('click', handleStatCardClick);
    });
    
    // Aktualizacja pensji - otwiera modal z algorytmami
    const salaryBtn = document.getElementById('btn-admin-update-salaries');
    if (salaryBtn) {
        salaryBtn.addEventListener('click', () => {
            if (confirm('Czy chcesz zaktualizować pensje wszystkich graczy?\nTa operacja może potrwać kilka minut.')) {
                handleUpdateSalaries();
            }
        });
    }
    
    // Zaawansowane algorytmy pensji
    const advancedBtn = document.getElementById('btn-admin-advanced-salary');
    if (advancedBtn) {
        advancedBtn.addEventListener('click', () => {
            showSimpleAlgorithmModal();
        });
    }
    
    // Aktualizacja wartości rynkowych
    const valueBtn = document.getElementById('btn-admin-update-values');
    if (valueBtn) {
        valueBtn.addEventListener('click', () => {
            if (confirm('Czy chcesz zaktualizować wartości rynkowe wszystkich graczy?')) {
                handleMarketValueUpdate();
            }
        });
    }
    
    // Aktualizacja tylko mojej drużyny
    const singleBtn = document.getElementById('btn-admin-single-team');
    if (singleBtn) {
        singleBtn.addEventListener('click', handleSingleTeamUpdate);
    }
    
    // Szybkie akcje
    document.querySelectorAll('.admin-quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Zarządzanie logami
    const clearLogBtn = document.getElementById('btn-clear-log');
    if (clearLogBtn) clearLogBtn.addEventListener('click', clearAdminLog);
    
    const exportLogBtn = document.getElementById('btn-export-log');
    if (exportLogBtn) exportLogBtn.addEventListener('click', exportAdminLog);
}

// ===== FUNKCJE HANDLERÓW KART =====

/**
 * Obsługa kliknięcia w karty statystyk
 */
function handleStatCardClick(event) {
    const card = event.currentTarget;
    const action = card.getAttribute('data-card-action');
    const cardName = card.querySelector('.stat-title').textContent;
    
    console.log(`[ADMIN] Kliknięto kartę: ${cardName} (akcja: ${action})`);
    
    // Dodaj log
    addAdminLog(`Wybrano sekcję: ${cardName}`, 'info');
    
    // Animacja kliknięcia
    card.style.transform = 'translateY(0) scale(0.98)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
    
    // Przewiń do odpowiedniej sekcji
    switch(action) {
        case 'management':
            // Przewiń do sekcji ekonomii (najbliższej dostępnej)
            document.querySelector('.admin-section:nth-of-type(1)')?.scrollIntoView({ behavior: 'smooth' });
            break;
        case 'economy':
            // Sekcja ekonomii jest pierwsza
            document.querySelector('.admin-section:nth-of-type(1)')?.scrollIntoView({ behavior: 'smooth' });
            break;
        case 'statistics':
            // Przewiń do statystyk systemu
            document.querySelector('#system-stats')?.scrollIntoView({ behavior: 'smooth' });
            break;
        case 'system':
            // Przewiń do szybkich akcji (druga sekcja)
            document.querySelector('.admin-section:nth-of-type(2)')?.scrollIntoView({ behavior: 'smooth' });
            break;
        default:
            // Domyślnie pokaż alert z informacją
            showCardInfoModal(action, cardName);
            break;
    }
}

/**
 * Pokazuje modal z informacją o karcie
 */
function showCardInfoModal(action, cardName) {
    const messages = {
        'management': 'Sekcja zarządzania graczami i drużynami - dostępna wkrótce!',
        'economy': 'Sekcja ekonomii - już dostępna powyżej',
        'statistics': 'Statystyki systemu - wyświetlane poniżej',
        'system': 'Szybkie akcje systemowe - dostępne poniżej'
    };
    
    const message = messages[action] || `Sekcja "${cardName}" jest w trakcie rozwoju.`;
    
    // Utwórz prosty modal
    const modalHTML = `
        <div class="admin-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:25px; width:90%; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>ℹ️</span> ${cardName}
                </h3>
                <p style="color:#334155; font-size:0.95rem; margin-bottom:20px;">${message}</p>
                <button id="btn-close-modal" style="background:#3b82f6; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:600; cursor:pointer; width:100%;">
                    Zamknij
                </button>
            </div>
        </div>
    `;
    
    // Dodaj modal do body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Obsługa zamknięcia
    const modal = document.querySelector('.admin-modal-overlay');
    const closeBtn = document.getElementById('btn-close-modal');
    
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ===== FUNKCJE ADMINISTRACYJNE =====

/**
 * Aktualizacja pensji tylko dla bieżącej drużyny
 */
async function handleSingleTeamUpdate() {
    const teamId = window.currentUser?.team_id;
    
    if (!teamId) {
        addAdminLog('Nie znaleziono ID drużyny użytkownika', 'error');
        alert('Nie można zidentyfikować Twojej drużyny. Zaloguj się ponownie.');
        return;
    }
    
    if (!confirm('Czy chcesz zaktualizować pensje tylko dla graczy w Twojej drużynie?')) {
        return;
    }
    
    addAdminLog(`Rozpoczynam aktualizację pensji dla drużyny ID: ${teamId}...`, 'warning');
    
    try {
        // Pobierz graczy z drużyny
        const { data: players, error } = await supabaseClient
            .from('players')
            .select('*')
            .eq('team_id', teamId);
            
        if (error) throw error;
        
        if (!players || players.length === 0) {
            addAdminLog('Brak graczy w drużynie do aktualizacji', 'warning');
            alert('Twoja drużyna nie ma żadnych graczy.');
            return;
        }
        
        // Oblicz nowe pensje dla każdego gracza
        const updates = [];
        for (const player of players) {
            const newWage = calculatePlayerDynamicWage(player);
            updates.push({
                id: player.id,
                salary: newWage,
                last_salary_update: new Date().toISOString()
            });
        }
        
        // Zaktualizuj w bazie danych
        const { data, error: updateError } = await supabaseClient
            .from('players')
            .upsert(updates, { onConflict: 'id' });
            
        if (updateError) throw updateError;
        
        // Pokaż wynik
        const resultDiv = document.getElementById('salary-update-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; color: #065f46;">
                    <strong>✅ Sukces:</strong> Zaktualizowano pensje dla Twojej drużyny<br>
                    <strong>Zaktualizowano:</strong> ${updates.length} graczy<br>
                    <strong>Drużyna:</strong> ${teamId}
                </div>
            `;
            addAdminLog(`Zaktualizowano pensje ${updates.length} graczy w drużynie ${teamId}`, 'success');
        }
        
        await loadSystemStats();
        
    } catch (error) {
        addAdminLog(`Błąd aktualizacji drużyny: ${error.message}`, 'error');
        alert(`❌ Błąd: ${error.message}`);
    }
}

/**
 * Obsługa szybkich akcji
 */
async function handleQuickAction(action) {
    console.log(`[ADMIN] Szybka akcja: ${action}`);
    
    // Dodaj log rozpoczęcia
    addAdminLog(`Rozpoczynam akcję: ${action}`, 'warning');
    
    switch(action) {
        case 'clear-cache':
            // Wyczyść localStorage
            localStorage.clear();
            sessionStorage.clear();
            addAdminLog('Cache przeglądarki wyczyszczony', 'success');
            alert('Cache przeglądarki został wyczyszczony.');
            break;
            
        case 'recalculate-stats':
            // Przelicz statystyki systemu
            await loadSystemStats();
            addAdminLog('Statystyki systemu przeliczone', 'success');
            alert('Statystyki systemu zostały przeliczone.');
            break;
            
        case 'fix-players':
            // Napraw brakujące dane graczy
            await fixPlayersData();
            break;
            
        case 'check-db':
            // Sprawdź połączenie z bazą
            await checkDatabaseConnection();
            break;
            
        case 'refresh-stats':
            // Odśwież statystyki
            await loadSystemStats();
            addAdminLog('Statystyki odświeżone', 'success');
            break;
            
        default:
            addAdminLog(`Nieznana akcja: ${action}`, 'error');
            break;
    }
}

/**
 * Naprawia brakujące dane graczy
 */
async function fixPlayersData() {
    addAdminLog('Rozpoczynam naprawę danych graczy...', 'warning');
    
    try {
        // Znajdź graczy z brakującymi pensjami
        const { data: players, error } = await supabaseClient
            .from('players')
            .select('id, salary, rating')
            .or('salary.is.null,salary.lte.0');
            
        if (error) throw error;
        
        if (!players || players.length === 0) {
            addAdminLog('Nie znaleziono graczy do naprawy', 'success');
            alert('Wszyscy gracze mają poprawne dane.');
            return;
        }
        
        // Ustaw domyślne pensje w oparciu o rating
        const updates = players.map(player => ({
            id: player.id,
            salary: player.rating ? Math.round(player.rating * 10000) : 50000,
            last_salary_update: new Date().toISOString()
        }));
        
        const { data, error: updateError } = await supabaseClient
            .from('players')
            .upsert(updates, { onConflict: 'id' });
            
        if (updateError) throw updateError;
        
        addAdminLog(`Naprawiono ${updates.length} graczy z brakującymi pensjami`, 'success');
        alert(`Naprawiono dane ${updates.length} graczy.`);
        
        await loadSystemStats();
        
    } catch (error) {
        addAdminLog(`Błąd naprawy graczy: ${error.message}`, 'error');
        alert(`❌ Błąd: ${error.message}`);
    }
}

/**
 * Sprawdza połączenie z bazą danych
 */
async function checkDatabaseConnection() {
    addAdminLog('Sprawdzanie połączenia z bazą danych...', 'info');
    
    try {
        const { data, error } = await supabaseClient
            .from('players')
            .select('id', { count: 'exact', head: true });
            
        if (error) throw error;
        
        addAdminLog('Połączenie z bazą danych: AKTYWNE ✅', 'success');
        alert('Połączenie z bazą danych jest aktywne.');
        
    } catch (error) {
        addAdminLog(`Błąd połączenia z bazą: ${error.message}`, 'error');
        alert(`❌ Błąd połączenia: ${error.message}`);
    }
}

async function handleUpdateSalaries() {
    addAdminLog('Rozpoczynam aktualizację pensji...', 'warning');
    
    try {
        const result = await adminUpdateSalaries();
        
        const resultDiv = document.getElementById('salary-update-result');
        if (!resultDiv) return;
        
        resultDiv.style.display = 'block';
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; color: #065f46;">
                    <strong>✅ Sukces:</strong> ${result.message || 'Pensje zaktualizowane pomyślnie'}<br>
                    <strong>Zaktualizowano:</strong> ${result.updatedPlayers} graczy<br>
                    <strong>Bez zmian:</strong> ${result.unchangedPlayers} graczy<br>
                    <strong>W sumie:</strong> ${result.totalPlayers} graczy
                </div>
            `;
            addAdminLog(`Zaktualizowano pensje ${result.updatedPlayers} graczy`, 'success');
        } else {
            resultDiv.innerHTML = `
                <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; color: #dc2626;">
                    <strong>❌ Błąd:</strong> ${result.error || 'Nieznany błąd'}
                </div>
            `;
            addAdminLog(`Błąd aktualizacji pensji: ${result.error}`, 'error');
        }
        
        await loadSystemStats();
        
    } catch (error) {
        addAdminLog(`Błąd: ${error.message}`, 'error');
        alert(`Błąd aktualizacji pensji: ${error.message}`);
    }
}

async function handleMarketValueUpdate() {
    addAdminLog('Rozpoczynam aktualizację wartości rynkowych...', 'warning');
    
    try {
        const result = await adminUpdateMarketValues();
        
        const resultDiv = document.getElementById('salary-update-result');
        if (!resultDiv) return;
        
        resultDiv.style.display = 'block';
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div style="background: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; color: #1e40af;">
                    <strong>✅ Sukces:</strong> ${result.message || 'Wartości rynkowe zaktualizowane pomyślnie'}<br>
                    <strong>Zaktualizowano:</strong> ${result.updatedCount} graczy<br>
                    <strong>W sumie:</strong> ${result.totalCount} graczy
                </div>
            `;
            addAdminLog(`Zaktualizowano wartości rynkowe ${result.updatedCount} graczy`, 'success');
        } else {
            resultDiv.innerHTML = `
                <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; color: #dc2626;">
                    <strong>❌ Błąd:</strong> ${result.error || 'Nieznany błąd'}
                </div>
            `;
            addAdminLog(`Błąd aktualizacji wartości: ${result.error}`, 'error');
        }
        
        await loadSystemStats();
        
    } catch (error) {
        addAdminLog(`Błąd: ${error.message}`, 'error');
        alert(`Błąd aktualizacji wartości: ${error.message}`);
    }
}

// ... (reszta funkcji pozostaje bez zmian, tylko używaj supabaseClient zamiast supabase)

function showSimpleAlgorithmModal() {
    const modalHTML = `
        <div class="admin-algorithm-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:500px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>⚙️</span> Algorytmy aktualizacji pensji
                </h3>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:25px;">
                    Wybierz metodę przeliczania pensji.
                </p>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#334155;">
                        Procent zmiany pensji (%)
                    </label>
                    <input type="range" id="percent-change" min="-50" max="200" value="10" step="5" style="width:100%;" 
                           oninput="document.getElementById('percent-value').textContent = this.value + '%'">
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                        <span style="color:#ef4444; font-size:0.8rem;">-50%</span>
                        <span id="percent-value" style="font-weight:bold; color:#3b82f6;">10%</span>
                        <span style="color:#10b981; font-size:0.8rem;">+200%</span>
                    </div>
                </div>
                
                <div style="display:flex; gap:10px; margin-top:25px;">
                    <button id="btn-cancel-algorithm" 
                            style="flex:1; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">
                        ❌ Anuluj
                    </button>
                    <button id="btn-execute-percentage" 
                            style="flex:1; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">
                        ✅ Wykonaj
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.querySelector('.admin-algorithm-modal');
    
    // Anulowanie
    document.getElementById('btn-cancel-algorithm').addEventListener('click', () => {
        modal.remove();
    });
    
    // Wykonanie procentowej zmiany
    document.getElementById('btn-execute-percentage').addEventListener('click', async () => {
        const percent = parseInt(document.getElementById('percent-change').value);
        modal.remove();
        
        if (!confirm(`Czy na pewno chcesz zmienić pensje wszystkich graczy o ${percent}%?`)) {
            return;
        }
        
        addAdminLog(`Rozpoczynam procentową zmianę pensji o ${percent}%...`, 'warning');
        
        try {
            const multiplier = 1 + (percent / 100);
            const { data: players, error } = await supabaseClient
                .from('players')
                .select('id, salary')
                .not('team_id', 'is', null);
                
            if (error) throw error;
            
            const updates = players.map(player => ({
                id: player.id,
                salary: Math.round(player.salary * multiplier),
                last_salary_update: new Date().toISOString()
            }));
            
            const { data, error: updateError } = await supabaseClient
                .from('players')
                .upsert(updates, { onConflict: 'id' });
                
            if (updateError) throw updateError;
            
            const resultDiv = document.getElementById('salary-update-result');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; color: #065f46;">
                        <strong>✅ Sukces:</strong> Zaktualizowano pensje ${updates.length} graczy o ${percent}%<br>
                        <strong>Mnożnik:</strong> ${multiplier.toFixed(2)}x
                    </div>
                `;
                addAdminLog(`Zaktualizowano pensje ${updates.length} graczy o ${percent}%`, 'success');
            }
            
            await loadSystemStats();
            
        } catch (error) {
            addAdminLog(`Błąd procentowej zmiany: ${error.message}`, 'error');
            alert(`❌ Błąd: ${error.message}`);
        }
    });
    
    // Zamknij po kliknięciu na tło
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });
}

// ===== FUNKCJE SYSTEMOWE =====

async function loadSystemStats() {
    try {
        addAdminLog('Ładowanie statystyk systemu...', 'info');
        
        const [playersRes, teamsRes, marketRes, usersRes] = await Promise.all([
            supabaseClient.from('players').select('id, salary', { count: 'exact' }),
            supabaseClient.from('teams').select('id, balance', { count: 'exact' }),
            supabaseClient.from('transfer_market').select('id', { count: 'exact' }).eq('status', 'active'),
            supabaseClient.from('profiles').select('id', { count: 'exact' })
        ]);
        
        const totalSalary = playersRes.data?.reduce((sum, p) => sum + (p.salary || 0), 0) || 0;
        const avgSalary = playersRes.data?.length ? Math.round(totalSalary / playersRes.data.length) : 0;
        const totalBalance = teamsRes.data?.reduce((sum, t) => sum + (t.balance || 0), 0) || 0;
        
        systemStats = {
            totalPlayers: playersRes.count || 0,
            totalTeams: teamsRes.count || 0,
            activeListings: marketRes.count || 0,
            totalUsers: usersRes.count || 0,
            totalSalary: totalSalary,
            avgSalary: avgSalary,
            totalBalance: totalBalance
        };
        
        const statsContainer = document.getElementById('system-stats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 0.8rem; color: #0369a1; font-weight: 600;">Gracze</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #0c4a6e;">${systemStats.totalPlayers}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 0.8rem; color: #15803d; font-weight: 600;">Drużyny</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #166534;">${systemStats.totalTeams}</div>
            </div>
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 0.8rem; color: #d97706; font-weight: 600;">Oferty rynkowe</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #92400e;">${systemStats.activeListings}</div>
            </div>
            <div style="background: #fae8ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 0.8rem; color: #a21caf; font-weight: 600;">Średnia pensja</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #86198f;">$${systemStats.avgSalary.toLocaleString()}</div>
            </div>
        `;
        
        addAdminLog(`Statystyki załadowane: ${systemStats.totalPlayers} graczy, ${systemStats.totalTeams} drużyn`, 'success');
        
    } catch (error) {
        console.error("Błąd ładowania statystyk:", error);
        addAdminLog(`Błąd ładowania statystyk: ${error.message}`, 'error');
    }
}

function addAdminLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logDiv = document.getElementById('admin-console-log');
    
    if (!logDiv) return;
    
    const typeColors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    const color = typeColors[type] || '#64748b';
    const logEntry = `<div style="color: ${color}; margin-bottom: 2px;">[${timestamp}] ${message}</div>`;
    
    logDiv.innerHTML += logEntry;
    adminLogEntries.push({ timestamp, message, type });
    
    logDiv.scrollTop = logDiv.scrollHeight;
}

function clearAdminLog() {
    const logDiv = document.getElementById('admin-console-log');
    if (logDiv) {
        logDiv.innerHTML = '<div>> Log wyczyszczony</div>';
        adminLogEntries = [];
        addAdminLog('Log wyczyszczony', 'info');
    }
}

function exportAdminLog() {
    const logText = adminLogEntries.map(entry => 
        `[${entry.timestamp}] ${entry.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addAdminLog('Log wyeksportowany do pliku', 'success');
}

function injectAdminStyles() {
    if (document.getElementById('admin-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
        .admin-stat-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .admin-stat-card:active {
            transform: translateY(-2px) scale(0.98);
        }
        
        .admin-quick-btn:hover {
            background: #e2e8f0;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        #admin-console-log div {
            padding: 3px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            word-wrap: break-word;
        }
        
        #admin-console-log div:last-child {
            border-bottom: none;
        }
        
        #admin-console-log {
            scrollbar-width: thin;
            scrollbar-color: #4f46e5 #1e1b4b;
        }
        
        #admin-console-log::-webkit-scrollbar {
            width: 8px;
        }
        
        #admin-console-log::-webkit-scrollbar-track {
            background: #1e1b4b;
            border-radius: 4px;
        }
        
        #admin-console-log::-webkit-scrollbar-thumb {
            background-color: #4f46e5;
            border-radius: 4px;
        }
        
        .algorithm-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .admin-modal-overlay {
            animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
}
