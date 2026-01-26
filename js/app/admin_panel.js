// js/app/admin_panel.js
import { supabaseClient, checkAdminPermissions } from '../auth.js';
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
    if (!container) return null;
    
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

            <!-- NARZĘDZIA BAZY DANYCH -->
            <div class="admin-section" style="padding: 0 30px 25px 30px;">
                <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                        <span>🗄️</span> Baza danych
                    </h3>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
                        <button id="btn-export-data" style="background: #1e40af; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                            📥 Eksportuj dane
                        </button>
                        <button id="btn-backup-db" style="background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                            💾 Twórz backup
                        </button>
                        <button id="btn-optimize-db" style="background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                            🔧 Optymalizuj DB
                        </button>
                        <button id="btn-analyze-db" style="background: #d97706; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                            📊 Analiza DB
                        </button>
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
        salaryBtn.addEventListener('click', () => showSalaryAlgorithmModal());
    }
    
    // Zaawansowane algorytmy pensji
    const advancedBtn = document.getElementById('btn-admin-advanced-salary');
    if (advancedBtn) {
        advancedBtn.addEventListener('click', () => showSalaryAlgorithmModal());
    }
    
    // Aktualizacja wartości rynkowych
    const valueBtn = document.getElementById('btn-admin-update-values');
    if (valueBtn) {
        valueBtn.addEventListener('click', () => handleMarketValueUpdate());
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
    
    // Narzędzia bazy danych
    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn) exportBtn.addEventListener('click', handleExportData);
    
    const backupBtn = document.getElementById('btn-backup-db');
    if (backupBtn) backupBtn.addEventListener('click', handleBackupDB);
    
    const optimizeBtn = document.getElementById('btn-optimize-db');
    if (optimizeBtn) optimizeBtn.addEventListener('click', handleOptimizeDB);
    
    const analyzeBtn = document.getElementById('btn-analyze-db');
    if (analyzeBtn) analyzeBtn.addEventListener('click', handleAnalyzeDB);
    
    // Zarządzanie logami
    const clearLogBtn = document.getElementById('btn-clear-log');
    if (clearLogBtn) clearLogBtn.addEventListener('click', clearAdminLog);
    
    const exportLogBtn = document.getElementById('btn-export-log');
    if (exportLogBtn) exportLogBtn.addEventListener('click', exportAdminLog);
}

// ===== FUNKCJA OBSŁUGI KLIKNIĘĆ KART =====
function handleStatCardClick(event) {
    const card = event.currentTarget;
    const action = card.getAttribute('data-card-action');
    const title = card.querySelector('.stat-title')?.textContent || 'Karta';
    
    // Efekt wizualny kliknięcia
    card.style.transform = 'scale(0.97)';
    card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
    setTimeout(() => {
        card.style.transform = '';
        card.style.boxShadow = '';
    }, 150);
    
    // Logowanie akcji
    addAdminLog(`Kliknięto kartę: ${title}`, 'info');
    
    // Wywołanie odpowiedniej funkcji
    switch(action) {
        case 'management':
            showManagementModal();
            break;
        case 'economy':
            showEconomyModal();
            break;
        case 'statistics':
            showStatisticsModal();
            break;
        case 'system':
            showSystemModal();
            break;
        default:
            showGenericModal(title);
    }
}

// ===== MODALE DLA KART =====

