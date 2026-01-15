// js/app/market_view.js
import { supabaseClient } from '../auth.js';
import { calculateMarketValue } from '../core/economy.js';

// Mapa nazw umiejętności zgodna z Twoim systemem (1-15)
const skillNames = {
    1: "okropny", 2: "żałosny", 3: "tragiczny", 4: "słaby", 5: "przeciętny",
    6: "ponadprzeciętny", 7: "porządny", 8: "solidny", 9: "sprawny", 10: "znaczący",
    11: "wybitny", 12: "wspaniały", 13: "świetny", 14: "niesamowity", 15: "cudowny"
};

/**
 * Główna funkcja renderująca widok rynku
 */
export async function renderMarketView(teamData) {
    const container = document.getElementById('market-container');
    if (!container) return;

    // Struktura strony z jasnym tłem i nowoczesnymi filtrami
    container.innerHTML = `
        <div class="market-modern-container">
            <header class="market-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
                    <div>
                        <h1>Rynek Transferowy</h1>
                        <p class="budget-display">Twój aktualny budżet: <strong>$${teamData.balance.toLocaleString()}</strong></p>
                    </div>
                    <div style="font-size: 0.8rem; color: #64748b; padding-bottom: 10px;">
                        Status ligi: <span style="color: #15803d; font-weight: bold;">OKIENKO OTWARTE</span>
                    </div>
                </div>
            </header>

            <section class="filter-section">
                <div class="filter-group">
                    <div class="filter-item">
                        <label>Pozycja</label>
                        <select id="f-pos">
                            <option value="">Wszystkie</option>
                            <option value="PG">PG - Rozgrywający</option>
                            <option value="SG">SG - Rzucający obrońca</option>
                            <option value="SF">SF - Niski skrzydłowy</option>
                            <option value="PF">PF - Silny skrzydłowy</option>
                            <option value="C">C - Środkowy</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label>Max OVR</label>
                        <input type="number" id="f-max-ovr" placeholder="Np. 85">
                    </div>
                    <div class="filter-item">
                        <label>Min Wiek</label>
                        <input type="number" id="f-min-age" placeholder="18">
                    </div>
                    <div class="filter-item">
                        <label>Max Cena ($)</label>
                        <input type="number" id="f-max-price" placeholder="Np. 1000000">
                    </div>
                    <button id="btn-search-market" class="btn-primary">SZUKAJ ZAWODNIKÓW</button>
                </div>
            </section>

            <div id="market-listings" class="listings-grid">
                </div>
        </div>
    `;

    // Podpięcie wyszukiwania
    document.getElementById('btn-search-market').onclick = () => loadMarketData();
    
    // Inicjalne załadowanie danych
    await loadMarketData();
}

/**
 * Pobiera dane z Supabase i filtruje je
 */
async function loadMarketData() {
    const list = document.getElementById('market-listings');
    if (!list) return;

    list.innerHTML = '<div class="loader-box">Trwa skanowanie ofert rynkowych...</div>';

    try {
        const { data, error } = await supabaseClient
            .from('transfer_market')
            .select('*, players(*)')
            .eq('status', 'active');

        if (error) throw error;

        const fPos = document.getElementById('f-pos').value;
        const fMaxOvr = document.getElementById('f-max-ovr').value;
        const fMinAge = document.getElementById('f-min-age').value;
        const fMaxPrice = document.getElementById('f-max-price').value;

        // Filtracja po stronie klienta
        const filtered = data.filter(item => {
            const p = item.players;
            if (!p) return false;
            return (!fPos || p.position === fPos) &&
                   (!fMaxOvr || p.overall_rating <= parseInt(fMaxOvr)) &&
                   (!fMinAge || p.age >= parseInt(fMinAge)) &&
                   (!fMaxPrice || item.current_price <= parseInt(fMaxPrice));
        });

        if (filtered.length === 0) {
            list.innerHTML = '<div class="no-results">Brak zawodników spełniających kryteria.</div>';
            return;
        }

        list.innerHTML = filtered.map(item => renderPlayerCard(item)).join('');

    } catch (err) {
        console.error("Market error:", err);
        list.innerHTML = `<div class="error-msg">Błąd bazy danych: ${err.message}</div>`;
    }
}

/**
 * Generuje HTML pojedynczej karty zawodnika
 */
function renderPlayerCard(item) {
    const p = item.players;
    const marketVal = calculateMarketValue(p);
    
    // Pomocnicza funkcja do etykiet umiejętności
    const s = (val) => {
        let colorClass = "level-normal";
        if (val >= 10) colorClass = "level-high"; // Znaczący i wyżej - pomarańczowy/złoty
        if (val <= 4) colorClass = "level-low";  // Słabi - czerwony
        
        return `<span class="skill-tag ${colorClass}">${skillNames[val] || 'nieznany'} (${val})</span>`;
    };

    return `
        <div class="player-card-modern">
            <div class="card-top">
                <div class="avatar-circle">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.last_name}">
                </div>
                <div class="main-meta">
                    <div class="name-row">
                        <span class="p-id">#${p.id}</span>
                        <h3>${p.first_name} ${p.last_name}</h3>
                    </div>
                    <p class="sub-meta">${p.position} | ${p.age} lata | ${p.height} cm | Potencjał: <strong>${p.potential}</strong></p>
                </div>
                <div class="ovr-badge">${p.overall_rating}</div>
            </div>

            <div class="card-body-skills">
                <div class="skills-column">
                    <div class="skill-row"><span>Rzut z wyskoku:</span> ${s(p.jump_shot)}</div>
                    <div class="skill-row"><span>Zasięg rzutu:</span> ${s(p.range)}</div>
                    <div class="skill-row"><span>Obr. na obwodzie:</span> ${s(p.outside_def)}</div>
                    <div class="skill-row"><span>Kozłowanie:</span> ${s(p.handling)}</div>
                    <div class="skill-row"><span>Jeden na jeden:</span> ${s(p.driving)}</div>
                </div>
                <div class="skills-column">
                    <div class="skill-row"><span>Podania:</span> ${s(p.passing)}</div>
                    <div class="skill-row"><span>Rzut z bliska:</span> ${s(p.inside_shot)}</div>
                    <div class="skill-row"><span>Obr. pod koszem:</span> ${s(p.inside_def)}</div>
                    <div class="skill-row"><span>Zbieranie:</span> ${s(p.rebounding)}</div>
                    <div class="skill-row"><span>Blokowanie:</span> ${s(p.blocking)}</div>
                </div>
            </div>

            <div class="card-action-footer">
                <div class="financials">
                    <div class="current-bid">
                        <span class="fin-label">Aktualna oferta:</span>
                        <span class="fin-value">$${item.current_price.toLocaleString()}</span>
                    </div>
                    <div class="market-est">
                        Wycena managera: $${marketVal.toLocaleString()}
                    </div>
                </div>
                <button class="bid-button" onclick="handleBid('${item.id}', ${item.current_price})">
                    ZŁÓŻ OFERTĘ
                </button>
            </div>
        </div>
    `;
}

// Funkcja licytacji (do rozbudowy w kolejnym kroku)
window.handleBid = async function(listingId, currentPrice) {
    const bid = prompt(`Podaj swoją ofertę (musi być wyższa niż $${currentPrice.toLocaleString()}):`, currentPrice + 1000);
    if (bid && parseInt(bid) > currentPrice) {
        alert("Funkcja licytacji zostanie wkrótce podpięta pod bazę!");
    }
};
