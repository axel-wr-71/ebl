// js/app/staff_view.js
import { supabaseClient } from '../auth.js';

let currentStaff = [];
let availableStaff = [];
let currentTeam = null;

/**
 * Renderuje widok personelu
 */
export async function renderStaffView(team, players) {
    currentTeam = team;
    const container = document.getElementById('m-staff');
    if (!container) return;

    // Pobierz aktualny personel drużyny
    await fetchTeamStaff(team.id);

    container.innerHTML = `
        <div class="view-header">
            <h1>👥 Personel Drużyny</h1>
            <p>Zarządzaj personelem: trenerami, fizjoterapeutami i dyrektorami sportowymi.</p>
        </div>

        <div class="staff-dashboard">
            <!-- Statystyki personelu -->
            <div class="staff-stats">
                <div class="stat-card">
                    <div class="stat-value">${currentStaff.filter(s => s.role === 'Trener').length}</div>
                    <div class="stat-label">Trenerzy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${currentStaff.filter(s => s.role === 'Fizjoterapeuta').length}</div>
                    <div class="stat-label">Fizjoterapeuci</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${currentStaff.filter(s => s.role === 'Dyrektor sportowy').length}</div>
                    <div class="stat-label">Dyrektorzy sportowi</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${calculateTotalSalary()} $</div>
                    <div class="stat-label">Koszt tygodniowy</div>
                </div>
            </div>

            <!-- Aktualny personel -->
            <div class="current-staff-section">
                <div class="section-header">
                    <h2>Twój Personel</h2>
                    <div class="section-actions">
                        <button id="open-market-btn" class="btn btn-primary">
                            <span class="btn-icon">🛒</span> Rynek Transferowy
                        </button>
                    </div>
                </div>
                
                <div class="staff-roles">
                    <!-- Trenerzy -->
                    <div class="role-section">
                        <h3 class="role-title">🏀 Trenerzy <span class="badge">${currentStaff.filter(s => s.role === 'Trener').length}</span></h3>
                        <div id="coaches-list" class="staff-grid">
                            <!-- Dynamicznie wypełniane -->
                        </div>
                    </div>
                    
                    <!-- Fizjoterapeuci -->
                    <div class="role-section">
                        <h3 class="role-title">💊 Fizjoterapeuci <span class="badge">${currentStaff.filter(s => s.role === 'Fizjoterapeuta').length}</span></h3>
                        <div id="physios-list" class="staff-grid">
                            <!-- Dynamicznie wypełniane -->
                        </div>
                    </div>
                    
                    <!-- Dyrektorzy sportowi -->
                    <div class="role-section">
                        <h3 class="role-title">📊 Dyrektorzy Sportowi <span class="badge">${currentStaff.filter(s => s.role === 'Dyrektor sportowy').length}</span></h3>
                        <div id="directors-list" class="staff-grid">
                            <!-- Dynamicznie wypełniane -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal rynku transferowego -->
        <div id="staff-market-modal" class="modal">
            <div class="modal-content wide-modal">
                <div class="modal-header">
                    <h2>🛒 Rynek Transferowy Personelu</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <!-- Filtry -->
                    <div class="market-filters">
                        <div class="filter-group">
                            <label for="filter-role">Rola:</label>
                            <select id="filter-role" class="form-select">
                                <option value="">Wszyscy</option>
                                <option value="Trener">Trener</option>
                                <option value="Fizjoterapeuta">Fizjoterapeuta</option>
                                <option value="Dyrektor sportowy">Dyrektor sportowy</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-level">Poziom:</label>
                            <select id="filter-level" class="form-select">
                                <option value="">Wszystkie</option>
                                <option value="1">⭐</option>
                                <option value="2">⭐⭐</option>
                                <option value="3">⭐⭐⭐</option>
                                <option value="4">⭐⭐⭐⭐</option>
                                <option value="5">⭐⭐⭐⭐⭐</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-nationality">Narodowość:</label>
                            <select id="filter-nationality" class="form-select">
                                <option value="">Wszystkie</option>
                                <!-- Dynamicznie wypełniane -->
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-salary">Maks. pensja:</label>
                            <input type="number" id="filter-salary" class="form-input" placeholder="np. 10000" min="0">
                        </div>
                        <button id="apply-filters" class="btn btn-secondary">
                            <span class="btn-icon">🔍</span> Filtruj
                        </button>
                    </div>

                    <!-- Lista dostępnego personelu -->
                    <div class="market-list-header">
                        <h3>Dostępny Personel</h3>
                        <div class="team-finances">
                            <span class="budget-label">Budżet drużyny:</span>
                            <span class="budget-value">$${currentTeam?.budget || 0}</span>
                        </div>
                    </div>
                    <div id="market-staff-list" class="market-staff-grid">
                        <!-- Dynamicznie wypełniane -->
                    </div>

                    <!-- Informacje o efektach -->
                    <div class="staff-effects-info">
                        <h4>📈 Efekty Personelu:</h4>
                        <div class="effects-grid">
                            <div class="effect-item">
                                <strong>Trenerzy:</strong> Zwiększają rozwój umiejętności zawodników (+5% do +25% w zależności od poziomu)
                            </div>
                            <div class="effect-item">
                                <strong>Fizjoterapeuci:</strong> Zmniejszają ryzyko kontuzji (-5% do -25%) i skracają czas rekonwalescencji
                            </div>
                            <div class="effect-item">
                                <strong>Dyrektorzy sportowi:</strong> Zwiększają atrakcyjność transferową (-5% do -25% na koszty transferów)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Renderuj aktualny personel
    renderCurrentStaff();

    // Inicjalizacja modalu
    initMarketModal();

    // Dodaj event listener do przycisku
    document.getElementById('open-market-btn').addEventListener('click', () => {
        openMarketModal();
    });
}

/**
 * Pobiera personel drużyny
 */
async function fetchTeamStaff(teamId) {
    try {
        const { data, error } = await supabaseClient
            .from('staff')
            .select('*')
            .eq('team_id', teamId)
            .order('role', { ascending: true })
            .order('level', { ascending: false });

        if (error) throw error;
        currentStaff = data || [];
    } catch (err) {
        console.error("[STAFF] Błąd pobierania personelu:", err);
        currentStaff = [];
    }
}

/**
 * Renderuje listę aktualnego personelu
 */
function renderCurrentStaff() {
    const coachesList = document.getElementById('coaches-list');
    const physiosList = document.getElementById('physios-list');
    const directorsList = document.getElementById('directors-list');

    const coaches = currentStaff.filter(s => s.role === 'Trener');
    const physios = currentStaff.filter(s => s.role === 'Fizjoterapeuta');
    const directors = currentStaff.filter(s => s.role === 'Dyrektor sportowy');

    // Renderuj trenerów
    coachesList.innerHTML = coaches.length > 0 ? coaches.map(staff => renderStaffCard(staff, true)).join('') : 
        '<div class="empty-state">Brak trenerów w drużynie</div>';

    // Renderuj fizjoterapeutów
    physiosList.innerHTML = physios.length > 0 ? physios.map(staff => renderStaffCard(staff, true)).join('') : 
        '<div class="empty-state">Brak fizjoterapeutów w drużynie</div>';

    // Renderuj dyrektorów sportowych
    directorsList.innerHTML = directors.length > 0 ? directors.map(staff => renderStaffCard(staff, true)).join('') : 
        '<div class="empty-state">Brak dyrektorów sportowych w drużynie</div>';
}

/**
 * Renderuje kartę personelu
 */
function renderStaffCard(staff, isCurrent = false) {
    const levelStars = '⭐'.repeat(staff.level);
    const contractInfo = staff.contract_weeks ? 
        `<div class="staff-contract">Kontrakt: ${staff.contract_weeks} tygodni</div>` : '';

    return `
        <div class="staff-card ${isCurrent ? 'current-staff' : 'available-staff'}">
            <div class="staff-card-header">
                <div class="staff-name">
                    <strong>${staff.first_name} ${staff.last_name}</strong>
                    <span class="staff-nationality">${getFlagEmoji(staff.nationality)}</span>
                </div>
                <div class="staff-level">${levelStars}</div>
            </div>
            
            <div class="staff-card-details">
                <div class="staff-speciality">${staff.speciality || 'Specjalista'}</div>
                <div class="staff-experience">Doświadczenie: ${staff.experience_years || 0} lat</div>
                ${contractInfo}
            </div>
            
            <div class="staff-card-footer">
                <div class="staff-salary">$${staff.salary}/tydzień</div>
                ${isCurrent ? 
                    `<button class="btn btn-small btn-danger" onclick="releaseStaff(${staff.id})">
                        Zwolnij ($${staff.release_cost || staff.salary * 2})
                    </button>` :
                    `<button class="btn btn-small btn-success" onclick="hireStaff(${staff.id})">
                        Zatrudnij ($${staff.hire_cost})
                    </button>`
                }
            </div>
        </div>
    `;
}

/**
 * Inicjalizuje modal rynku transferowego
 */
function initMarketModal() {
    const modal = document.getElementById('staff-market-modal');
    const closeBtn = modal.querySelector('.close-modal');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Wypełnij narodowości
    const nationalitySelect = document.getElementById('filter-nationality');
    const nationalities = [
        'Polska', 'Niemcy', 'Francja', 'Hiszpania', 'Włochy', 
        'USA', 'Rosja', 'Turcja', 'Litwa', 'Grecja'
    ];
    
    nationalities.forEach(nat => {
        const option = document.createElement('option');
        option.value = nat;
        option.textContent = `${getFlagEmoji(nat)} ${nat}`;
        nationalitySelect.appendChild(option);
    });

    // Event listener dla filtrów
    document.getElementById('apply-filters').addEventListener('click', () => {
        loadMarketStaff();
    });
}

/**
 * Otwiera modal rynku transferowego
 */
async function openMarketModal() {
    const modal = document.getElementById('staff-market-modal');
    modal.style.display = 'block';
    await loadMarketStaff();
}

/**
 * Ładuje dostępny personel z filtrami
 */
async function loadMarketStaff() {
    try {
        const roleFilter = document.getElementById('filter-role').value;
        const levelFilter = document.getElementById('filter-level').value;
        const nationalityFilter = document.getElementById('filter-nationality').value;
        const salaryFilter = document.getElementById('filter-salary').value;

        let query = supabaseClient
            .from('staff')
            .select('*')
            .is('team_id', null);

        if (roleFilter) query = query.eq('role', roleFilter);
        if (levelFilter) query = query.eq('level', parseInt(levelFilter));
        if (nationalityFilter) query = query.eq('nationality', nationalityFilter);
        if (salaryFilter) query = query.lte('salary', parseInt(salaryFilter));

        const { data, error } = await query;
        if (error) throw error;

        availableStaff = data || [];
        renderMarketStaff();
    } catch (err) {
        console.error("[STAFF] Błąd pobierania rynku:", err);
        alert('Błąd podczas ładowania rynku transferowego');
    }
}

/**
 * Renderuje listę dostępnego personelu
 */
function renderMarketStaff() {
    const container = document.getElementById('market-staff-list');
    if (!container) return;

    if (availableStaff.length === 0) {
        container.innerHTML = '<div class="empty-state">Brak dostępnego personelu dla wybranych filtrów</div>';
        return;
    }

    container.innerHTML = availableStaff.map(staff => renderStaffCard(staff, false)).join('');
}

/**
 * Zatrudnia personel
 */
window.hireStaff = async function(staffId) {
    const staff = availableStaff.find(s => s.id === staffId);
    if (!staff) {
        alert('Nie znaleziono personelu');
        return;
    }

    if (currentTeam.budget < staff.hire_cost) {
        alert('Nie masz wystarczających środków na zatrudnienie!');
        return;
    }

    if (!confirm(`Zatrudnić ${staff.first_name} ${staff.last_name} za $${staff.hire_cost}?`)) return;

    try {
        const [updateRes, budgetRes] = await Promise.all([
            supabaseClient
                .from('staff')
                .update({ 
                    team_id: currentTeam.id,
                    contract_weeks: 52
                })
                .eq('id', staffId),
            supabaseClient
                .from('teams')
                .update({ budget: currentTeam.budget - staff.hire_cost })
                .eq('id', currentTeam.id)
        ]);

        if (updateRes.error) throw updateRes.error;
        if (budgetRes.error) throw budgetRes.error;

        // Aktualizuj stan gry
        currentTeam.budget -= staff.hire_cost;
        
        alert('Personel zatrudniony pomyślnie!');
        
        // Odśwież widoki
        await fetchTeamStaff(currentTeam.id);
        renderCurrentStaff();
        await loadMarketStaff();
        
        // Odśwież statystyki budżetu
        document.querySelector('.budget-value').textContent = `$${currentTeam.budget}`;
        
    } catch (err) {
        console.error("[STAFF] Błąd zatrudniania:", err);
        alert('Błąd podczas zatrudniania personelu');
    }
};

/**
 * Zwolnienie personelu
 */
window.releaseStaff = async function(staffId) {
    const staff = currentStaff.find(s => s.id === staffId);
    if (!staff) return;

    const releaseCost = staff.release_cost || staff.salary * 2;
    
    if (!confirm(`Zwolnić ${staff.first_name} ${staff.last_name}? Koszt zwolnienia: $${releaseCost}`)) return;

    try {
        const [updateRes, budgetRes] = await Promise.all([
            supabaseClient
                .from('staff')
                .update({ 
                    team_id: null,
                    contract_weeks: null
                })
                .eq('id', staffId),
            supabaseClient
                .from('teams')
                .update({ budget: currentTeam.budget - releaseCost })
                .eq('id', currentTeam.id)
        ]);

        if (updateRes.error) throw updateRes.error;
        if (budgetRes.error) throw budgetRes.error;

        currentTeam.budget -= releaseCost;
        alert('Personel zwolniony');
        
        await fetchTeamStaff(currentTeam.id);
        renderCurrentStaff();
        
    } catch (err) {
        console.error("[STAFF] Błąd zwalniania:", err);
        alert('Błąd podczas zwalniania personelu');
    }
};

/**
 * Pomocnicza funkcja do emoji flag
 */
function getFlagEmoji(country) {
    const flagEmojis = {
        'Polska': '🇵🇱',
        'Niemcy': '🇩🇪',
        'Francja': '🇫🇷',
        'Hiszpania': '🇪🇸',
        'Włochy': '🇮🇹',
        'USA': '🇺🇸',
        'Belgia': '🇧🇪',
        'Turcja': '🇹🇷',
        'Litwa': '🇱🇹',
        'Grecja': '🇬🇷'
    };
    return flagEmojis[country] || '🏳️';
}

/**
 * Oblicza całkowity koszt pensji
 */
function calculateTotalSalary() {
    return currentStaff.reduce((sum, staff) => sum + staff.salary, 0);
}
