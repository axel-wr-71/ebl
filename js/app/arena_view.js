// js/app/arena_view.js
import { supabaseClient } from '../auth.js';

// Konfiguracja obiektów (można przenieść do bazy w przyszłości)
const FACILITY_CONFIG = {
    'parking': {
        name: 'Parking Strefowy',
        icon: '🚗',
        desc: 'Zwiększa maksymalną frekwencję o 5% na poziom.',
        baseCost: 50000,
        maxLevel: 10
    },
    'store': {
        name: 'Official Fan Store',
        icon: '👕',
        desc: 'Generuje dodatkowy przychód $2/widza na poziom.',
        baseCost: 75000,
        maxLevel: 5
    },
    'food': {
        name: 'Gastro Corner',
        icon: '🍔',
        desc: 'Zwiększa zadowolenie i przychód $1.5/widza na poziom.',
        baseCost: 40000,
        maxLevel: 8
    },
    'vip': {
        name: 'Loża VIP',
        icon: '💎',
        desc: 'Przyciąga sponsorów. +$1000 stałego przychodu na mecz.',
        baseCost: 150000,
        maxLevel: 3
    }
};

/**
 * Główna funkcja renderująca widok Areny
 */
export async function renderArenaView(team, players) {
    const container = document.getElementById('app-main-view');
    
    // 1. Pobierz dane infrastruktury z bazy
    const facilities = await fetchFacilities(team.id);
    
    // 2. Renderowanie HTML
    container.innerHTML = `
        <div class="arena-wrapper">
            <!-- HEADER -->
            <div class="arena-header">
                <div class="arena-info">
                    <h1>Sports Arena</h1>
                    <p>Zarządzaj domem swojej drużyny: ${team.team_name}</p>
                </div>
                <div class="arena-stats-summary">
                    <div class="stat-box">
                        <span class="stat-value" id="header-capacity">${team.arena_capacity.toLocaleString()}</span>
                        <span class="stat-label">Pojemność</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value" id="header-fans">${team.fan_base_size.toLocaleString()}</span>
                        <span class="stat-label">Fan Base</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value" style="color: #4ade80;">$${formatMoney(team.balance)}</span>
                        <span class="stat-label">Budżet</span>
                    </div>
                </div>
            </div>

            <div class="arena-grid">
                <!-- LEWA KOLUMNA: Zarządzanie -->
                <div class="arena-col-main">
                    
                    <!-- FACILITIES -->
                    <div class="arena-section-card">
                        <div class="section-title">
                            <span>🏗️</span> Infrastruktura
                        </div>
                        <div class="facilities-grid">
                            ${renderFacilities(facilities, team.balance)}
                        </div>
                    </div>

                    <!-- ROZBUDOWA HALI -->
                    <div class="arena-section-card">
                        <div class="section-title">
                            <span>🏟️</span> Trybuny i Pojemność
                        </div>
                        <p style="color: #64748b; margin-bottom: 20px;">Aktualna pojemność hali. Rozbudowa zwiększa liczbę dostępnych biletów.</p>
                        
                        <div class="capacity-visual">
                            <div class="capacity-fill" style="width: ${(team.arena_capacity / 25000) * 100}%"></div>
                        </div>
                        <div class="capacity-labels">
                            <span>0</span>
                            <span>Obecnie: ${team.arena_capacity}</span>
                            <span>Max: 25,000</span>
                        </div>

                        <div style="margin-top: 25px; display: flex; gap: 15px; align-items: center; background: #f8fafc; padding: 15px; border-radius: 10px;">
                            <div>
                                <h4 style="margin: 0; color: #1a237e;">Rozbuduj Sektor (+500 miejsc)</h4>
                                <p style="margin: 5px 0 0; font-size: 0.85rem; color: #64748b;">Koszt: $${calculateSeatUpgradeCost(team.arena_capacity).toLocaleString()}</p>
                            </div>
                            <button class="btn btn-primary" id="btn-expand-arena" style="margin-left: auto;">
                                Rozbuduj
                            </button>
                        </div>
                    </div>
                </div>

                <!-- PRAWA KOLUMNA: Bilety -->
                <div class="arena-col-side">
                    <div class="arena-section-card">
                        <div class="section-title">
                            <span>🎫</span> Ceny Biletów
                        </div>
                        <div class="ticket-control">
                            <label style="font-weight: 600; color: #475569;">Cena za mecz ligowy</label>
                            <div class="ticket-price-display">$<span id="price-display">${team.ticket_price}</span></div>
                            
                            <input type="range" min="5" max="200" value="${team.ticket_price}" class="modern-slider" id="ticket-slider">
                            
                            <div class="attendance-prediction">
                                <span>Est. Frekwencja:</span>
                                <strong id="prediction-value" style="color: #1a237e;">Obliczanie...</strong>
                            </div>
                        </div>
                        <button class="btn" id="btn-save-ticket" style="width: 100%; margin-top: 20px; background: #f58426;">
                            Zatwierdź Cenę
                        </button>
                    </div>

                    <!-- INFO -->
                    <div class="arena-section-card">
                        <div class="section-title">
                            <span>ℹ️</span> Status Obiektu
                        </div>
                        <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #475569; line-height: 2;">
                            <li><strong>Nazwa:</strong> ${team.team_name} Arena</li>
                            <li><strong>Średnia frekwencja:</strong> ${(team.arena_capacity * 0.85).toFixed(0)} (ost. 5 meczy)</li>
                            <li><strong>Przychód z biletów:</strong> $${(team.arena_capacity * 0.85 * team.ticket_price).toLocaleString()} / mecz</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 3. Podpięcie Event Listenerów
    attachEventListeners(team, facilities);
}

/**
 * Renderuje karty infrastruktury
 */
function renderFacilities(facilities, currentBalance) {
    return Object.entries(FACILITY_CONFIG).map(([key, config]) => {
        // Znajdź obecny poziom w danych z bazy lub ustaw 0
        const userFacility = facilities.find(f => f.facility_type === key) || { level: 0 };
        const currentLevel = userFacility.level;
        const nextLevel = currentLevel + 1;
        const isMaxed = currentLevel >= config.maxLevel;
        
        const cost = Math.floor(config.baseCost * Math.pow(1.5, currentLevel));
        const canAfford = currentBalance >= cost;

        return `
            <div class="facility-card">
                <span class="facility-level">${currentLevel}</span>
                <div class="facility-icon">${config.icon}</div>
                <div class="facility-name">${config.name}</div>
                <div class="facility-desc">${config.desc}</div>
                
                ${!isMaxed ? `
                    <button class="btn-upgrade ${canAfford ? '' : 'locked'}" 
                            data-type="${key}" 
                            data-cost="${cost}"
                            ${canAfford ? '' : 'disabled'}>
                        ${canAfford ? 'Awansuj' : 'Brak środków'} ($${formatMoney(cost)})
                    </button>
                ` : `
                    <button class="btn-upgrade locked" disabled>MAX LEVEL</button>
                `}
            </div>
        `;
    }).join('');
}

/**
 * Obsługa zdarzeń
 */
function attachEventListeners(team, facilities) {
    // Slider cen biletów
    const slider = document.getElementById('ticket-slider');
    const display = document.getElementById('price-display');
    const prediction = document.getElementById('prediction-value');

    const updatePrediction = (price) => {
        // Prosta logika: wyższa cena = niższa frekwencja (względem bazy fanów)
        // To jest symulacja wizualna
        const ratio = Math.max(0.3, 1 - (price / 250)); // Im drożej tym mniej %
        const predicted = Math.floor(Math.min(team.arena_capacity, team.fan_base_size * ratio));
        prediction.textContent = `${predicted.toLocaleString()} fanów`;
    };

    slider.addEventListener('input', (e) => {
        display.textContent = e.target.value;
        updatePrediction(e.target.value);
    });
    
    // Inicjalizacja predykcji
    updatePrediction(team.ticket_price);

    // Zapisywanie ceny
    document.getElementById('btn-save-ticket').addEventListener('click', async () => {
        const newPrice = parseInt(slider.value);
        await updateTicketPrice(team.id, newPrice);
    });

    // Rozbudowa hali
    document.getElementById('btn-expand-arena').addEventListener('click', async () => {
        const cost = calculateSeatUpgradeCost(team.arena_capacity);
        if (team.balance >= cost) {
            if(confirm(`Czy na pewno chcesz rozbudować halę za $${formatMoney(cost)}?`)) {
                await expandArena(team.id, cost, team.arena_capacity);
            }
        } else {
            alert("Brak wystarczających środków!");
        }
    });

    // Upgrade infrastruktury
    document.querySelectorAll('.btn-upgrade').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (e.target.disabled) return;
            
            const type = e.target.dataset.type;
            const cost = parseInt(e.target.dataset.cost);
            
            if(confirm(`Ulepszyć ${FACILITY_CONFIG[type].name} za $${formatMoney(cost)}?`)) {
                await upgradeFacility(team.id, type, cost);
            }
        });
    });
}

// --- FUNKCJE API ---

async function fetchFacilities(teamId) {
    const { data, error } = await supabaseClient
        .from('arena_facilities')
        .select('*')
        .eq('team_id', teamId);
    
    if (error) {
        console.error('Error fetching facilities:', error);
        return [];
    }
    return data || [];
}

async function updateTicketPrice(teamId, price) {
    const { error } = await supabaseClient
        .from('teams')
        .update({ ticket_price: price })
        .eq('id', teamId);

    if (error) alert("Błąd zapisu!");
    else alert("Cena biletów zaktualizowana!");
}

async function expandArena(teamId, cost, currentCapacity) {
    // Transakcja: odejmij kasę, dodaj miejsca
    // Uwaga: w realnej aplikacji zrób to przez funkcję RPC w bazie dla atomowości
    const newCapacity = currentCapacity + 500;
    
    // 1. Odejmij kasę (uproszczone)
    // W produkcji: wywołaj RPC 'purchase_arena_expansion'
    
    const { error } = await supabaseClient
        .from('teams')
        .update({ 
            arena_capacity: newCapacity,
            balance: window.gameState.team.balance - cost // Lokalne obliczenie dla demo
        })
        .eq('id', teamId);

    if (error) {
        alert("Błąd rozbudowy: " + error.message);
    } else {
        alert("Hala rozbudowana!");
        location.reload(); // Odśwież widok
    }
}

async function upgradeFacility(teamId, type, cost) {
    // Sprawdź czy rekord istnieje
    const { data: existing } = await supabaseClient
        .from('arena_facilities')
        .select('*')
        .eq('team_id', teamId)
        .eq('facility_type', type)
        .single();
    
    let error;
    
    // Aktualizuj balans (tutaj uproszczenie, powinno być RPC)
    await supabaseClient.from('teams').update({
        balance: window.gameState.team.balance - cost
    }).eq('id', teamId);

    if (existing) {
        // Update
        ({ error } = await supabaseClient
            .from('arena_facilities')
            .update({ level: existing.level + 1 })
            .eq('id', existing.id));
    } else {
        // Insert
        ({ error } = await supabaseClient
            .from('arena_facilities')
            .insert({
                team_id: teamId,
                facility_type: type,
                level: 1
            }));
    }

    if (error) {
        alert("Błąd ulepszania: " + error.message);
    } else {
        alert("Ulepszenie zakończone sukcesem!");
        location.reload();
    }
}

// --- HELPERS ---

function formatMoney(amount) {
    return amount.toLocaleString('en-US');
}

function calculateSeatUpgradeCost(currentCapacity) {
    // Im większa hala, tym droższa rozbudowa
    return Math.floor(100000 * Math.pow(currentCapacity / 5000, 1.2));
}