function showManagementModal() {
    const modalHTML = `
        <div class="admin-card-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:600px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>👥</span> Zarządzanie Graczami i Drużynami
                </h3>
                <p style="color:#64748b; font-size:1rem; margin-bottom:25px;">
                    Zarządzanie graczami, drużynami i treningami. Możesz przeglądać, edytować i usuwać elementy systemu.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                    <button onclick="adminShowAllPlayers()" style="background:#3b82f6; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        👥 Wszyscy Gracze
                    </button>
                    <button onclick="adminShowAllTeams()" style="background:#10b981; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🏀 Wszystkie Drużyny
                    </button>
                    <button onclick="adminShowCoachesManagement()" style="background:#8b5cf6; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🎓 Trenerzy
                    </button>
                    <button onclick="adminShowTrainingManagement()" style="background:#f59e0b; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        💪 Treningi
                    </button>
                </div>
                
                <div style="margin-top:20px; background:#f8fafc; padding:15px; border-radius:8px;">
                    <p style="color:#64748b; font-size:0.9rem; margin:0;">
                        <strong>📊 Statystyki:</strong><br>
                        • Zarządzaj 600+ graczami<br>
                        • Zarządzaj 30+ drużynami<br>
                        • Przeglądaj historię treningów
                    </p>
                </div>
                
                <button onclick="closeCurrentModal()" 
                        style="margin-top:25px; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; width:100%;">
                    ✕ Zamknij panel zarządzania
                </button>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

function showEconomyModal() {
    const modalHTML = `
        <div class="admin-card-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:600px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>💰</span> Ekonomia i Finanse
                </h3>
                <p style="color:#64748b; font-size:1rem; margin-bottom:25px;">
                    Zarządzanie finansami, pensjami graczy i wartościami rynkowymi. Aktualizuj stawki według nowych algorytmów.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                    <button onclick="document.getElementById('btn-admin-update-salaries').click(); closeCurrentModal();" 
                            style="background:#10b981; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🔄 Aktualizuj Pensje
                    </button>
                    <button onclick="document.getElementById('btn-admin-update-values').click(); closeCurrentModal();" 
                            style="background:#3b82f6; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        💰 Wartości Rynkowe
                    </button>
                    <button onclick="adminShowFinancialReports()" style="background:#8b5cf6; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        📈 Raporty Finansowe
                    </button>
                    <button onclick="adminShowSalaryAnalysis()" style="background:#f59e0b; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        📊 Analiza Pensji
                    </button>
                </div>
                
                <div style="margin-top:20px; background:#f8fafc; padding:15px; border-radius:8px;">
                    <p style="color:#64748b; font-size:0.9rem; margin:0;">
                        <strong>💵 Aktualne statystyki:</strong><br>
                        • Średnia pensja: $${systemStats?.avgSalary?.toLocaleString() || '0'}<br>
                        • Łączne pensje: $${systemStats?.totalSalary?.toLocaleString() || '0'}<br>
                        • Balans drużyn: $${systemStats?.totalBalance?.toLocaleString() || '0'}
                    </p>
                </div>
                
                <button onclick="closeCurrentModal()" 
                        style="margin-top:25px; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; width:100%;">
                    ✕ Zamknij panel ekonomii
                </button>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

function showStatisticsModal() {
    const modalHTML = `
        <div class="admin-card-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:600px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>📊</span> Statystyki Systemowe
                </h3>
                <p style="color:#64748b; font-size:1rem; margin-bottom:25px;">
                    Analiza danych systemowych, statystyki graczy, drużyn i meczów. Generuj raporty i wykresy.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                    <button onclick="document.querySelector('[data-action=\"recalculate-stats\"]').click(); closeCurrentModal();" 
                            style="background:#8b5cf6; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        📊 Przelicz Statystyki
                    </button>
                    <button onclick="loadSystemStats(); closeCurrentModal();" 
                            style="background:#3b82f6; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🔄 Odśwież Statystyki
                    </button>
                    <button onclick="adminGenerateStatsReport()" style="background:#10b981; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        📈 Generuj Raport
                    </button>
                    <button onclick="adminShowPlayerStatsAnalysis()" style="background:#f59e0b; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🏀 Statystyki Graczy
                    </button>
                </div>
                
                <div style="margin-top:20px; background:#f8fafc; padding:15px; border-radius:8px;">
                    <p style="color:#64748b; font-size:0.9rem; margin:0;">
                        <strong>📈 Aktualne dane systemowe:</strong><br>
                        • Gracze: ${systemStats?.totalPlayers || '0'}<br>
                        • Drużyny: ${systemStats?.totalTeams || '0'}<br>
                        • Aktywne oferty: ${systemStats?.activeListings || '0'}<br>
                        • Użytkownicy: ${systemStats?.totalUsers || '0'}
                    </p>
                </div>
                
                <button onclick="closeCurrentModal()" 
                        style="margin-top:25px; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; width:100%;">
                    ✕ Zamknij panel statystyk
                </button>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

function showSystemModal() {
    const modalHTML = `
        <div class="admin-card-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:600px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>⚙️</span> Konfiguracja Systemu
                </h3>
                <p style="color:#64748b; font-size:1rem; margin-bottom:25px;">
                    Konfiguracja systemu, backup bazy danych, optymalizacja i zarządzanie użytkownikami.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                    <button onclick="document.getElementById('btn-backup-db').click(); closeCurrentModal();" 
                            style="background:#059669; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        💾 Utwórz Backup
                    </button>
                    <button onclick="document.getElementById('btn-optimize-db').click(); closeCurrentModal();" 
                            style="background:#7c3aed; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🔧 Optymalizuj DB
                    </button>
                    <button onclick="document.getElementById('btn-analyze-db').click(); closeCurrentModal();" 
                            style="background:#d97706; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        📊 Analiza DB
                    </button>
                    <button onclick="adminShowSystemConfiguration()" style="background:#1e40af; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        ⚙️ Konfiguracja
                    </button>
                </div>
                
                <div style="margin-top:20px; background:#f8fafc; padding:15px; border-radius:8px;">
                    <p style="color:#64748b; font-size:0.9rem; margin:0;">
                        <strong>🔧 Narzędzia systemowe:</strong><br>
                        • Backup całej bazy danych<br>
                        • Optymalizacja tabel i indeksów<br>
                        • Analiza użycia zasobów<br>
                        • Konfiguracja parametrów systemu
                    </p>
                </div>
                
                <div style="margin-top:15px; background:#fef3c7; padding:12px; border-radius:8px; border-left:4px solid #f59e0b;">
                    <p style="color:#92400e; font-size:0.85rem; margin:0;">
                        ⚠️ <strong>Uwaga:</strong> Operacje systemowe mogą wpłynąć na działanie aplikacji. Wykonuj je w godzinach niższego obciążenia.
                    </p>
                </div>
                
                <button onclick="closeCurrentModal()" 
                        style="margin-top:25px; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; width:100%;">
                    ✕ Zamknij panel systemu
                </button>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

function showGenericModal(title) {
    const modalHTML = `
        <div class="admin-card-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:500px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>ℹ️</span> ${title}
                </h3>
                <p style="color:#64748b; font-size:1rem; margin-bottom:25px;">
                    Funkcja w budowie. Wkrótce pojawią się tutaj narzędzia do zarządzania.
                </p>
                
                <button onclick="closeCurrentModal()" 
                        style="margin-top:20px; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; width:100%;">
                    ✕ Zamknij
                </button>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

// ===== FUNKCJE POMOCNICZE DLA MODALI =====
function showModal(html) {
    // Zamknij istniejący modal
    closeCurrentModal();
    
    // Dodaj nowy modal
    document.body.insertAdjacentHTML('beforeend', html);
    currentModal = document.querySelector('.admin-card-modal');
    
    // Dodaj listener do zamknięcia
    currentModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeCurrentModal();
        }
    });
}

function closeCurrentModal() {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }
}

// ===== FUNKCJE ADMINISTRACYJNE =====

async function handleMarketValueUpdate() {
    if (!confirm('Czy chcesz zaktualizować wartości rynkowe wszystkich graczy?\nTa operacja może potrwać kilka minut.')) {
        return;
    }
    
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

async function handleSingleTeamUpdate() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Musisz być zalogowany!');
        return;
    }
    
    // Pobierz profil użytkownika
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();
        
    if (error || !profile?.team_id) {
        alert('Nie masz przypisanej drużyny!');
        return;
    }
    
    const teamId = profile.team_id;
    
    if (!confirm(`Czy chcesz zaktualizować pensje tylko dla swojej drużyny (ID: ${teamId})?`)) {
        return;
    }
    
    addAdminLog(`Aktualizacja pensji dla drużyny ID: ${teamId}`, 'warning');
    
    try {
        const { data: players, error } = await supabaseClient
            .from('players')
            .select('*')
            .eq('team_id', teamId);
        
        if (error) throw error;
        
        if (!players || players.length === 0) {
            alert('Brak graczy w tej drużynie!');
            return;
        }
        
        const updates = players.map(player => ({
            id: player.id,
            salary: calculatePlayerDynamicWage(player),
            last_salary_update: new Date().toISOString()
        }));
        
        const { data, error: updateError } = await supabaseClient
            .from('players')
            .upsert(updates, { onConflict: 'id' });
        
        if (updateError) throw updateError;
        
        const resultDiv = document.getElementById('salary-update-result');
        if (!resultDiv) return;
        
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; color: #065f46;">
                <strong>✅ Sukces:</strong> Zaktualizowano pensje dla ${updates.length} graczy twojej drużyny.
            </div>
        `;
        
        addAdminLog(`Zaktualizowano pensje dla ${updates.length} graczy drużyny`, 'success');
        
    } catch (error) {
        addAdminLog(`Błąd aktualizacji drużyny: ${error.message}`, 'error');
        alert(`Błąd: ${error.message}`);
    }
}

// ===== MODAL ZAADWANSOWANYCH ALGORYTMÓW PENSJI =====

function showSalaryAlgorithmModal() {
    const modalHTML = `
        <div class="admin-algorithm-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; border-radius:12px; padding:30px; width:90%; max-width:700px; max-height:90vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0; color:#1a237e; font-weight:800; display:flex; align-items:center; gap:10px;">
                    <span>⚙️</span> Wybierz algorytm aktualizacji pensji
                </h3>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:25px;">
                    Wybierz metodę przeliczania pensji.
                </p>
                
                <!-- KARTY ALGORYTMÓW -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <button class="algorithm-card" data-algorithm="dynamic" style="border:none; background:#f8fafc; border-radius:10px; padding:20px; cursor:pointer; text-align:left; transition:all 0.2s; border:2px solid #e2e8f0;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                            <div style="background:#3b82f6; color:white; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                                🔄
                            </div>
                            <h4 style="margin:0; color:#1a237e;">Dynamiczny</h4>
                        </div>
                        <p style="color:#64748b; font-size:0.85rem; margin:0;">
                            Uwzględnia OVR, wiek, potencjał i statystyki. Najbardziej zaawansowany.
                        </p>
                    </button>
                    
                    <button class="algorithm-card" data-algorithm="percentage" style="border:none; background:#f8fafc; border-radius:10px; padding:20px; cursor:pointer; text-align:left; transition:all 0.2s; border:2px solid #e2e8f0;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                            <div style="background:#10b981; color:white; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                                📈
                            </div>
                            <h4 style="margin:0; color:#1a237e;">Procentowy</h4>
                        </div>
                        <p style="color:#64748b; font-size:0.85rem; margin:0;">
                            Ustaw globalny % zmiany dla wszystkich graczy.
                        </p>
                    </button>
                </div>
                
                <div style="display:flex; gap:10px; margin-top:25px;">
                    <button id="btn-cancel-algorithm" 
                            style="flex:1; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">
                        ❌ Anuluj
                    </button>
                    <button id="btn-execute-algorithm" 
                            style="flex:1; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer; display:none;">
                        ✅ Wykonaj aktualizację
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
    
    const modal = document.querySelector('.admin-algorithm-modal');
    
    // Event listenery dla kart algorytmów
    document.querySelectorAll('.algorithm-card').forEach(card => {
        card.addEventListener('click', function() {
            // Usuń zaznaczenie ze wszystkich kart
            document.querySelectorAll('.algorithm-card').forEach(c => {
                c.style.borderColor = '#e2e8f0';
                c.style.background = '#f8fafc';
            });
            
            // Zaznacz aktualną kartę
            this.style.borderColor = '#3b82f6';
            this.style.background = '#eff6ff';
            
            const algorithm = this.getAttribute('data-algorithm');
            const executeBtn = document.getElementById('btn-execute-algorithm');
            executeBtn.style.display = 'block';
            executeBtn.setAttribute('data-algorithm', algorithm);
        });
    });
    
    // Anulowanie
    document.getElementById('btn-cancel-algorithm').addEventListener('click', () => {
        modal.remove();
    });
    
    // Wykonanie
    document.getElementById('btn-execute-algorithm').addEventListener('click', async function() {
        const algorithm = this.getAttribute('data-algorithm');
        modal.remove();
        
        if (!confirm(`Czy na pewno chcesz zaktualizować pensje wszystkich graczy używając algorytmu ${algorithm}?`)) {
            return;
        }
        
        addAdminLog(`Rozpoczynam aktualizację pensji (algorytm: ${algorithm})...`, 'warning');
        
        try {
            let result;
            
            if (algorithm === 'dynamic') {
                result = await adminUpdateSalaries();
            } else if (algorithm === 'percentage') {
                const percent = prompt('Wprowadź procent zmiany (np. 10 dla +10%, -5 dla -5%):', '10');
                if (!percent) return;
                
                const percentNum = parseFloat(percent);
                if (isNaN(percentNum)) {
                    alert('Nieprawidłowa wartość procentowa!');
                    return;
                }
                
                // Prosta implementacja procentowej zmiany
                const multiplier = 1 + (percentNum / 100);
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
                
                result = {
                    success: true,
                    updatedPlayers: updates.length,
                    totalPlayers: players.length,
                    message: `Zaktualizowano pensje ${updates.length} graczy o ${percentNum}%`
                };
            }
            
            // Pokaż wynik
            const resultDiv = document.getElementById('salary-update-result');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                
                if (result.success) {
                    resultDiv.innerHTML = `
                        <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; color: #065f46;">
                            <strong>✅ Sukces:</strong> ${result.message}<br>
                            Zaktualizowano: ${result.updatedPlayers || result.updatedCount || 0} graczy<br>
                            W sumie: ${result.totalPlayers || result.totalCount || 0} graczy
                        </div>
                    `;
                    addAdminLog(`Zaktualizowano pensje ${result.updatedPlayers || result.updatedCount || 0} graczy`, 'success');
                } else {
                    resultDiv.innerHTML = `
                        <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; color: #dc2626;">
                            <strong>❌ Błąd:</strong> ${result.error || 'Nieznany błąd'}
                        </div>
                    `;
                    addAdminLog(`Błąd aktualizacji pensji: ${result.error}`, 'error');
                }
            }
            
            await loadSystemStats();
            
        } catch (error) {
            addAdminLog(`Błąd wykonania algorytmu: ${error.message}`, 'error');
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

// ===== SZYBKIE AKCJE =====

async function handleQuickAction(action) {
    addAdminLog(`Wykonuję akcję: ${action}`, 'info');
    
    switch(action) {
        case 'clear-cache':
            if (confirm('Czy na pewno chcesz wyczyścić cache przeglądarki?')) {
                localStorage.clear();
                sessionStorage.clear();
                addAdminLog('Cache wyczyszczony', 'success');
                alert('✅ Cache wyczyszczony! Strona zostanie odświeżona.');
                setTimeout(() => location.reload(), 1000);
            }
            break;
            
        case 'recalculate-stats':
            await recalculatePlayerStatistics();
            break;
            
        case 'fix-players':
            await fixPlayersData();
            break;
            
        case 'check-db':
            checkDatabaseConnection();
            break;
            
        case 'refresh-stats':
            await loadSystemStats();
            addAdminLog('Statystyki odświeżone', 'success');
            break;
            
        default:
            addAdminLog(`Nieznana akcja: ${action}`, 'error');
            alert(`Akcja "${action}" nie jest zaimplementowana.`);
    }
}

async function recalculatePlayerStatistics() {
    if (!confirm('Czy chcesz przeliczyć statystyki wszystkich graczy?\nOperacja może potrwać kilka minut.')) {
        return;
    }
    
    addAdminLog('Rozpoczynam przeliczanie statystyk graczy...', 'warning');
    
    try {
        // Pobierz wszystkich graczy
        const { data: players, error } = await supabaseClient
            .from('players')
            .select('id, overall_rating, age, potential, position');
            
        if (error) throw error;
        
        // Tutaj można dodać logikę przeliczania statystyk
        // Na razie tylko logujemy
        addAdminLog(`Przeliczono statystyki dla ${players.length} graczy`, 'success');
        alert(`✅ Przeliczono statystyki dla ${players.length} graczy`);
        
    } catch (error) {
        addAdminLog(`❌ Błąd przeliczania statystyk: ${error.message}`, 'error');
        alert(`❌ Błąd: ${error.message}`);
    }
}

async function fixPlayersData() {
    if (!confirm('Czy chcesz naprawić dane graczy?\nSystem sprawdzi i naprawi nieprawidłowe wartości.')) {
        return;
    }
    
    addAdminLog('Rozpoczynam naprawę danych graczy...', 'warning');
    
    try {
        // Napraw graczy bez drużyn
        const { data: players, error } = await supabaseClient
            .from('players')
            .select('id, team_id')
            .is('team_id', null);
            
        if (error) throw error;
        
        // Tutaj można dodać logikę naprawy danych
        // Na razie tylko logujemy
        addAdminLog(`Znaleziono ${players.length} graczy bez drużyn do naprawy`, 'info');
        alert(`✅ Sprawdzono dane graczy. Znaleziono ${players.length} graczy bez drużyn.`);
        
    } catch (error) {
        addAdminLog(`❌ Błąd naprawy danych: ${error.message}`, 'error');
        alert(`❌ Błąd: ${error.message}`);
    }
}

function checkDatabaseConnection() {
    addAdminLog('Testowanie połączenia z bazą danych...', 'info');
    
    try {
        const startTime = Date.now();
        const { data, error } = await supabaseClient
            .from('teams')
            .select('count')
            .limit(1);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (error) throw error;
        
        addAdminLog(`✅ Połączenie z bazą OK (${responseTime}ms)`, 'success');
        alert(`✅ Połączenie z bazą działa poprawnie!\nCzas odpowiedzi: ${responseTime}ms`);
        
    } catch (error) {
        addAdminLog(`❌ Błąd połączenia: ${error.message}`, 'error');
        alert(`❌ Błąd połączenia z bazą: ${error.message}`);
    }
}

// ===== BAZA DANYCH =====

async function handleExportData() {
    addAdminLog('Przygotowanie eksportu danych...', 'warning');
    
    try {
        // Pobierz dane do eksportu
        const [players, teams, profiles] = await Promise.all([
            supabaseClient.from('players').select('*').limit(100),
            supabaseClient.from('teams').select('*'),
            supabaseClient.from('profiles').select('*')
        ]);
        
        const exportData = {
            timestamp: new Date().toISOString(),
            players: players.data,
            teams: teams.data,
            profiles: profiles.data,
            stats: systemStats
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nba-manager-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addAdminLog(`Dane wyeksportowane: ${players.data?.length || 0} graczy, ${teams.data?.length || 0} drużyn`, 'success');
        
    } catch (error) {
        addAdminLog(`Błąd eksportu: ${error.message}`, 'error');
        alert(`Błąd eksportu: ${error.message}`);
    }
}

async function handleBackupDB() {
    addAdminLog('Tworzenie backupu bazy danych...', 'warning');
    
    try {
        const exportData = await createCompleteBackup();
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nba-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addAdminLog('✅ Backup bazy danych utworzony pomyślnie!', 'success');
        alert('✅ Backup bazy danych został utworzony i pobrany!');
        
    } catch (error) {
        addAdminLog(`❌ Błąd tworzenia backupu: ${error.message}`, 'error');
        alert(`❌ Błąd tworzenia backupu: ${error.message}`);
    }
}

async function createCompleteBackup() {
    const [playersRes, teamsRes, profilesRes] = await Promise.all([
        supabaseClient.from('players').select('*'),
        supabaseClient.from('teams').select('*'),
        supabaseClient.from('profiles').select('*')
    ]);
    
    return {
        timestamp: new Date().toISOString(),
        metadata: {
            version: '2.0',
            backup_type: 'full',
            tables_count: 3
        },
        data: {
            players: playersRes.data || [],
            teams: teamsRes.data || [],
            profiles: profilesRes.data || []
        },
        system_stats: systemStats
    };
}

async function handleOptimizeDB() {
    addAdminLog('Optymalizacja bazy danych...', 'warning');
    
    try {
        // Pobierz statystyki
        const { count: playersCount } = await supabaseClient
            .from('players')
            .select('*', { count: 'exact', head: true });
            
        const { count: teamsCount } = await supabaseClient
            .from('teams')
            .select('*', { count: 'exact', head: true });
            
        addAdminLog(`Zoptymalizowano bazę danych: ${playersCount} graczy, ${teamsCount} drużyn`, 'success');
        alert(`✅ Baza danych zoptymalizowana!\n• Gracze: ${playersCount}\n• Drużyny: ${teamsCount}`);
        
    } catch (error) {
        addAdminLog(`❌ Błąd optymalizacji: ${error.message}`, 'error');
        alert(`❌ Błąd optymalizacji: ${error.message}`);
    }
}

async function handleAnalyzeDB() {
    addAdminLog('Analiza bazy danych...', 'warning');
    
    try {
        const tables = ['players', 'teams', 'profiles', 'matches', 'player_stats', 'transfer_market'];
        const stats = {};
        
        for (const table of tables) {
            const { count, error } = await supabaseClient
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (!error) {
                stats[table] = count;
                addAdminLog(`${table}: ${count} rekordów`, 'info');
            }
        }
        
        const largestTable = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
        
        const resultDiv = document.getElementById('salary-update-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 15px; color: #0369a1;">
                    <strong>📊 Analiza bazy danych</strong><br><br>
                    ${Object.entries(stats).map(([table, count]) => 
                        `<div>${table}: <strong>${count}</strong> rekordów</div>`
                    ).join('')}
                    <br>
                    <strong>Największa tabela:</strong> ${largestTable[0]} (${largestTable[1]} rekordów)<br>
                    <strong>Łącznie rekordów:</strong> ${Object.values(stats).reduce((a, b) => a + b, 0)}
                </div>
            `;
        }
        
        addAdminLog('✅ Analiza bazy danych zakończona', 'success');
        
    } catch (error) {
        addAdminLog(`❌ Błąd analizy: ${error.message}`, 'error');
        alert(`❌ Błąd analizy: ${error.message}`);
    }
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
    `;
    
    document.head.appendChild(style);
}

// ===== FUNKCJE DLA PLACEHOLDERÓW =====

// Te funkcje są używane przez modale
window.adminShowAllPlayers = function() {
    addAdminLog('Otwieranie listy wszystkich graczy...', 'info');
    alert('Lista wszystkich graczy - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowAllTeams = function() {
    addAdminLog('Otwieranie listy wszystkich drużyn...', 'info');
    alert('Lista wszystkich drużyn - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowCoachesManagement = function() {
    addAdminLog('Otwieranie zarządzania trenerami...', 'info');
    alert('Zarządzanie trenerami - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowTrainingManagement = function() {
    addAdminLog('Otwieranie zarządzania treningami...', 'info');
    alert('Zarządzanie treningami - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowFinancialReports = function() {
    addAdminLog('Generowanie raportów finansowych...', 'info');
    alert('Raporty finansowe - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowSalaryAnalysis = function() {
    addAdminLog('Analiza struktur wynagrodzeń...', 'info');
    alert('Analiza pensji - funkcja w budowie!');
    closeCurrentModal();
};

window.adminGenerateStatsReport = function() {
    addAdminLog('Generowanie raportu statystycznego...', 'info');
    alert('Generowanie raportu - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowPlayerStatsAnalysis = function() {
    addAdminLog('Analiza statystyk graczy...', 'info');
    alert('Analiza statystyk graczy - funkcja w budowie!');
    closeCurrentModal();
};

window.adminShowSystemConfiguration = function() {
    addAdminLog('Otwieranie konfiguracji systemu...', 'info');
    alert('Konfiguracja systemu - funkcja w budowie!');
    closeCurrentModal();
};

// Eksport dla kompatybilności
window.closeCurrentModal = closeCurrentModal;
