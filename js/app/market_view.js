// js/app/market_view.js
import { supabaseClient } from '../auth.js';
import { calculatePlayerDynamicWage, calculateMarketValue } from '../core/economy.js';

export async function renderMarketView(teamData) {
    const container = document.getElementById('main-content'); // Upewnij się, że to Twój kontener
    if (!container) return;

    container.innerHTML = `
        <div class="market-wrapper" style="padding: 20px; background: #0f172a; color: white; min-height: 100vh; font-family: 'Inter', sans-serif;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 2em; letter-spacing: -1px;">RYNEK <span style="color: #38bdf8;">TRANSFEROWY</span></h1>
                <div style="background: rgba(56, 189, 248, 0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2);">
                    PORTFEL: <span style="color: #22c55e; font-weight: 800;">$${teamData.balance.toLocaleString()}</span>
                </div>
            </div>

            <div class="filter-panel" style="background: rgba(30, 41, 59, 0.7); padding: 20px; border-radius: 16px; display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <select id="f-pos" style="background: #0f172a; color: white; border: 1px solid #334155; padding: 10px; border-radius: 8px;">
                    <option value="">Wszystkie Pozycje</option>
                    <option value="PG">PG - Rozgrywający</option>
                    <option value="SG">SG - Obrońca</option>
                    <option value="SF">SF - Skrzydłowy</option>
                    <option value="PF">PF - Silny Skrzydłowy</option>
                    <option value="C">C - Środkowy</option>
                </select>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label style="font-size: 0.8em; color: #94a3b8;">MAX OVR:</label>
                    <input type="number" id="f-max-ovr" placeholder="99" style="width: 70px; background: #0f172a; color: white; border: 1px solid #334155; padding: 10px; border-radius: 8px;">
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label style="font-size: 0.8em; color: #94a3b8;">MIN WIEK:</label>
                    <input type="number" id="f-min-age" placeholder="18" style="width: 70px; background: #0f172a; color: white; border: 1px solid #334155; padding: 10px; border-radius: 8px;">
                </div>
                <button id="btn-search" style="background: #38bdf8; color: #0f172a; border: none; padding: 10px 25px; border-radius: 8px; font-weight: 700; cursor: pointer;">FILTRUJ</button>
            </div>

            <div id="market-listings" style="display: flex; flex-direction: column; gap: 12px;">
                </div>
        </div>
    `;

    document.getElementById('btn-search').addEventListener('click', () => loadMarketData());
    loadMarketData();
}

async function loadMarketData() {
    const list = document.getElementById('market-listings');
    const fPos = document.getElementById('f-pos').value;
    const fMaxOvr = document.getElementById('f-max-ovr').value;
    const fMinAge = document.getElementById('f-min-age').value;

    list.innerHTML = `<div style="text-align: center; padding: 50px; color: #94a3b8;">Szukanie najlepszych talentów...</div>`;

    let query = supabaseClient.from('transfer_market').select('*, players(*)').eq('status', 'active');
    
    // Zastosowanie Twoich filtrów
    if (fPos) query = query.eq('players.position', fPos);
    
    const { data: listings, error } = await query;

    if (error || !listings) return;

    // Filtrowanie po stronie klienta dla OVR i Wieku (Supabase ma ograniczenia przy joinach)
    const filtered = listings.filter(item => {
        const p = item.players;
        const matchMaxOvr = fMaxOvr ? p.overall_rating <= parseInt(fMaxOvr) : true;
        const matchMinAge = fMinAge ? p.age >= parseInt(fMinAge) : true;
        return matchMaxOvr && matchMinAge;
    });

    list.innerHTML = filtered.map(item => renderPlayerRow(item)).join('');
}

function renderPlayerRow(item) {
    const p = item.players;
    const isSystemSale = item.seller_id === null; // Wolni agenci od systemu
    const marketValue = calculateMarketValue(p);
    
    // Mini wykresy - definicja słupków (SHT, DEF, SPD, PAS, REB)
    const skills = [
        { label: 'SHT', val: p.shooting || 60, color: '#f87171' },
        { label: 'DEF', val: p.defense || 60, color: '#38bdf8' },
        { label: 'SPD', val: p.speed || 60, color: '#fbbf24' },
        { label: 'PAS', val: p.passing || 60, color: '#c084fc' },
        { label: 'REB', val: p.rebounding || 60, color: '#4ade80' }
    ];

    return `
        <div class="market-row" style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px 25px; display: grid; grid-template-columns: 60px 200px 1fr 200px 160px; align-items: center; transition: 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(51, 65, 85, 0.6)'" onmouseout="this.style.background='rgba(30, 41, 59, 0.4)'">
            
            <div style="width: 50px; height: 50px; border-radius: 50%; background: #334155; border: 2px solid #38bdf8; overflow: hidden;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.last_name}" style="width: 100%; height: 100%;">
            </div>

            <div>
                <div style="font-weight: 800; font-size: 1.1em;">${p.last_name}</div>
                <div style="font-size: 0.75em; color: #94a3b8;">${p.position} | AGE: ${p.age} | <span style="color: #38bdf8;">OVR ${p.overall_rating}</span></div>
            </div>

            <div style="display: flex; gap: 10px; align-items: flex-end; height: 40px; justify-content: center;">
                ${skills.map(s => `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <div style="width: 12px; height: 35px; background: #0f172a; border-radius: 2px; position: relative;">
                            <div style="position: absolute; bottom: 0; width: 100%; height: ${s.val}%; background: ${s.color}; border-radius: 2px; box-shadow: 0 0 10px ${s.color}44;"></div>
                        </div>
                        <span style="font-size: 0.5em; color: #64748b; font-weight: 800;">${s.label}</span>
                    </div>
                `).join('')}
            </div>

            <div style="text-align: right; padding-right: 20px;">
                <div style="font-size: 0.7em; color: #94a3b8; text-transform: uppercase;">Aktualna Oferta</div>
                <div style="font-size: 1.3em; font-weight: 900; color: #fbbf24;">$${item.current_price.toLocaleString()}</div>
                <div style="font-size: 0.65em; color: #64748b;">Wycena: $${marketValue.toLocaleString()}</div>
            </div>

            <button onclick="handleBid('${item.id}')" style="background: #38bdf8; color: #0f172a; border: none; padding: 12px; border-radius: 8px; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 0.8em;">
                Licytuj
            </button>
        </div>
    `;
}
