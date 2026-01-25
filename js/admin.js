// js/admin.js
import { supabaseClient } from './auth.js';

/**
 * Inicjalizacja Panelu Admina (V 1.1)
 * Dodaje nowoczesny UI oraz system edycji pensji zawodników.
 */
export function initAdminPanel() {
    console.log('[ADMIN] Inicjalizacja nowoczesnego panelu admina v1.1...');
    
    const currentUser = JSON.parse(localStorage.getItem('supabase.auth.token'))?.currentSession?.user;
    const userEmail = currentUser?.email;
    
    // Lista uprawnionych administratorów
    const adminEmails = ['admin@ebl.online.alex', 'strubbe23@gmail.com'];
    
    if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
        setupAdminUI();
        injectAdminStyles();
    }
}

/**
 * Tworzy strukturę interfejsu Admina
 */
function setupAdminUI() {
    const mainContainer = document.getElementById('app-main-view');
    if (!mainContainer) return;

    mainContainer.innerHTML = `
        <div class="admin-dashboard">
            <header class="admin-header">
                <h1>🔧 Elite Control Center</h1>
                <div class="admin-stats">
                    <div class="stat-pill">System Status: <span class="status-online">Online</span></div>
                </div>
            </header>

            <div class="admin-grid">
                <section class="admin-card">
                    <h3>Zarządzanie Zawodnikami</h3>
                    <p>Wyszukaj zawodnika, aby ręcznie dostosować jego parametry finansowe.</p>
                    <div class="search-bar">
                        <input type="text" id="player-search" placeholder="Imię lub nazwisko zawodnika...">
                        <button id="search-btn" class="btn-primary">Szukaj</button>
                    </div>
                    <div id="admin-player-results" class="player-list-mini">
                        <!-- Wyniki wyszukiwania -->
                    </div>
                </section>

                <section class="admin-card">
                    <h3>Szybkie Akcje Systemowe</h3>
                    <div class="action-buttons">
                        <button class="btn-outline" onclick="window.adminUpdateSalaries()">🔄 Przelicz wszystkie pensje</button>
                        <button class="btn-outline">📊 Generuj raport finansowy</button>
                    </div>
                </section>
            </div>
        </div>
        <div id="admin-modal-container"></div>
    `;

    document.getElementById('search-btn').addEventListener('click', searchPlayers);
}

/**
 * Wyszukiwanie zawodników w bazie
 */
async function searchPlayers() {
    const query = document.getElementById('player-search').value;
    if (query.length < 3) return;

    const { data, error } = await supabaseClient
        .from('players')
        .select('id, player_name, salary, position')
        .ilike('player_name', `%${query}%`)
        .limit(5);

    if (error) {
        console.error("Błąd wyszukiwania:", error);
        return;
    }

    const resultsContainer = document.getElementById('admin-player-results');
    resultsContainer.innerHTML = data.map(player => `
        <div class="player-mini-row">
            <span>${player.player_name} (${player.position})</span>
            <div class="row-actions">
                <span class="current-salary">$${player.salary.toLocaleString()}</span>
                <button class="btn-edit-salary" onclick="window.openSalaryEditor('${player.id}')">Edytuj Pensję</button>
            </div>
        </div>
    `).join('');
}

/**
 * Otwiera popup edycji pensji (Zgodnie z UX - suwaki)
 */
