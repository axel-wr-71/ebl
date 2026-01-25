// js/admin.js

export function initAdminPanel() {
    console.log('[ADMIN] Initializing admin panel...');
    
    // Sprawdź czy użytkownik ma uprawnienia admina
    const currentUser = JSON.parse(localStorage.getItem('supabase.auth.token'))?.currentSession?.user;
    const userEmail = currentUser?.email;
    
    // Lista adminów (tutaj możesz dodać swoje emaile)
    const adminEmails = [
        'admin@ebl.online.alex'
    ];
    
    if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
        console.log('[ADMIN] User is admin:', userEmail);
        addAdminTab();
        setupAdminPanel();
        addAdminStyles(); // Dodajemy style
    } else {
        console.log('[ADMIN] User is NOT admin:', userEmail);
        // Ukryj panel admina jeśli użytkownik nie jest adminem
        const adminTab = document.getElementById('tab-m-admin');
        if (adminTab) {
            adminTab.style.display = 'none';
        }
    }
}

function addAdminTab() {
    // Dodaj zakładkę Admin do nawigacji
    const navContainer = document.getElementById('main-nav-container');
    if (!navContainer) return;
    
    // Sprawdź czy zakładka już istnieje
    if (!document.getElementById('tab-m-admin')) {
        const adminTab = document.createElement('button');
        adminTab.className = 'btn-tab';
        adminTab.id = 'tab-m-admin';
        adminTab.innerHTML = '🔧 Admin';
        adminTab.onclick = () => window.switchTab('m-admin');
        
        // Wstaw przed przyciskiem wylogowania lub na końcu
        navContainer.appendChild(adminTab);
    }
}

function setupAdminPanel() {
    // Funkcja do ładowania zawartości panelu admina
    const adminContent = document.getElementById('admin-stats');
    if (!adminContent) return;
    
    // Pobierz dane użytkowników itp.
    loadAdminData();
}

async function loadAdminData() {
    try {
        const adminContent = document.getElementById('admin-stats');
        if (!adminContent) return;
        
        // Symulacja danych (w prawdziwej aplikacji pobierasz z API)
        const adminData = {
            totalUsers: 1250,
            totalTeams: 980,
            totalPlayers: 650,
            totalTransactions: 5432,
            systemBalance: 12500000,
            activeListings: 47,
            avgSalary: 850000
        };
        
        displayAdminData(adminData);
        setupAdminEventListeners(); // Dodajemy event listeners po wyświetleniu
    } catch (error) {
        console.error('[ADMIN] Error loading data:', error);
        document.getElementById('admin-stats').innerHTML = `
            <div class="admin-error">
                <p style="color: #f44336;">Błąd ładowania danych administracyjnych</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayAdminData(data) {
    const adminContent = document.getElementById('admin-stats');
    if (!adminContent) return;
    
    adminContent.innerHTML = `
        <div class="admin-modern-wrapper">
            <!-- NAGŁÓWEK -->
            <div class="admin-header">
                <div class="header-content">
                    <div>
                        <h1>ADMIN <span style="color:#ff9800">PANEL</span></h1>
                        <p>Narzędzia administracyjne NBA Manager | ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="header-actions">
                        <div class="admin-mode-badge">
                            <span>⚙️</span> ADMIN MODE
                        </div>
                        <button id="btn-refresh-stats" class="btn-admin-secondary">
                            🔄 Odśwież statystyki
                        </button>
                    </div>
                </div>
            </div>

            <!-- KARTY STATYSTYK -->
            <div class="admin-section">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                    <button class="admin-stat-card clickable-card" data-card-action="management" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                        <div class="stat-icon">👥</div>
                        <div class="stat-title">Zarządzanie</div>
                        <div class="stat-subtitle">Gracze i drużyny</div>
                    </button>
                    
                    <button class="admin-stat-card clickable-card" data-card-action="economy" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <div class="stat-icon">💰</div>
                        <div class="stat-title">Ekonomia</div>
                        <div class="stat-subtitle">Pensje i finanse</div>
                    </button>
                    
                    <button class="admin-stat-card clickable-card" data-card-action="statistics" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                        <div class="stat-icon">📊</div>
                        <div class="stat-title">Statystyki</div>
                        <div class="stat-subtitle">Dane systemowe</div>
                    </button>
                    
                    <button class="admin-stat-card clickable-card" data-card-action="system" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                        <div class="stat-icon">⚙️</div>
                        <div class="stat-title">System</div>
                        <div class="stat-subtitle">Konfiguracja</div>
                    </button>
                </div>
            </div>

            <!-- STATYSTYKI SYSTEMU -->
            <div class="admin-section">
                <div class="admin-section-card">
                    <h3><span>📊</span> Statystyki Systemu</h3>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>👥 Użytkownicy</h4>
                            <div class="stat-value">${data?.totalUsers || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>🏀 Drużyny</h4>
                            <div class="stat-value">${data?.totalTeams || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>👤 Gracze</h4>
                            <div class="stat-value">${data?.totalPlayers || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>💰 Transakcje</h4>
                            <div class="stat-value">${data?.totalTransactions || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>💵 Balans Systemu</h4>
                            <div class="stat-value">$${data?.systemBalance?.toLocaleString() || '0'}</div>
                        </div>
                        <div class="stat-card">
                            <h4>📈 Średnia pensja</h4>
                            <div class="stat-value">$${data?.avgSalary?.toLocaleString() || '0'}</div>
                        </div>
                        <div class="stat-card">
                            <h4>🏪 Aktywne oferty</h4>
                            <div class="stat-value">${data?.activeListings || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>⚡ Status systemu</h4>
                            <div class="stat-value">✅ Aktywny</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SEKCJA EKONOMII -->
            <div class="admin-section">
                <div class="admin-section-card">
                    <h3><span>💰</span> Aktualizacja Pensji i Wartości</h3>
                    <p>Uruchom masową aktualizację pensji i wartości rynkowych wszystkich graczy z możliwością konfiguracji parametrów.</p>
                    
                    <div class="action-buttons-grid">
                        <button id="btn-update-salaries" class="btn-admin-success">
                            <span>🔄</span> Zaktualizuj WSZYSTKIE pensje
                        </button>
                        
                        <button id="btn-update-values" class="btn-admin-primary">
                            <span>💰</span> Aktualizuj wartości rynkowe
                        </button>
                        
                        <button id="btn-advanced-salary" class="btn-admin-purple">
                            <span>⚙️</span> Zaawansowane algorytmy
                        </button>
                        
                        <button id="btn-single-team" class="btn-admin-warning">
                            <span>🏀</span> Aktualizuj tylko moją drużynę
                        </button>
                    </div>
                    
                    <div id="salary-update-result" style="margin-top: 20px; display: none;"></div>
                </div>
            </div>

            <!-- SZYBKIE AKCJE -->
            <div class="admin-section">
                <div class="admin-section-card">
                    <h3><span>⚡</span> Szybkie akcje</h3>
                    
                    <div class="quick-actions-grid">
                        <button class="admin-quick-btn" data-action="clear-cache">
                            🗑️ Wyczyść cache
                        </button>
                        <button class="admin-quick-btn" data-action="recalculate-stats">
                            📊 Przelicz statystyki
                        </button>
                        <button class="admin-quick-btn" data-action="fix-players">
                            🏀 Napraw graczy
                        </button>
                        <button class="admin-quick-btn" data-action="check-db">
                            🔍 Sprawdź bazę
                        </button>
                        <button class="admin-quick-btn" data-action="simulate-season">
                            ⚡ Symuluj sezon
                        </button>
                        <button class="admin-quick-btn" data-action="refresh-stats">
                            🔄 Odśwież statystyki
                        </button>
                    </div>
                </div>
            </div>

            <!-- NARZĘDZIA BAZY DANYCH -->
            <div class="admin-section">
                <div class="admin-section-card">
                    <h3><span>🗄️</span> Baza danych</h3>
                    
                    <div class="db-tools">
                        <button id="btn-export-data" class="btn-admin-tool">
                            📥 Eksportuj dane
                        </button>
                        <button id="btn-backup-db" class="btn-admin-tool">
                            💾 Twórz backup
                        </button>
                        <button id="btn-optimize-db" class="btn-admin-tool">
                            🔧 Optymalizuj DB
                        </button>
                        <button id="btn-analyze-db" class="btn-admin-tool">
                            📊 Analiza DB
                        </button>
                    </div>
                </div>
            </div>

            <!-- ZARZĄDZANIE UŻYTKOWNIKAMI -->
            <div class="admin-section">
                <div class="admin-section-card">
                    <h3><span>👥</span> Zarządzanie użytkownikami</h3>
                    
                    <div class="user-management-grid">
                        <button onclick="adminAction('users')" class="btn-admin-success">
                            <span>👤</span> Przeglądaj użytkowników
                        </button>
                        <button onclick="adminAction('reset')" class="btn-admin-danger">
                            <span>🔄</span> Resetuj dane testowe
                        </button>
                        <button onclick="adminAction('backup')" class="btn-admin-primary">
                            <span>💾</span> Utwórz backup
                        </button>
                        <button onclick="adminAction('logs')" class="btn-admin-warning">
                            <span>📋</span> Pokaż logi systemowe
                        </button>
                    </div>
                </div>
            </div>

            <!-- KONSOLA LOGÓW -->
            <div class="admin-section">
                <div class="admin-log">
                    <div class="log-header">
                        <div>KONSOLA ADMINA</div>
                        <div class="log-actions">
                            <button id="btn-clear-log">
                                🗑️ Wyczyść
                            </button>
                            <button id="btn-export-log">
                                📥 Export log
                            </button>
                        </div>
                    </div>
                    <div id="admin-console-log">
                        <div>> System: Panel administracyjny załadowany [${new Date().toLocaleTimeString()}]</div>
                        <div>> System: Inicjalizacja modułów...</div>
                    </div>
                </div>
            </div>

            <!-- STOPKA -->
            <div class="admin-footer">
                <p>© 2024 NBA Manager | Panel Administracyjny v2.0</p>
                <p>Ostatnie odświeżenie: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
}

// Event Listeners dla panelu admina
function setupAdminEventListeners() {
    console.log('[ADMIN] Setting up event listeners...');
    
    // Klikalne karty statystyk
    document.querySelectorAll('.admin-stat-card.clickable-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.getAttribute('data-card-action');
            handleStatCardClick(action);
        });
    });
    
    // Przyciski ekonomii
    document.getElementById('btn-update-salaries')?.addEventListener('click', () => {
        showSalaryAlgorithmModal();
    });
    
    document.getElementById('btn-update-values')?.addEventListener('click', () => {
        adminAction('update-market-values');
    });
    
    document.getElementById('btn-advanced-salary')?.addEventListener('click', () => {
        showAdvancedSalaryModal();
    });
    
    document.getElementById('btn-single-team')?.addEventListener('click', () => {
        adminAction('single-team-update');
    });
    
    // Szybkie akcje
    document.querySelectorAll('.admin-quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Narzędzia bazy danych
    document.getElementById('btn-export-data')?.addEventListener('click', () => {
        adminAction('export-data');
    });
    
    document.getElementById('btn-backup-db')?.addEventListener('click', () => {
        adminAction('backup-db');
    });
    
    document.getElementById('btn-optimize-db')?.addEventListener('click', () => {
        adminAction('optimize-db');
    });
    
    document.getElementById('btn-analyze-db')?.addEventListener('click', () => {
        adminAction('analyze-db');
    });
    
    // Logi
    document.getElementById('btn-clear-log')?.addEventListener('click', clearAdminLog);
    document.getElementById('btn-export-log')?.addEventListener('click', exportAdminLog);
    document.getElementById('btn-refresh-stats')?.addEventListener('click', loadAdminData);
}

// Obsługa klikalnych kart
function handleStatCardClick(action) {
    const titles = {
        'management': 'Zarządzanie',
        'economy': 'Ekonomia',
        'statistics': 'Statystyki',
        'system': 'System'
    };
    
    addAdminLog(`Kliknięto kartę: ${titles[action] || action}`, 'info');
    
    // Tutaj można dodać modal lub akcje dla każdej karty
    switch(action) {
        case 'management':
            showManagementModal();
            break;
        case 'economy':
            showEconomyModal();
            break;
        case 'statistics':
            adminAction('statistics');
            break;
        case 'system':
            adminAction('system');
            break;
    }
}

// Modal zarządzania
function showManagementModal() {
    const modalHTML = `
        <div class="admin-modal-overlay">
            <div class="admin-modal">
                <h3><span>👥</span> Zarządzanie Graczami i Drużynami</h3>
                <p>Zarządzanie graczami, drużynami i treningami. Możesz przeglądać, edytować i usuwać elementy systemu.</p>
                
                <div class="modal-actions">
                    <button onclick="adminAction('all-players')" class="btn-modal">
                        👥 Wszyscy Gracze
                    </button>
                    <button onclick="adminAction('all-teams')" class="btn-modal">
                        🏀 Wszystkie Drużyny
                    </button>
                    <button onclick="adminAction('coaches')" class="btn-modal">
                        🎓 Trenerzy
                    </button>
                    <button onclick="adminAction('training')" class="btn-modal">
                        💪 Treningi
                    </button>
                </div>
                
                <button onclick="closeModal()" class="btn-modal-close">
                    ✕ Zamknij
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Modal ekonomii
function showEconomyModal() {
    const modalHTML = `
        <div class="admin-modal-overlay">
            <div class="admin-modal">
                <h3><span>💰</span> Ekonomia i Finanse</h3>
                <p>Zarządzanie finansami, pensjami graczy i wartościami rynkowymi.</p>
                
                <div class="modal-actions">
                    <button onclick="showSalaryAlgorithmModal()" class="btn-modal">
                        🔄 Aktualizuj Pensje
                    </button>
                    <button onclick="adminAction('market-values')" class="btn-modal">
                        💰 Wartości Rynkowe
                    </button>
                    <button onclick="adminAction('financial-reports')" class="btn-modal">
                        📈 Raporty Finansowe
                    </button>
                    <button onclick="adminAction('salary-analysis')" class="btn-modal">
                        📊 Analiza Pensji
                    </button>
                </div>
                
                <button onclick="closeModal()" class="btn-modal-close">
                    ✕ Zamknij
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Zaawansowany modal pensji
function showAdvancedSalaryModal() {
    const modalHTML = `
        <div class="admin-modal-overlay">
            <div class="admin-modal" style="max-width: 600px;">
                <h3><span>⚙️</span> Wybierz algorytm aktualizacji pensji</h3>
                <p>Wybierz metodę przeliczania pensji lub skorzystaj z zaawansowanego edytora.</p>
                
                <div class="algorithm-grid">
                    <button class="algorithm-card" onclick="selectAlgorithm('dynamic')">
                        <div class="algorithm-icon">🔄</div>
                        <h4>Dynamiczny</h4>
                        <p>Uwzględnia OVR, wiek, potencjał i statystyki</p>
                    </button>
                    
                    <button class="algorithm-card" onclick="selectAlgorithm('percentage')">
                        <div class="algorithm-icon">📈</div>
                        <h4>Procentowy</h4>
                        <p>Ustaw globalny % zmiany dla wszystkich graczy</p>
                    </button>
                    
                    <button class="algorithm-card" onclick="selectAlgorithm('positional')">
                        <div class="algorithm-icon">🏀</div>
                        <h4>Pozycyjny</h4>
                        <p>Różne stawki dla różnych pozycji</p>
                    </button>
                    
                    <button class="algorithm-card" onclick="selectAlgorithm('manual')">
                        <div class="algorithm-icon">✏️</div>
                        <h4>Ręczny Editor</h4>
                        <p>Zaawansowany edytor z formułami</p>
                    </button>
                </div>
                
                <div id="algorithm-config" style="display: none; margin-top: 20px;">
                    <div id="config-content"></div>
                    <button onclick="executeAlgorithm()" class="btn-admin-success" style="width: 100%; margin-top: 15px;">
                        🚀 Wykonaj algorytm
                    </button>
                </div>
                
                <button onclick="closeModal()" class="btn-modal-close" style="margin-top: 20px;">
                    ✕ Zamknij
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function selectAlgorithm(algorithm) {
    const configContent = document.getElementById('config-content');
    const configSection = document.getElementById('algorithm-config');
    
    if (!configContent || !configSection) return;
    
    let configHTML = '';
    
    switch(algorithm) {
        case 'dynamic':
            configHTML = `
                <h4>Parametry algorytmu dynamicznego</h4>
                <div class="config-input">
                    <label>Bazowa pensja dla OVR 70:</label>
                    <input type="number" id="base-salary" value="500000" min="100000" max="5000000" step="50000">
                </div>
                <div class="config-input">
                    <label>Mnożnik za każdy OVR powyżej 70:</label>
                    <input type="number" id="ovr-multiplier" value="0.05" min="0.01" max="0.2" step="0.01">
                </div>
            `;
            break;
        case 'percentage':
            configHTML = `
                <h4>Globalna zmiana procentowa</h4>
                <div class="config-input">
                    <label>Procent zmiany pensji:</label>
                    <input type="range" id="percent-change" min="-50" max="200" value="10">
                    <span id="percent-value">10%</span>
                </div>
            `;
            break;
        case 'positional':
            configHTML = `
                <h4>Stawki pozycyjne</h4>
                <div class="config-input">
                    <label>PG - Rozgrywający (%):</label>
                    <input type="number" id="pg-multiplier" value="120" min="50" max="300">
                </div>
                <div class="config-input">
                    <label>SG - Rzucający obrońca (%):</label>
                    <input type="number" id="sg-multiplier" value="110" min="50" max="300">
                </div>
            `;
            break;
    }
    
    configContent.innerHTML = configHTML;
    configSection.style.display = 'block';
    addAdminLog(`Wybrano algorytm: ${algorithm}`, 'info');
}

function executeAlgorithm() {
    addAdminLog('Wykonywanie algorytmu aktualizacji pensji...', 'warning');
    adminAction('execute-salary-algorithm');
    closeModal();
}

// Obsługa szybkich akcji
function handleQuickAction(action) {
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
            adminAction('recalculate-stats');
            break;
            
        case 'fix-players':
            adminAction('fix-players');
            break;
            
        case 'check-db':
            adminAction('check-db');
            break;
            
        case 'simulate-season':
            if (confirm('Czy chcesz zasymulować cały sezon? Operacja może potrwać kilka minut.')) {
                adminAction('simulate-season');
            }
            break;
            
        case 'refresh-stats':
            loadAdminData();
            addAdminLog('Statystyki odświeżone', 'success');
            break;
            
        default:
            addAdminLog(`Nieznana akcja: ${action}`, 'error');
    }
}

// Zarządzanie logami
const adminLogEntries = [];

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
    
    // Scroll do dołu
    logDiv.scrollTop = logDiv.scrollHeight;
}

function clearAdminLog() {
    const logDiv = document.getElementById('admin-console-log');
    if (logDiv) {
        logDiv.innerHTML = '<div>> Log wyczyszczony</div>';
        adminLogEntries.length = 0;
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

// Pomocnicze funkcje modalne
function closeModal() {
    const modal = document.querySelector('.admin-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Funkcje globalne
window.adminAction = function(action) {
    addAdminLog(`Wykonano akcję: ${action}`, 'info');
    
    // Tutaj możesz dodać specyficzne akcje dla różnych przycisków
    switch(action) {
        case 'reset':
            if (confirm('Czy na pewno chcesz zresetować dane testowe? Tej operacji nie można cofnąć.')) {
                alert('Resetowanie danych testowych... (funkcja wymaga implementacji backendu)');
            }
            break;
            
        case 'backup':
            alert('Tworzenie backupu... (funkcja wymaga implementacji backendu)');
            break;
            
        case 'users':
            alert('Zarządzanie użytkownikami... (funkcja wymaga implementacji backendu)');
            break;
            
        default:
            alert(`Akcja administracyjna: ${action}\nTa funkcja wymaga implementacji backendu.`);
    }
};

// Dodawanie stylów
function addAdminStyles() {
    if (document.getElementById('admin-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
        /* Główne style */
        .admin-modern-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .admin-header {
            background: linear-gradient(135deg, #1a237e, #283593);
            color: white;
            padding: 25px 30px;
            border-radius: 12px;
            margin-bottom: 25px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .admin-header h1 {
            margin: 0;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 2rem;
            letter-spacing: 1px;
        }
        
        .admin-header p {
            margin: 10px 0 0 0;
            color: #bbdefb;
            font-size: 0.95rem;
        }
        
        .header-actions {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .admin-mode-badge {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .btn-admin-secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
        }
        
        .admin-section {
            padding: 25px 0;
        }
        
        .admin-section-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .admin-section-card h3 {
            margin-top: 0;
            color: #1a237e;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .admin-section-card p {
            color: #64748b;
            font-size: 0.9rem;
            margin-bottom: 20px;
        }
        
        /* Karty statystyk */
        .admin-stat-card {
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 140px;
            border: none;
        }
        
        .admin-stat-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .stat-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .stat-title {
            font-size: 1.2rem;
            font-weight: 800;
            margin-bottom: 5px;
        }
        
        .stat-subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        /* Grid statystyk */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #3b82f6;
        }
        
        .stat-card h4 {
            margin: 0 0 10px 0;
            color: #64748b;
            font-size: 0.9rem;
            text-transform: uppercase;
        }
        
        .stat-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: #1a237e;
        }
        
        /* Przyciski akcji */
        .action-buttons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .btn-admin-success, .btn-admin-primary, .btn-admin-warning, .btn-admin-purple, .btn-admin-danger {
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s;
        }
        
        .btn-admin-success {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .btn-admin-primary {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        
        .btn-admin-warning {
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .btn-admin-purple {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }
        
        .btn-admin-danger {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .btn-admin-success:hover, .btn-admin-primary:hover, .btn-admin-warning:hover, .btn-admin-purple:hover, .btn-admin-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        /* Szybkie akcje */
        .quick-actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
        }
        
        .admin-quick-btn {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
            text-align: center;
        }
        
        .admin-quick-btn:hover {
            background: #e2e8f0;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        /* Narzędzia DB */
        .db-tools {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn-admin-tool {
            background: #1e40af;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        /* Zarządzanie użytkownikami */
        .user-management-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        /* Konsola logów */
        .admin-log {
            padding: 20px;
            background: #1a237e;
            color: white;
            border-radius: 12px;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
        }
        
        .log-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-weight: 700;
            font-size: 1rem;
        }
        
        .log-actions {
            display: flex;
            gap: 10px;
        }
        
        .log-actions button {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
        }
        
        #admin-console-log {
            height: 200px;
            overflow-y: auto;
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 6px;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        
        #admin-console-log div {
            padding: 3px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Stopka */
        .admin-footer {
            padding: 20px 0;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            margin-top: 20px;
        }
        
        .admin-footer p {
            margin: 5px 0;
            font-size: 0.8rem;
        }
        
        /* Modal */
        .admin-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .admin-modal {
            background: white;
            border-radius: 12px;
            padding: 30px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        
        .modal-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .btn-modal {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-modal-close {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
        }
        
        /* Algorytmy */
        .algorithm-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        
        .algorithm-card {
            border: none;
            background: #f8fafc;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
            border: 2px solid #e2e8f0;
        }
        
        .algorithm-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .algorithm-icon {
            background: #3b82f6;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            margin-bottom: 15px;
        }
        
        .algorithm-card h4 {
            margin: 0;
            color: #1a237e;
        }
        
        .algorithm-card p {
            color: #64748b;
            font-size: 0.85rem;
            margin: 10px 0 0 0;
        }
        
        /* Konfiguracja */
        .config-input {
            margin-bottom: 15px;
        }
        
        .config-input label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #334155;
        }
        
        .config-input input {
            width: 100%;
            padding: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        
        input[type="range"] {
            width: 80%;
            margin-right: 10px;
        }
        
        /* Animacje */
        .admin-section {
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Dodajemy kilka początkowych logów po załadowaniu
setTimeout(() => {
    if (document.getElementById('admin-console-log')) {
        addAdminLog('Panel administracyjny gotowy do użycia', 'success');
        addAdminLog('System monitorowania aktywny', 'info');
    }
}, 1000);