window.openSalaryEditor = async function(playerId) {
    const { data: player, error } = await supabaseClient
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    if (error) return;

    const modalContainer = document.getElementById('admin-modal-container');
    
    // Domyślne wartości suwaków (jeśli nie ma w bazie, ustawiamy bazowe)
    const mods = player.salary_modifiers || { base: 50000, pot: 1.0, exp: 1.0, loy: 1.0 };

    modalContainer.innerHTML = `
        <div class="admin-modal-overlay">
            <div class="admin-modal-content">
                <div class="modal-header">
                    <h2>Edytor Pensji: ${player.player_name}</h2>
                    <button class="close-modal" onclick="document.getElementById('admin-modal-container').innerHTML=''">×</button>
                </div>
                <div class="modal-body">
                    <div class="salary-preview">
                        <span class="label">Przewidywana Pensja:</span>
                        <span id="calculated-salary-val" class="value">$${player.salary.toLocaleString()}</span>
                    </div>

                    <div class="slider-group">
                        <label>Podstawa Kontraktu ($)</label>
                        <input type="range" id="mod-base" min="10000" max="500000" step="5000" value="${mods.base}">
                        <span class="slider-val" id="val-base">$${Number(mods.base).toLocaleString()}</span>
                    </div>

                    <div class="slider-group">
                        <label>Modyfikator Potencjału (x)</label>
                        <input type="range" id="mod-pot" min="0.5" max="3.0" step="0.1" value="${mods.pot}">
                        <span class="slider-val" id="val-pot">${mods.pot}x</span>
                    </div>

                    <div class="slider-group">
                        <label>Premia za Doświadczenie (x)</label>
                        <input type="range" id="mod-exp" min="1.0" max="2.0" step="0.05" value="${mods.exp}">
                        <span class="slider-val" id="val-exp">${mods.exp}x</span>
                    </div>

                    <div class="slider-group">
                        <label>Modyfikator Lojalności (x)</label>
                        <input type="range" id="mod-loy" min="0.8" max="1.5" step="0.05" value="${mods.loy}">
                        <span class="slider-val" id="val-loy">${mods.loy}x</span>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-save" onclick="window.saveSalary('${player.id}')">Zapisz i Przelicz</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Nasłuchiwanie zmian na suwakach
    const sliders = ['mod-base', 'mod-pot', 'mod-exp', 'mod-loy'];
    sliders.forEach(id => {
        document.getElementById(id).addEventListener('input', () => updateSalaryPreview());
    });
}

function updateSalaryPreview() {
    const base = parseInt(document.getElementById('mod-base').value);
    const pot = parseFloat(document.getElementById('mod-pot').value);
    const exp = parseFloat(document.getElementById('mod-exp').value);
    const loy = parseFloat(document.getElementById('mod-loy').value);

    // Wyświetlanie wartości obok suwaków
    document.getElementById('val-base').innerText = `$${base.toLocaleString()}`;
    document.getElementById('val-pot').innerText = `${pot.toFixed(1)}x`;
    document.getElementById('val-exp').innerText = `${exp.toFixed(2)}x`;
    document.getElementById('val-loy').innerText = `${loy.toFixed(2)}x`;

    // Prosty wzór obliczeniowy
    const total = Math.round(base * pot * exp * loy);
    document.getElementById('calculated-salary-val').innerText = `$${total.toLocaleString()}`;
}

/**
 * Zapis do bazy danych
 */
window.saveSalary = async function(playerId) {
    const base = parseInt(document.getElementById('mod-base').value);
    const pot = parseFloat(document.getElementById('mod-pot').value);
    const exp = parseFloat(document.getElementById('mod-exp').value);
    const loy = parseFloat(document.getElementById('mod-loy').value);
    const finalSalary = Math.round(base * pot * exp * loy);

    const { error } = await supabaseClient
        .from('players')
        .update({ 
            salary: finalSalary,
            salary_modifiers: { base, pot, exp, loy }
        })
        .eq('id', playerId);

    if (error) {
        alert("Błąd zapisu: " + error.message);
    } else {
        alert("Pensja zaktualizowana pomyślnie!");
        document.getElementById('admin-modal-container').innerHTML = '';
        searchPlayers(); // Odśwież listę
    }
}

/**
 * Style CSS dla panelu Admina i Popupów
 */
function injectAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .admin-dashboard { padding: 40px; background: #0f172a; color: white; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
        .admin-header h1 { color: var(--nba-orange); font-size: 2rem; margin: 0; }
        
        .admin-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
        .admin-card { background: #1e293b; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .admin-card h3 { margin-top: 0; color: #94a3b8; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        
        .search-bar { display: flex; gap: 10px; margin: 20px 0; }
        .search-bar input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; }
        .btn-primary { background: var(--nba-orange); border: none; padding: 12px 25px; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; }
        
        .player-mini-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #334155; }
        .btn-edit-salary { background: #3b82f6; border: none; padding: 6px 12px; border-radius: 4px; color: white; cursor: pointer; font-size: 0.8rem; }
        .current-salary { color: #10b981; font-weight: bold; margin-right: 15px; }

        /* MODAL */
        .admin-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index: 10000; }
        .admin-modal-content { background: #1e293b; width: 500px; border-radius: 16px; padding: 30px; border: 1px solid #334155; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .close-modal { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        .salary-preview { background: #0f172a; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; border: 2px solid var(--nba-orange); }
        .salary-preview .value { display: block; font-size: 2rem; font-weight: 800; color: var(--nba-orange); }

        .slider-group { margin-bottom: 20px; }
        .slider-group label { display: block; color: #94a3b8; margin-bottom: 8px; font-size: 0.9rem; }
        .slider-group input[type="range"] { width: 100%; height: 6px; background: #334155; border-radius: 3px; -webkit-appearance: none; }
        .slider-group input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--nba-orange); border-radius: 50%; cursor: pointer; }
        .slider-val { display: block; text-align: right; color: white; font-weight: bold; margin-top: 5px; }

        .btn-save { width: 100%; padding: 15px; background: #10b981; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; font-size: 1.1rem; }
    `;
    document.head.appendChild(style);
}
